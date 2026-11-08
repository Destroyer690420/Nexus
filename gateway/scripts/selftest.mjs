import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import https from 'https';
import { mintUpToken, mintDlToken } from './mint.mjs';
import { base64urlDecodeToString } from '../lib/token.js';

const BASE_URL = process.env.GATEWAY_URL || "https://nexus-files-7b4c.pages.dev";
const BOT_TOKEN = process.env.BOT_TOKEN;
const STORAGE_CHANNEL_ID = process.env.STORAGE_CHANNEL_ID || "-1004497894559";

const results = {};

function logCheck(id, passed, detail) {
  results[id] = { passed, detail };
  console.log(`[CHECK ${id}] ${passed ? "PASS" : "FAIL"}: ${detail}`);
}

async function run() {
  console.log(`Running selftest against: ${BASE_URL}`);

  // Prepare t19.pdf
  const tmpDir = os.tmpdir();
  const t19Path = path.join(tmpDir, "selftest_t19.pdf");
  const header = Buffer.from("%PDF-1.4\n", "utf-8");
  const totalBytes = 19500000;
  
  console.log("Generating 19.5MB test file...");
  const fd = fs.openSync(t19Path, "w");
  fs.writeSync(fd, header);
  let remaining = totalBytes - header.length;
  const chunk = 1024 * 1024;
  while (remaining > 0) {
    const toWrite = Math.min(remaining, chunk);
    fs.writeSync(fd, crypto.randomBytes(toWrite));
    remaining -= toWrite;
  }
  fs.closeSync(fd);

  const t19Buffer = fs.readFileSync(t19Path);
  const t19Sha = crypto.createHash("sha256").update(t19Buffer).digest("hex");
  console.log("t19 SHA-256:", t19Sha);

  let uploadedFid = null;
  let uploadedMid = null;

  // --------------------------------------------------------------------------
  // Check 1: Upload t19.pdf with valid up ticket -> 200 + receipt
  // --------------------------------------------------------------------------
  try {
    const upToken = await mintUpToken({ maxBytes: 20000000, ttlSec: 300 });
    const res = await fetch(`${BASE_URL}/upload`, {
      method: "POST",
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(totalBytes),
        "X-Ticket": upToken,
        "X-File-Name": encodeURIComponent("t19.pdf"),
        "X-File-Sha256": t19Sha,
      },
      body: t19Buffer,
      duplex: "half",
    });

    if (res.status === 1102 || res.status >= 500) {
      const errText = await res.text();
      console.error(`Check 7 trigger: Server error on upload (${res.status}): ${errText}`);
    }

    if (res.status === 200) {
      const json = await res.json();
      if (!json.receipt) throw new Error("Missing receipt in upload response");
      
      // Decode receipt payload without secret
      const dot = json.receipt.indexOf(".");
      const pStr = json.receipt.slice(0, dot);
      const payload = JSON.parse(base64urlDecodeToString(pStr));

      if (payload.fid && payload.mid && payload.size === totalBytes) {
        uploadedFid = payload.fid;
        uploadedMid = payload.mid;
        logCheck(1, true, `Upload ok, fid=${uploadedFid}, mid=${uploadedMid}, size=${payload.size}`);
      } else {
        logCheck(1, false, `Receipt payload invalid: ${JSON.stringify(payload)}`);
      }
    } else {
      const body = await res.text();
      logCheck(1, false, `Upload failed with status ${res.status}: ${body}`);
    }
  } catch (err) {
    logCheck(1, false, `Upload error: ${err.message}`);
  }

  // --------------------------------------------------------------------------
  // Check 2: Download with minted dl token: 1st MISS, 2nd HIT, bytes match
  // --------------------------------------------------------------------------
  try {
    if (!uploadedFid) {
      logCheck(2, false, "Skipped: no uploaded fid from Check 1");
    } else {
      const dlToken = await mintDlToken({
        fid: uploadedFid,
        name: "t19.pdf",
        mime: "application/pdf",
        size: totalBytes,
        disp: "inline",
      });

      // Call 1
      const res1 = await fetch(`${BASE_URL}/f/${dlToken}`);
      const cache1 = res1.headers.get("x-cache");
      const buf1 = Buffer.from(await res1.arrayBuffer());
      const sha1 = crypto.createHash("sha256").update(buf1).digest("hex");

      // Call 2
      const res2 = await fetch(`${BASE_URL}/f/${dlToken}`);
      const cache2 = res2.headers.get("x-cache");
      const buf2 = Buffer.from(await res2.arrayBuffer());
      const sha2 = crypto.createHash("sha256").update(buf2).digest("hex");

      const match = sha1 === t19Sha && sha2 === t19Sha;
      const pass = res1.status === 200 && res2.status === 200 && cache1 === "MISS" && cache2 === "HIT" && match;
      logCheck(2, pass, `Call 1: status=${res1.status}, x-cache=${cache1}; Call 2: status=${res2.status}, x-cache=${cache2}; shaMatch=${match}`);
    }
  } catch (err) {
    logCheck(2, false, `Download error: ${err.message}`);
  }

  // --------------------------------------------------------------------------
  // Check 3: Expired token 403, tampered 403, up on /f 403, dl on /upload 403
  // --------------------------------------------------------------------------
  try {
    // Expired up token
    const expToken = await mintUpToken({ ttlSec: -60 });
    const rExp = await fetch(`${BASE_URL}/upload`, {
      method: "POST",
      headers: {
        "Content-Length": "4",
        "X-Ticket": expToken,
        "X-File-Name": "t.pdf",
        "X-File-Sha256": t19Sha,
      },
      body: Buffer.from("%PDF"),
      duplex: "half",
    });

    // Tampered token
    const validUp = await mintUpToken();
    const tampered = validUp.slice(0, -4) + "XXXX";
    const rTamp = await fetch(`${BASE_URL}/upload`, {
      method: "POST",
      headers: {
        "Content-Length": "4",
        "X-Ticket": tampered,
        "X-File-Name": "t.pdf",
        "X-File-Sha256": t19Sha,
      },
      body: Buffer.from("%PDF"),
      duplex: "half",
    });

    // up token on /f
    const rUpOnF = await fetch(`${BASE_URL}/f/${validUp}`);

    // dl token on /upload
    const validDl = await mintDlToken({ fid: uploadedFid || "dummy" });
    const rDlOnUp = await fetch(`${BASE_URL}/upload`, {
      method: "POST",
      headers: {
        "Content-Length": "4",
        "X-Ticket": validDl,
        "X-File-Name": "t.pdf",
        "X-File-Sha256": t19Sha,
      },
      body: Buffer.from("%PDF"),
      duplex: "half",
    });

    const pass = rExp.status === 403 && rTamp.status === 403 && rUpOnF.status === 403 && rDlOnUp.status === 403;
    logCheck(3, pass, `exp=${rExp.status}, tamp=${rTamp.status}, upOnF=${rUpOnF.status}, dlOnUp=${rDlOnUp.status}`);
  } catch (err) {
    logCheck(3, false, `Token rejection error: ${err.message}`);
  }

  // --------------------------------------------------------------------------
  // Check 4: 21 MB 413, .pdf starting with PK 415, x.exe 415, no Content-Length 411
  // --------------------------------------------------------------------------
  try {
    const upToken = await mintUpToken();

    // 21 MB body -> 413
    const buf21 = Buffer.alloc(21000000, 0x25);
    const r21 = await fetch(`${BASE_URL}/upload`, {
      method: "POST",
      headers: {
        "Content-Length": "21000000",
        "X-Ticket": upToken,
        "X-File-Name": "big.pdf",
        "X-File-Sha256": t19Sha,
      },
      body: buf21,
      duplex: "half",
    });

    // .pdf starting with PK -> 415
    const rPk = await fetch(`${BASE_URL}/upload`, {
      method: "POST",
      headers: {
        "Content-Length": "4",
        "X-Ticket": upToken,
        "X-File-Name": "pk.pdf",
        "X-File-Sha256": t19Sha,
      },
      body: Buffer.from([0x50, 0x4B, 0x03, 0x04]),
      duplex: "half",
    });

    // x.exe -> 415
    const rExe = await fetch(`${BASE_URL}/upload`, {
      method: "POST",
      headers: {
        "Content-Length": "4",
        "X-Ticket": upToken,
        "X-File-Name": "x.exe",
        "X-File-Sha256": t19Sha,
      },
      body: Buffer.from("%PDF"),
      duplex: "half",
    });

    // No Content-Length -> 411
    const rNoCl = await new Promise((resolve, reject) => {
      const url = new URL(`${BASE_URL}/upload`);
      const req = https.request({
        hostname: url.hostname,
        port: 443,
        path: url.pathname,
        method: "POST",
        headers: {
          "X-Ticket": upToken,
          "X-File-Name": "test.pdf",
          "X-File-Sha256": t19Sha,
        },
      }, res => resolve({ status: res.statusCode }));
      req.on("error", reject);
      req.end();
    });

    const pass = r21.status === 413 && rPk.status === 415 && rExe.status === 415 && rNoCl.status === 411;
    logCheck(4, pass, `21mb=${r21.status}, pk=${rPk.status}, exe=${rExe.status}, noCl=${rNoCl.status}`);
  } catch (err) {
    logCheck(4, false, `Validation error: ${err.message}`);
  }

  // --------------------------------------------------------------------------
  // Check 5: .html forced attachment, .pdf with disp inline served inline
  // --------------------------------------------------------------------------
  try {
    if (!uploadedFid) {
      logCheck(5, false, "Skipped: no uploaded fid");
    } else {
      const tokenHtml = await mintDlToken({
        fid: uploadedFid,
        name: "test.html",
        mime: "text/html",
        disp: "inline",
      });
      const resHtml = await fetch(`${BASE_URL}/f/${tokenHtml}`);
      const cpHtml = resHtml.headers.get("content-disposition") || "";

      const tokenPdf = await mintDlToken({
        fid: uploadedFid,
        name: "test.pdf",
        mime: "application/pdf",
        disp: "inline",
      });
      const resPdf = await fetch(`${BASE_URL}/f/${tokenPdf}`);
      const cpPdf = resPdf.headers.get("content-disposition") || "";

      const htmlForced = cpHtml.startsWith("attachment;");
      const pdfInline = cpPdf.startsWith("inline;");
      const pass = htmlForced && pdfInline;
      logCheck(5, pass, `html disp="${cpHtml}" (forced=${htmlForced}), pdf disp="${cpPdf}" (inline=${pdfInline})`);
    }
  } catch (err) {
    logCheck(5, false, `Disposition error: ${err.message}`);
  }

  // --------------------------------------------------------------------------
  // Check 6: CORS preflight localhost:3000 OK; evil.example gets no allow-origin
  // --------------------------------------------------------------------------
  try {
    const resLocal = await fetch(`${BASE_URL}/upload`, {
      method: "OPTIONS",
      headers: {
        "Origin": "http://localhost:3000",
        "Access-Control-Request-Method": "POST",
      },
    });
    const allowLocal = resLocal.headers.get("access-control-allow-origin");

    const resEvil = await fetch(`${BASE_URL}/upload`, {
      method: "OPTIONS",
      headers: {
        "Origin": "https://evil.example",
        "Access-Control-Request-Method": "POST",
      },
    });
    const allowEvil = resEvil.headers.get("access-control-allow-origin");

    const pass = allowLocal === "http://localhost:3000" && !allowEvil;
    logCheck(6, pass, `localhost origin="${allowLocal}", evil origin="${allowEvil}"`);
  } catch (err) {
    logCheck(6, false, `CORS preflight error: ${err.message}`);
  }

  // --------------------------------------------------------------------------
  // Check 7: Watch for Cloudflare CPU errors (1102) and 5xx
  // --------------------------------------------------------------------------
  const pass7 = results[1]?.passed && results[2]?.passed;
  logCheck(7, pass7, pass7 ? "No 1102 or 5xx CPU errors encountered" : "Issues in upload/download checks");

  // --------------------------------------------------------------------------
  // Check 8: deleteMessage for test uploads
  // --------------------------------------------------------------------------
  if (uploadedMid && BOT_TOKEN) {
    try {
      const delRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/deleteMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: STORAGE_CHANNEL_ID,
          message_id: uploadedMid,
        }),
      });
      const delJson = await delRes.json();
      logCheck(8, delJson.ok === true, `deleteMessage mid=${uploadedMid}: ${JSON.stringify(delJson)}`);
    } catch (err) {
      logCheck(8, false, `deleteMessage failed: ${err.message}`);
    }
  } else {
    logCheck(8, false, `Skipped deleteMessage (uploadedMid=${uploadedMid})`);
  }

  // Clean up local temp file
  try { fs.unlinkSync(t19Path); } catch {}

  console.log("\n--- SELFTEST SUMMARY ---");
  let allPass = true;
  for (let i = 1; i <= 8; i++) {
    const c = results[i];
    console.log(`Check ${i}: ${c?.passed ? "PASS" : "FAIL"} - ${c?.detail}`);
    if (!c?.passed) allPass = false;
  }
  return allPass;
}

run().catch(err => {
  console.error("FATAL ERROR IN SELFTEST:", err);
  process.exit(1);
});

