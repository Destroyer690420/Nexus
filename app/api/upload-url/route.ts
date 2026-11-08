import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

function sanitizeSegment(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9._-]/g, "_");
}

/**
 * Issues a signed upload URL into the PRIVATE staging bucket.
 *
 * Flow: client PUTs bytes here first; a queue job then transfers the object
 * to Telegram and deletes the staging copy. Nothing in this bucket is ever
 * public. Legacy behavior (public resources bucket) is retained only when
 * STORAGE_WRITE_PROVIDER=supabase-legacy (Phase 13 rollback flag).
 */

const MAX_FILE_SIZE = Number(process.env.STORAGE_MAX_FILE_SIZE ?? 50 * 1024 * 1024);
const STAGING_BUCKET = process.env.STORAGE_STAGING_BUCKET ?? "staging";

const ALLOWED_EXTENSIONS = new Set([
  "pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx",
  "png", "jpg", "jpeg", "webp", "txt", "zip",
]);
const ALLOWED_MIME = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/png", "image/jpeg", "image/webp", "text/plain",
  "application/zip", "application/octet-stream", "",
]);

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const { data: { user }, error: verifyError } = await supabaseAdmin.auth.getUser(token);
    if (verifyError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Per-user abuse guard: max pending staging uploads.
    const { count } = await supabaseAdmin
      .from("storage_jobs")
      .select("id", { count: "exact", head: true })
      .eq("type", "upload_to_telegram")
      .in("status", ["queued", "running", "retrying"]);
    const MAX_PENDING = Number(process.env.STORAGE_MAX_PENDING_JOBS ?? 200);
    if ((count ?? 0) >= MAX_PENDING) {
      return NextResponse.json(
        { error: "Upload system is busy. Please try again shortly." },
        { status: 503 }
      );
    }

    const body = await req.json();
    const fileNameRaw: string = body.fileName ?? "";
    const contentType: string = body.contentType ?? "";
    const fileSize: number = Number(body.fileSize ?? 0);

    if (!fileNameRaw || typeof fileNameRaw !== "string") {
      return NextResponse.json({ error: "Missing fileName" }, { status: 400 });
    }
    if (!Number.isFinite(fileSize) || fileSize <= 0) {
      return NextResponse.json({ error: "Invalid fileSize" }, { status: 400 });
    }
    if (fileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds the ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB limit` },
        { status: 413 }
      );
    }

    // Never trust browser MIME/filename: validate extension + declared type.
    const ext = (fileNameRaw.split(".").pop() ?? "").toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json({ error: `File type .${ext} is not allowed` }, { status: 415 });
    }
    if (!ALLOWED_MIME.has(contentType)) {
      return NextResponse.json({ error: `Content type ${contentType || "(empty)"} is not allowed` }, { status: 415 });
    }

    const writeProvider = process.env.STORAGE_WRITE_PROVIDER ?? "telegram";

    if (writeProvider === "supabase-legacy") {
      // Rollback path: exact legacy behavior (public bucket + publicUrl).
      await supabaseAdmin.storage.createBucket("resources", { public: true });
      const path = `uploads/${user.id}/${Date.now()}_${crypto.randomUUID()}.${ext}`;
      const { data, error } = await supabaseAdmin.storage
        .from("resources")
        .createSignedUploadUrl(path);
      if (error || !data) {
        return NextResponse.json({ error: `Failed to create upload URL: ${error?.message}` }, { status: 500 });
      }
      const { data: { publicUrl } } = supabaseAdmin.storage.from("resources").getPublicUrl(path);
      return NextResponse.json({
        mode: "legacy" as const,
        signedUrl: data.signedUrl,
        token: data.token,
        path: data.path,
        publicUrl,
      });
    }

    // Telegram pipeline: private staging bucket.
    await supabaseAdmin.storage.createBucket(STAGING_BUCKET, { public: false }).catch(() => {});
    const safeName = sanitizeSegment(fileNameRaw) || `file.${ext}`;
    const path = `pending/${user.id}/${Date.now()}_${crypto.randomUUID()}_${safeName}`;
    const { data, error } = await supabaseAdmin.storage
      .from(STAGING_BUCKET)
      .createSignedUploadUrl(path);
    if (error || !data) {
      return NextResponse.json({ error: `Failed to create upload URL: ${error?.message}` }, { status: 500 });
    }

    return NextResponse.json({
      mode: "staging" as const,
      bucket: STAGING_BUCKET,
      signedUrl: data.signedUrl,
      token: data.token,
      path: data.path,
      contentType,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
