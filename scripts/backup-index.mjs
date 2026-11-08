/**
 * scripts/backup-index.mjs
 * Exports database metadata to compressed JSON and sends it to Telegram backup channel.
 * Run with: node scripts/backup-index.mjs [--local-only]
 */

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
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
const BOT_TOKEN = process.env.BOT_TOKEN;
const BACKUP_CHANNEL_ID = process.env.BACKUP_CHANNEL_ID;
const LOCAL_ONLY = process.argv.includes("--local-only");

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("FAIL: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

const TABLES = [
  "users",
  "courses",
  "branches",
  "student_profiles",
  "subjects",
  "resources",
  "contributions",
  "announcements",
  "files",
];

async function main() {
  console.log("=== NEXUS METADATA BACKUP ===");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const dump = {
    exportedAt: new Date().toISOString(),
    tables: {},
    counts: {},
  };

  for (const tbl of TABLES) {
    try {
      const { data, error } = await supabase.from(tbl).select("*");
      if (error) {
        console.warn(`Warning: Could not fetch table "${tbl}": ${error.message}`);
        dump.tables[tbl] = [];
        dump.counts[tbl] = 0;
      } else {
        dump.tables[tbl] = data || [];
        dump.counts[tbl] = (data || []).length;
        console.log(`Fetched ${dump.counts[tbl]} rows from ${tbl}`);
      }
    } catch (e) {
      console.warn(`Warning: Exception reading ${tbl}: ${e.message}`);
      dump.tables[tbl] = [];
      dump.counts[tbl] = 0;
    }
  }

  const jsonStr = JSON.stringify(dump, null, 2);
  const compressed = zlib.gzipSync(Buffer.from(jsonStr, "utf-8"));

  const backupDir = path.resolve(process.cwd(), ".backup");
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const fileName = `nexus-backup-${timestamp}.json.gz`;
  const localFilePath = path.join(backupDir, fileName);
  fs.writeFileSync(localFilePath, compressed);
  console.log(`Saved local backup: ${localFilePath} (${compressed.length} bytes)`);

  if (LOCAL_ONLY) {
    console.log("Local-only flag specified; skipping Telegram upload.");
    return;
  }

  if (!BOT_TOKEN || !BACKUP_CHANNEL_ID) {
    console.log("BOT_TOKEN or BACKUP_CHANNEL_ID not set; skipping Telegram upload.");
    return;
  }

  console.log(`Uploading backup to Telegram channel ${BACKUP_CHANNEL_ID}...`);
  const totalRows = Object.values(dump.counts).reduce((a, b) => a + b, 0);
  const caption = `Nexus Database Backup\nDate: ${new Date().toISOString()}\nTotal records: ${totalRows}\nTables: ${Object.entries(dump.counts).map(([k, v]) => `${k}:${v}`).join(", ")}`;

  const form = new FormData();
  form.append("chat_id", BACKUP_CHANNEL_ID);
  form.append("caption", caption.slice(0, 1024));
  form.append(
    "document",
    new Blob([compressed], { type: "application/gzip" }),
    fileName
  );

  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`, {
    method: "POST",
    body: form,
  });

  const resJson = await res.json();
  if (resJson.ok) {
    console.log(`Backup posted to Telegram (message_id: ${resJson.result.message_id})`);
  } else {
    console.error(`Failed to post backup to Telegram: ${resJson.description}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Backup failed:", err);
  process.exit(1);
});
