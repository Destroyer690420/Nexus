import { describe, it, expect } from "vitest";
import {
  mintToken,
  verifyToken,
  type UpPayload,
  type DlPayload,
  type RcPayload,
} from "../lib/files-signing";

const TEST_SECRET = "test-signing-secret-key-1234567890abcdef";

describe("files-signing (lib/files-signing.ts)", () => {
  it("mints and verifies an upload ticket (typ: 'up')", () => {
    const now = Math.floor(Date.now() / 1000);
    const payload: UpPayload = {
      typ: "up",
      uid: "user-123",
      maxBytes: 15_000_000,
      exp: now + 300,
    };

    const token = mintToken(payload, TEST_SECRET);
    expect(token).toBeTruthy();
    expect(token).toContain(".");

    const verified = verifyToken(token, "up", TEST_SECRET);
    expect(verified).not.toBeNull();
    expect(verified?.uid).toBe("user-123");
    expect(verified?.maxBytes).toBe(15_000_000);
  });

  it("mints and verifies a download token (typ: 'dl')", () => {
    const now = Math.floor(Date.now() / 1000);
    const payload: DlPayload = {
      typ: "dl",
      fid: "tg-file-abc",
      name: "notes.pdf",
      mime: "application/pdf",
      size: 1024,
      disp: "inline",
      exp: now + 600,
    };

    const token = mintToken(payload, TEST_SECRET);
    const verified = verifyToken(token, "dl", TEST_SECRET);
    expect(verified).not.toBeNull();
    expect(verified?.fid).toBe("tg-file-abc");
    expect(verified?.name).toBe("notes.pdf");
    expect(verified?.disp).toBe("inline");
  });

  it("mints and verifies a receipt token (typ: 'rc')", () => {
    const now = Math.floor(Date.now() / 1000);
    const payload: RcPayload = {
      typ: "rc",
      fid: "tg-file-xyz",
      mid: 42,
      uid: "user-456",
      name: "exam.pdf",
      mime: "application/pdf",
      size: 2048,
      sha: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      exp: now + 900,
    };

    const token = mintToken(payload, TEST_SECRET);
    const verified = verifyToken(token, "rc", TEST_SECRET);
    expect(verified).not.toBeNull();
    expect(verified?.fid).toBe("tg-file-xyz");
    expect(verified?.mid).toBe(42);
    expect(verified?.sha).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    );
  });

  it("rejects token with expired exp", () => {
    const past = Math.floor(Date.now() / 1000) - 60;
    const payload: UpPayload = {
      typ: "up",
      uid: "user-123",
      maxBytes: 1000,
      exp: past,
    };

    const token = mintToken(payload, TEST_SECRET);
    const verified = verifyToken(token, "up", TEST_SECRET);
    expect(verified).toBeNull();
  });

  it("rejects token with wrong typ", () => {
    const now = Math.floor(Date.now() / 1000);
    const payload: UpPayload = {
      typ: "up",
      uid: "user-123",
      maxBytes: 1000,
      exp: now + 300,
    };

    const token = mintToken(payload, TEST_SECRET);
    const verified = verifyToken(token, "dl", TEST_SECRET);
    expect(verified).toBeNull();
  });

  it("rejects token with wrong secret", () => {
    const now = Math.floor(Date.now() / 1000);
    const payload: UpPayload = {
      typ: "up",
      uid: "user-123",
      maxBytes: 1000,
      exp: now + 300,
    };

    const token = mintToken(payload, TEST_SECRET);
    const verified = verifyToken(token, "up", "different-secret");
    expect(verified).toBeNull();
  });

  it("rejects tampered token", () => {
    const now = Math.floor(Date.now() / 1000);
    const payload: UpPayload = {
      typ: "up",
      uid: "user-123",
      maxBytes: 1000,
      exp: now + 300,
    };

    const token = mintToken(payload, TEST_SECRET);
    const [p, sig] = token.split(".");
    // Tamper with signature
    const tamperedSig = sig.slice(0, -2) + (sig.endsWith("a") ? "b" : "a");
    expect(verifyToken(`${p}.${tamperedSig}`, "up", TEST_SECRET)).toBeNull();

    // Tamper with payload
    const tamperedPayload = Buffer.from(
      JSON.stringify({ ...payload, maxBytes: 99999999 })
    ).toString("base64url");
    expect(verifyToken(`${tamperedPayload}.${sig}`, "up", TEST_SECRET)).toBeNull();
  });

  it("interoperates seamlessly with gateway/lib/token.js in both directions", async () => {
    // Dynamic import gateway token module
    const gatewayToken = await import("../gateway/lib/token.js");

    const now = Math.floor(Date.now() / 1000);
    const payload: DlPayload = {
      typ: "dl",
      fid: "tg-interop-test",
      name: "document.pdf",
      mime: "application/pdf",
      size: 4096,
      disp: "inline",
      exp: now + 500,
    };

    // 1. Mint in gateway, verify in Node
    const gatewayMinted = await gatewayToken.mintToken(payload, TEST_SECRET);
    const verifiedInNode = verifyToken(gatewayMinted, "dl", TEST_SECRET);
    expect(verifiedInNode).not.toBeNull();
    expect(verifiedInNode?.fid).toBe("tg-interop-test");

    // 2. Mint in Node, verify in gateway
    const nodeMinted = mintToken(payload, TEST_SECRET);
    const verifiedInGateway = await gatewayToken.verifyToken(
      nodeMinted,
      "dl",
      TEST_SECRET
    );
    expect(verifiedInGateway).not.toBeNull();
    expect(verifiedInGateway?.fid).toBe("tg-interop-test");
  });
});
