import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../app/api/files/ticket/route";
import { verifyToken } from "../lib/files-signing";
import { NextRequest } from "next/server";

vi.mock("@/lib/supabase-admin", () => {
  return {
    supabaseAdmin: {
      auth: {
        getUser: vi.fn(),
      },
      from: vi.fn(),
    },
  };
});

import { supabaseAdmin } from "@/lib/supabase-admin";

const mockGetUser = vi.mocked(supabaseAdmin.auth.getUser);
const mockFrom = vi.mocked(supabaseAdmin.from);

const TEST_SECRET = "test-signing-secret-key-1234567890abcdef";
process.env.LINK_SIGNING_SECRET = TEST_SECRET;

describe("POST /api/files/ticket", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("mints upload ticket with 120s expiry and inserts into upload_tickets", async () => {
    const user = { id: "user-abc", email: "user@example.com" };
    mockGetUser.mockResolvedValue({
      data: { user: user as unknown },
      error: null,
    } as unknown as Awaited<ReturnType<typeof supabaseAdmin.auth.getUser>>);

    const insertMock = vi.fn().mockResolvedValue({ error: null });
    const deleteMock = vi.fn().mockReturnValue({
      lt: vi.fn().mockReturnValue(Promise.resolve()),
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "files") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null }),
              }),
            }),
          }),
        } as unknown as ReturnType<typeof supabaseAdmin.from>;
      }
      if (table === "users") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: { role: "student" } }),
            }),
          }),
        } as unknown as ReturnType<typeof supabaseAdmin.from>;
      }
      if (table === "upload_tickets") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              gte: vi.fn().mockResolvedValue({ count: 5, error: null }),
            }),
          }),
          insert: insertMock,
          delete: deleteMock,
        } as unknown as ReturnType<typeof supabaseAdmin.from>;
      }
      return {} as unknown as ReturnType<typeof supabaseAdmin.from>;
    });

    const req = new NextRequest("http://localhost:3000/api/files/ticket", {
      method: "POST",
      headers: {
        Authorization: "Bearer valid-token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "document.pdf",
        size: 1024,
        sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.duplicate).toBe(false);
    expect(json.ticket).toBeTruthy();

    const decoded = verifyToken(json.ticket, "up", TEST_SECRET);
    expect(decoded).not.toBeNull();
    const nowSec = Math.floor(Date.now() / 1000);
    // Expiration should be within 120 seconds of now
    expect(decoded!.exp - nowSec).toBeLessThanOrEqual(120);
    expect(decoded!.exp - nowSec).toBeGreaterThanOrEqual(115);

    expect(insertMock).toHaveBeenCalledWith({ uid: "user-abc" });
  });

  it("returns 429 when UPLOAD_DAILY_LIMIT is exceeded for non-admin", async () => {
    process.env.UPLOAD_DAILY_LIMIT = "2";
    const user = { id: "user-rate-limited", email: "user@example.com" };
    mockGetUser.mockResolvedValue({
      data: { user: user as unknown },
      error: null,
    } as unknown as Awaited<ReturnType<typeof supabaseAdmin.auth.getUser>>);

    mockFrom.mockImplementation((table: string) => {
      if (table === "files") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null }),
              }),
            }),
          }),
        } as unknown as ReturnType<typeof supabaseAdmin.from>;
      }
      if (table === "users") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: { role: "student" } }),
            }),
          }),
        } as unknown as ReturnType<typeof supabaseAdmin.from>;
      }
      if (table === "upload_tickets") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              gte: vi.fn().mockResolvedValue({ count: 2, error: null }),
            }),
          }),
        } as unknown as ReturnType<typeof supabaseAdmin.from>;
      }
      return {} as unknown as ReturnType<typeof supabaseAdmin.from>;
    });

    const req = new NextRequest("http://localhost:3000/api/files/ticket", {
      method: "POST",
      headers: {
        Authorization: "Bearer valid-token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "test.pdf",
        size: 2048,
        sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(429);
    const json = await res.json();
    expect(json.error).toContain("Daily upload limit reached");
  });
});
