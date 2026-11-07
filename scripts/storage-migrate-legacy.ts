/**
 * Phase 12 migration: inventory legacy fileUrl rows -> hash content ->
 * create storage_objects (dedup-aware) -> enqueue migrate_object jobs.
 *
 *   npx tsx scripts/storage-migrate-legacy.ts [--limit 50] [--dry-run]
 *
 * Resumable: rows already carrying storageObjectId are skipped; the queue
 * processor owns retries. Legacy copies are NEVER deleted here — removal
 * is a separate, verified cutover step (Phase 13).
 */
import { supabaseAdmin } from "../lib/supabase-admin";
import { buildResourceObjectKey } from "../lib/storage/keys";
import { enqueueJob, upsertObjectByIdempotentKey } from "../lib/storage/server/db";

const args = process.argv.slice(2);
const DRY = args.includes("--dry-run");
const limitIdx = args.indexOf("--limit");
const LIMIT = limitIdx >= 0 ? Number(args[limitIdx + 1]) : 50;

interface Target {
  table: "resources" | "contributions";
  id: string;
  fileUrl: string;
}

async function hashUrl(url: string): Promise<{ size: number; sha256: string }> {
  const res = await fetch(url);
  if (!res.ok || !res.body) throw new Error(`source fetch failed (${res.status})`);
  const { createHash } = await import("node:crypto");
  const hash = createHash("sha256");
  let size = 0;
  const reader = res.body.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    hash.update(value);
    size += value.byteLength;
  }
  return { size, sha256: hash.digest("hex") };
}

async function main() {
  console.log(`Migrating legacy files${DRY ? " [DRY RUN]" : ""} (limit ${LIMIT})\n`);

  const targets: Target[] = [];
  for (const table of ["resources", "contributions"] as const) {
    const { data } = await supabaseAdmin
      .from(table)
      .select("id,fileUrl")
      .or("storageObjectId.is.null")
      .not("fileUrl", "eq", "")
      .limit(LIMIT);
    for (const row of (data ?? []) as Array<{ id: string; fileUrl: string }>) {
      if (/^https?:\/\//.test(row.fileUrl)) {
        targets.push({ table, id: row.id, fileUrl: row.fileUrl });
      }
    }
  }

  console.log(`Found ${targets.length} legacy row(s) to migrate.`);
  let migrated = 0;
  let failed = 0;

  for (const t of targets) {
    try {
      process.stdout.write(`→ ${t.table}/${t.id} ... `);
      const { size, sha256 } = await hashUrl(t.fileUrl);

      if (!DRY) {
        const { row: obj, deduplicated } = await upsertObjectByIdempotentKey({
          objectKey: buildResourceObjectKey({
            courseId: "legacy",
            resourceType: t.table,
            uniqueId: `${sha256.slice(0, 16)}-${t.id.slice(0, 8)}`,
            fileName: `legacy-${t.id}.pdf`,
          }),
          size,
          mimeType: "application/pdf",
          sha256,
        });

        // Link row to object.
        await supabaseAdmin
          .from(t.table)
          .update({ storageObjectId: obj.id })
          .eq("id", t.id);

        if (obj.status !== "ready") {
          await enqueueJob({
            type: "migrate_object",
            payload: {
              objectId: obj.id,
              sourceUrl: t.fileUrl,
              size,
              mimeType: "application/pdf",
              fileName: `legacy-${t.id}.pdf`,
              sha256,
            },
            idempotencyKey: `migrate:${obj.id}`,
          });
        }
        console.log(`${deduplicated ? "dedup hit" : "created"} (${size} bytes)`);
      } else {
        console.log(`would migrate (${size} bytes)`);
      }
      migrated += 1;
    } catch (err) {
      failed += 1;
      console.log(`FAILED: ${err instanceof Error ? err.message : err}`);
    }
  }

  console.log(`\nDone. migrated=${migrated} failed=${failed}`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
