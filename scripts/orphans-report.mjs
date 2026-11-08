/**
 * scripts/orphans-report.mjs
 * Finds files in Telegram metadata table not linked to any active resource or contribution.
 * Run with: node scripts/orphans-report.mjs
 */

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

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("FAIL: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

async function main() {
  console.log("=== NEXUS ORPHANED FILES REPORT ===");

  const { data: allFiles, error: filesErr } = await supabase
    .from("files")
    .select("id, original_name, size_bytes, mime, uploaded_by, created_at");

  if (filesErr) {
    console.error("Failed to query files table:", filesErr.message);
    process.exit(1);
  }

  const { data: resFiles } = await supabase
    .from("resources")
    .select('"fileId"')
    .not("fileId", "is", null);

  const { data: contribFiles } = await supabase
    .from("contributions")
    .select('"fileId"')
    .not("fileId", "is", null);

  const referencedIds = new Set([
    ...(resFiles || []).map((r) => r.fileId),
    ...(contribFiles || []).map((c) => c.fileId),
  ]);

  const orphans = (allFiles || []).filter((f) => !referencedIds.has(f.id));

  console.log(`Total files in DB: ${(allFiles || []).length}`);
  console.log(`Referenced files: ${referencedIds.size}`);
  console.log(`Orphaned files:   ${orphans.length}`);

  if (orphans.length > 0) {
    const totalBytes = orphans.reduce((sum, f) => sum + (f.size_bytes || 0), 0);
    console.log(`Total orphaned size: ${(totalBytes / 1_000_000).toFixed(2)} MB\n`);
    console.log("Orphaned records:");
    for (const o of orphans) {
      console.log(` - [${o.id}] ${o.original_name} (${o.size_bytes} bytes, uploaded at ${o.created_at})`);
    }
  } else {
    console.log("Clean: no orphaned files detected.");
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
