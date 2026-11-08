/**
 * scripts/e2e-storage.mjs
 * End-to-end verification of Telegram file gateway and storage pipeline.
 * Run with: node scripts/e2e-storage.mjs
 */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

// Load environment variables from .env.local if present
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx > 0) {
      const k = trimmed.slice(0, eqIdx).trim();
      const v = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[k]) {
        process.env[k] = v;
      }
    }
  }
}

const GATEWAY_URL = (
  process.env.FILES_GATEWAY_URL ||
  process.env.NEXT_PUBLIC_GATEWAY_URL ||
  process.env.GATEWAY_URL ||
  "https://nexus-files-7b4c.pages.dev"
).replace(/\/+$/, "");

const SECRET = process.env.LINK_SIGNING_SECRET;
const BOT_TOKEN = process.env.BOT_TOKEN;
const STORAGE_CHANNEL_ID = process.env.STORAGE_CHANNEL_ID;

if (!SECRET) {
  console.error("FAIL: LINK_SIGNING_SECRET is not set in environment or .env.local");
  process.exit(1);
}

function mintToken(payload, secret = SECRET) {
  const P = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(P).digest("base64url");
  return `${P}.${sig}`;
}

function verifyToken(token, expectedTyp, secret = SECRET) {
  if (!token || typeof token !== "string") return null;
  const [P, sig] = token.split(".");
  if (!P || !sig) return null;
  const expectedSig = crypto.createHmac("sha256", secret).update(P).digest();
  const providedSig = Buffer.from(sig, "base64url");
  if (providedSig.length !== expectedSig.length) return null;
  if (!crypto.timingSafeEqual(providedSig, expectedSig)) return null;
  const payload = JSON.parse(Buffer.from(P, "base64url").toString("utf8"));
  if (payload.typ !== expectedTyp) return null;
  if (payload.exp <= Math.floor(Date.now() / 1000)) return null;
  return payload;
}

const results = [];
function record(name, pass, detail = "") {
  results.push({ name, pass, detail });
  const status = pass ? "PASS" : "FAIL";
  console.log(`[${status}] ${name} ${detail ? "- " + detail : ""}`);
}

async function main() {
  console.log("=== NEXUS STORAGE E2E VERIFICATION ===");
  console.log(`Gateway URL: ${GATEWAY_URL}`);

  let uploadedFid = null;
  let uploadedMid = null;

  // Check 1: Upload a valid 1KB test PDF with valid ticket
  const testPdfBytes = Buffer.concat([
    Buffer.from("%PDF-1.4\n%E2E Test File\n"),
    crypto.randomBytes(512),
  ]);
  const testSha256 = crypto.createHash("sha256").update(testPdfBytes).digest("hex");
  const now = Math.floor(Date.now() / 1000);
  const upTicket = mintToken({
    typ: "up",
    uid: "e2e-tester",
    maxBytes: 20_000_000,
    exp: now + 300,
  });

  try {
    const res = await fetch(`${GATEWAY_URL}/upload`, {
      method: "POST",
      headers: {
        "X-Ticket": upTicket,
        "X-File-Name": encodeURIComponent("e2e-test.pdf"),
        "X-File-Sha256": testSha256,
        "Content-Length": String(testPdfBytes.length),
      },
      body: testPdfBytes,
    });

    if (res.status === 200) {
      const data = await res.json();
      const rc = verifyToken(data.receipt, "rc");
      if (rc && rc.fid && rc.mid) {
        uploadedFid = rc.fid;
        uploadedMid = rc.mid;
        record("Check 1: Upload valid PDF with signed ticket", true, `Receipt verified (mid: ${rc.mid})`);
      } else {
        record("Check 1: Upload valid PDF with signed ticket", false, "Receipt invalid or missing fid");
      }
    } else {
      const text = await res.text();
      record("Check 1: Upload valid PDF with signed ticket", false, `Status ${res.status}: ${text}`);
    }
  } catch (e) {
    record("Check 1: Upload valid PDF with signed ticket", false, e.message);
  }

  // Check 2: Reject bad ticket signature
  try {
    const badTicket = upTicket.slice(0, -4) + "aaaa";
    const res = await fetch(`${GATEWAY_URL}/upload`, {
      method: "POST",
      headers: {
        "X-Ticket": badTicket,
        "X-File-Name": encodeURIComponent("test.pdf"),
        "X-File-Sha256": testSha256,
        "Content-Length": String(testPdfBytes.length),
      },
      body: testPdfBytes,
    });
    record("Check 2: Reject bad ticket signature", res.status === 403, `HTTP ${res.status}`);
  } catch (e) {
    record("Check 2: Reject bad ticket signature", false, e.message);
  }

  // Check 3: Reject expired ticket
  try {
    const expiredTicket = mintToken({
      typ: "up",
      uid: "e2e-tester",
      maxBytes: 10000,
      exp: now - 60,
    });
    const res = await fetch(`${GATEWAY_URL}/upload`, {
      method: "POST",
      headers: {
        "X-Ticket": expiredTicket,
        "X-File-Name": encodeURIComponent("test.pdf"),
        "X-File-Sha256": testSha256,
        "Content-Length": String(testPdfBytes.length),
      },
      body: testPdfBytes,
    });
    record("Check 3: Reject expired ticket", res.status === 403, `HTTP ${res.status}`);
  } catch (e) {
    record("Check 3: Reject expired ticket", false, e.message);
  }

  // Check 4: Reject magic byte mismatch (.pdf with PNG magic)
  try {
    const fakePdfBytes = Buffer.from("\x89PNG\r\n\x1a\nNot a real pdf");
    const fakeSha = crypto.createHash("sha256").update(fakePdfBytes).digest("hex");
    const res = await fetch(`${GATEWAY_URL}/upload`, {
      method: "POST",
      headers: {
        "X-Ticket": upTicket,
        "X-File-Name": encodeURIComponent("fake.pdf"),
        "X-File-Sha256": fakeSha,
        "Content-Length": String(fakePdfBytes.length),
      },
      body: fakePdfBytes,
    });
    record("Check 4: Reject magic byte mismatch", res.status === 415, `HTTP ${res.status}`);
  } catch (e) {
    record("Check 4: Reject magic byte mismatch", false, e.message);
  }

  // Check 5: Reject disallowed file extension (.exe)
  try {
    const exeBytes = Buffer.from("MZ\x90\x00Not allowed");
    const res = await fetch(`${GATEWAY_URL}/upload`, {
      method: "POST",
      headers: {
        "X-Ticket": upTicket,
        "X-File-Name": encodeURIComponent("danger.exe"),
        "X-File-Sha256": crypto.createHash("sha256").update(exeBytes).digest("hex"),
        "Content-Length": String(exeBytes.length),
      },
      body: exeBytes,
    });
    record("Check 5: Reject disallowed file extension", res.status === 415, `HTTP ${res.status}`);
  } catch (e) {
    record("Check 5: Reject disallowed file extension", false, e.message);
  }

  // Check 6: Reject file exceeding maxBytes
  try {
    const tinyTicket = mintToken({
      typ: "up",
      uid: "e2e-tester",
      maxBytes: 100, // file is > 500 bytes
      exp: now + 300,
    });
    const res = await fetch(`${GATEWAY_URL}/upload`, {
      method: "POST",
      headers: {
        "X-Ticket": tinyTicket,
        "X-File-Name": encodeURIComponent("big.pdf"),
        "X-File-Sha256": testSha256,
        "Content-Length": String(testPdfBytes.length),
      },
      body: testPdfBytes,
    });
    record("Check 6: Reject file exceeding maxBytes", res.status === 413, `HTTP ${res.status}`);
  } catch (e) {
    record("Check 6: Reject file exceeding maxBytes", false, e.message);
  }

  // Check 7: Download via signed dl token (first call -> cache MISS)
  if (uploadedFid) {
    const dlToken = mintToken({
      typ: "dl",
      fid: uploadedFid,
      name: "e2e-download.pdf",
      mime: "application/pdf",
      size: testPdfBytes.length,
      disp: "inline",
      exp: now + 600,
    });

    try {
      const res = await fetch(`${GATEWAY_URL}/f/${dlToken}`);
      const bodyBuf = Buffer.from(await res.arrayBuffer());
      const cacheHeader = res.headers.get("x-cache");
      const shaMatch = crypto.createHash("sha256").update(bodyBuf).digest("hex") === testSha256;
      record(
        "Check 7: Download via signed dl token",
        res.status === 200 && shaMatch,
        `Status ${res.status}, x-cache: ${cacheHeader}, SHA match: ${shaMatch}`
      );

      // Check 8: Download second time -> cache HIT
      const res2 = await fetch(`${GATEWAY_URL}/f/${dlToken}`);
      const cacheHeader2 = res2.headers.get("x-cache");
      record(
        "Check 8: Download cache verification",
        res2.status === 200 && cacheHeader2 === "HIT",
        `x-cache: ${cacheHeader2}`
      );
    } catch (e) {
      record("Check 7: Download via signed dl token", false, e.message);
      record("Check 8: Download cache verification", false, e.message);
    }
  } else {
    record("Check 7: Download via signed dl token", false, "Skipped (no fid from Check 1)");
    record("Check 8: Download cache verification", false, "Skipped");
  }

  // Check 9: Reject invalid dl token on download
  try {
    const res = await fetch(`${GATEWAY_URL}/f/bad-token.12345`);
    record("Check 9: Reject invalid dl token on download", res.status === 403, `HTTP ${res.status}`);
  } catch (e) {
    record("Check 9: Reject invalid dl token on download", false, e.message);
  }

  // Check 10: Cleanup test message in Telegram channel
  if (BOT_TOKEN && STORAGE_CHANNEL_ID && uploadedMid) {
    try {
      const delRes = await fetch(
        `https://api.telegram.org/bot${BOT_TOKEN}/deleteMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: STORAGE_CHANNEL_ID,
            message_id: uploadedMid,
          }),
        }
      );
      const delJson = await delRes.json();
      record("Check 10: Cleanup test Telegram message", delJson.ok === true, `Deleted message ${uploadedMid}`);
    } catch (e) {
      record("Check 10: Cleanup test Telegram message", false, e.message);
    }
  } else {
    record("Check 10: Cleanup test Telegram message", true, "Skipped or completed without Bot credentials");
  }

  console.log("\n=== SUMMARY ===");
  const total = results.length;
  const passed = results.filter((r) => r.pass).length;
  console.log(`Passed: ${passed}/${total}`);

  if (passed !== total) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

