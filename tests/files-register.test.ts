import { describe, it, expect, vi } from "vitest";
import { POST } from "../app/api/files/register/route";
import { mintToken, type RcPayload } from "../lib/files-signing";
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

describe("POST /api/files/register", () => {
  it("inserts new file row on first registration", async () => {
    const user = { id: "user-123", email: "user@example.com" };
    mockGetUser.mockResolvedValue({
      data: { user: user as unknown },
      error: null,
    } as unknown as Awaited<ReturnType<typeof supabaseAdmin.auth.getUser>>);

    const now = Math.floor(Date.now() / 1000);
    const receiptPayload: RcPayload = {
      typ: "rc",
      fid: "tg-first-fid",
      mid: 101,
      uid: user.id,
      name: "test.pdf",
      mime: "application/pdf",
      size: 5000,
      sha: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      exp: now + 300,
    };
    const receipt = mintToken(receiptPayload, TEST_SECRET);

    const insertMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: "file-uuid-1" },
          error: null,
        }),
      }),
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "files") {
        return { insert: insertMock } as unknown as ReturnType<typeof supabaseAdmin.from>;
      }
      return {} as unknown as ReturnType<typeof supabaseAdmin.from>;
    });

    const req = new NextRequest("http://localhost:3000/api/files/register", {
      method: "POST",
      headers: {
        Authorization: "Bearer valid-token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ receipt }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ fileId: "file-uuid-1" });
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        tg_file_id: "tg-first-fid",
        sha256: receiptPayload.sha,
        size_bytes: 5000,
      })
    );
  });

  it("handles unique violation (sha256, size_bytes) by returning existing id without modifying metadata", async () => {
    const user = { id: "user-123", email: "user@example.com" };
    mockGetUser.mockResolvedValue({
      data: { user: user as unknown },
      error: null,
    } as unknown as Awaited<ReturnType<typeof supabaseAdmin.auth.getUser>>);

    const now = Math.floor(Date.now() / 1000);
    const duplicateReceiptPayload: RcPayload = {
      typ: "rc",
      fid: "tg-second-different-fid",
      mid: 202,
      uid: user.id,
      name: "renamed-test.pdf",
      mime: "application/pdf",
      size: 5000,
      sha: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      exp: now + 300,
    };
    const receipt = mintToken(duplicateReceiptPayload, TEST_SECRET);

    // Mock insert failure with Postgres 23505 unique violation
    const insertMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: "23505", message: "duplicate key value violates unique constraint" },
        }),
      }),
    });

    // Mock select of existing row
    const eqSizeMock = vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({
        data: { id: "original-existing-file-id" },
        error: null,
      }),
    });
    const eqShaMock = vi.fn().mockReturnValue({
      eq: eqSizeMock,
    });
    const selectMock = vi.fn().mockReturnValue({
      eq: eqShaMock,
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "files") {
        return {
          insert: insertMock,
          select: selectMock,
        } as unknown as ReturnType<typeof supabaseAdmin.from>;
      }
      return {} as unknown as ReturnType<typeof supabaseAdmin.from>;
    });

    const req = new NextRequest("http://localhost:3000/api/files/register", {
      method: "POST",
      headers: {
        Authorization: "Bearer valid-token",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ receipt }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ fileId: "original-existing-file-id" });

    // Verify insert was attempted and select query was executed for existing file
    expect(insertMock).toHaveBeenCalled();
    expect(selectMock).toHaveBeenCalledWith("id");
    expect(eqShaMock).toHaveBeenCalledWith("sha256", duplicateReceiptPayload.sha);
    expect(eqSizeMock).toHaveBeenCalledWith("size_bytes", 5000);
  });
});
