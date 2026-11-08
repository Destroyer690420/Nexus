/**
 * scripts/migrate-legacy-files.mjs
 * Migrates legacy files (Supabase Storage URLs) to Telegram via the gateway.
 * Run with: node scripts/migrate-legacy-files.mjs [--dry-run] [--limit=N]
 */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

// Load environment from .env.local if available
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
      if (!process.env[k]) process.env[k] = v;
    }
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SECRET = process.env.LINK_SIGNING_SECRET;
const GATEWAY_URL = (
  process.env.FILES_GATEWAY_URL ||
  process.env.NEXT_PUBLIC_GATEWAY_URL ||
  process.env.GATEWAY_URL ||
  "https://nexus-files-7b4c.pages.dev"
).replace(/\/+$/, "");

const isDryRun = process.argv.includes("--dry-run");
const limitArg = process.argv.find((a) => a.startsWith("--limit="));
const limit = limitArg ? parseInt(limitArg.split("=")[1], 10) : 50;

if (!SUPABASE_URL || !SERVICE_KEY || !SECRET) {
  console.error("FAIL: Required environment variables are missing.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

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
  return payload;
}

async function main() {
  console.log(`=== NEXUS LEGACY FILE MIGRATION (${isDryRun ? "DRY RUN" : "APPLY"}) ===`);

  // 1. Find unmigrated resources
  const { data: resources } = await supabase
    .from("resources")
    .select('id, title, fileUrl, "fileId"')
    .not("fileUrl", "is", null)
    .neq("fileUrl", "")
    .is("fileId", null)
    .limit(limit);

  // 2. Find unmigrated contributions
  const { data: contributions } = await supabase
    .from("contributions")
    .select('id, title, fileUrl, "fileId"')
    .not("fileUrl", "is", null)
    .neq("fileUrl", "")
    .is("fileId", null)
    .limit(limit);

  const pending = [
    ...(resources || []).map((r) => ({ ...r, table: "resources" })),
    ...(contributions || []).map((c) => ({ ...c, table: "contributions" })),
  ];

  console.log(`Found ${pending.length} items needing migration.`);

  if (pending.length === 0) {
    console.log("No legacy files to migrate.");
    return;
  }

  for (const item of pending) {
    console.log(`\nProcessing [${item.table}] ${item.title} (${item.id}):`);
    console.log(`  Source URL: ${item.fileUrl}`);

    if (isDryRun) {
      console.log("  [DRY RUN] Would download and migrate to Telegram.");
      continue;
    }

    try {
      // Download
      const res = await fetch(item.fileUrl);
      if (!res.ok) {
        console.warn(`  Warning: Failed to fetch source file (${res.status})`);
        continue;
      }

      const fileBuffer = Buffer.from(await res.arrayBuffer());
      if (fileBuffer.length > 20_000_000) {
        console.warn(`  Warning: File size (${fileBuffer.length} bytes) exceeds 20MB cap; skipping.`);
        continue;
      }

      const sha256 = crypto.createHash("sha256").update(fileBuffer).digest("hex");
      const ext = path.extname(new URL(item.fileUrl).pathname) || ".pdf";
      const fileName = `${item.title.replace(/[^a-zA-Z0-9_-]/g, "_")}${ext}`;

      // Check deduplication in files table
      const { data: existingFile } = await supabase
        .from("files")
        .select("id")
        .eq("sha256", sha256)
        .eq("size_bytes", fileBuffer.length)
        .maybeSingle();

      let targetFileId = existingFile?.id;

      if (!targetFileId) {
        // Mint upload ticket
        const now = Math.floor(Date.now() / 1000);
        const ticket = mintToken({
          typ: "up",
          uid: "migrator",
          maxBytes: fileBuffer.length,
          exp: now + 300,
        });

        // Upload to gateway
        const upRes = await fetch(`${GATEWAY_URL}/upload`, {
          method: "POST",
          headers: {
            "X-Ticket": ticket,
            "X-File-Name": encodeURIComponent(fileName),
            "X-File-Sha256": sha256,
            "Content-Length": String(fileBuffer.length),
          },
          body: fileBuffer,
        });

        if (!upRes.ok) {
          const errText = await upRes.text();
          console.warn(`  Warning: Gateway upload failed (${upRes.status}): ${errText}`);
          continue;
        }

        const upData = await upRes.json();
        const rc = verifyToken(upData.receipt, "rc");
        if (!rc) {
          console.warn("  Warning: Invalid receipt from gateway");
          continue;
        }

        // Insert into files table
        const { data: newFile, error: insertErr } = await supabase
          .from("files")
          .upsert({
            tg_file_id: rc.fid,
            tg_message_id: rc.mid,
            sha256: rc.sha.toLowerCase(),
            size_bytes: rc.size,
            mime: rc.mime,
            original_name: rc.name,
          }, { onConflict: "sha256,size_bytes" })
          .select("id")
          .single();

        if (insertErr || !newFile?.id) {
          console.warn(`  Warning: Failed to insert file record: ${insertErr?.message}`);
          continue;
        }
        targetFileId = newFile.id;
      }

      // Update parent table with fileId
      const { error: updateErr } = await supabase
        .from(item.table)
        .update({ fileId: targetFileId })
        .eq("id", item.id);

      if (updateErr) {
        console.warn(`  Warning: Failed to update ${item.table} row: ${updateErr.message}`);
      } else {
        console.log(`  Successfully migrated! Attached fileId: ${targetFileId}`);
      }
    } catch (e) {
      console.warn(`  Exception migrating item: ${e.message}`);
    }
  }

  console.log("\nMigration completed.");
}

main().catch((err) => {
  console.error("Migration fatal error:", err);
  process.exit(1);
});
