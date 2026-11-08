/**
 * scripts/restore-index.mjs
 * Restores metadata tables from a compressed JSON backup.
 * Run with: node scripts/restore-index.mjs [path/to/backup.json.gz] [--dry-run]
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
const isDryRun = process.argv.includes("--dry-run");

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("FAIL: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

// Find backup file
let targetFile = process.argv.find(
  (arg) => !arg.startsWith("--") && arg.endsWith(".gz")
);

if (!targetFile) {
  const backupDir = path.resolve(process.cwd(), ".backup");
  if (fs.existsSync(backupDir)) {
    const files = fs
      .readdirSync(backupDir)
      .filter((f) => f.endsWith(".json.gz"))
      .sort()
      .reverse();
    if (files.length > 0) {
      targetFile = path.join(backupDir, files[0]);
    }
  }
}

if (!targetFile || !fs.existsSync(targetFile)) {
  console.error("No backup file specified or found in .backup/");
  process.exit(1);
}

async function main() {
  console.log(`=== NEXUS METADATA RESTORE (${isDryRun ? "DRY RUN" : "APPLY"}) ===`);
  console.log(`Target backup: ${targetFile}`);

  const compressed = fs.readFileSync(targetFile);
  const decompressed = zlib.gunzipSync(compressed);
  const dump = JSON.parse(decompressed.toString("utf-8"));

  console.log(`Backup timestamp: ${dump.exportedAt || "Unknown"}`);
  console.log("Tables in backup:", Object.keys(dump.tables).join(", "));

  // Restoration order respecting foreign keys (personal data users/student_profiles excluded on purpose)
  const RESTORE_ORDER = [
    "courses",
    "branches",
    "subjects",
    "files",
    "resources",
    "contributions",
    "announcements",
  ];

  for (const tbl of RESTORE_ORDER) {
    const rows = dump.tables[tbl];
    if (!rows || rows.length === 0) {
      console.log(`Table ${tbl}: 0 rows (skipping)`);
      continue;
    }

    console.log(`Table ${tbl}: ${rows.length} rows`);

    if (isDryRun) {
      console.log(`  [DRY RUN] Would upsert ${rows.length} rows into ${tbl}`);
      continue;
    }

    try {
      // Upsert in batches of 100
      const batchSize = 100;
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        const { error } = await supabase.from(tbl).upsert(batch);
        if (error) {
          console.error(`  Error upserting batch into ${tbl}: ${error.message}`);
        }
      }
      console.log(`  Successfully restored ${rows.length} rows into ${tbl}`);
    } catch (e) {
      console.error(`  Exception restoring ${tbl}: ${e.message}`);
    }
  }

  console.log("Restore operation finished.");
}

main().catch((err) => {
  console.error("Restore failed:", err);
  process.exit(1);
});

