import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { mintToken, getGatewayUrl } from "@/lib/files-signing";

const ALLOWED_EXTENSIONS = new Set([
  "pdf",
  "png",
  "jpg",
  "jpeg",
  "webp",
  "docx",
  "pptx",
  "xlsx",
  "zip",
]);

const MAX_FILE_SIZE = 20_000_000; // 20 MB Telegram limit
const DAILY_UPLOAD_LIMIT = 20;

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { name, size, sha256 } = body;
    if (typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Missing or invalid file name" }, { status: 400 });
    }

    const ext = name.split(".").pop()?.toLowerCase();
    if (!ext || !ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json(
        { error: `File extension .${ext} is not allowed` },
        { status: 400 }
      );
    }

    if (typeof size !== "number" || size < 1 || size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size must be between 1 and ${MAX_FILE_SIZE} bytes` },
        { status: 400 }
      );
    }

    if (
      typeof sha256 !== "string" ||
      !/^[0-9a-f]{64}$/i.test(sha256)
    ) {
      return NextResponse.json(
        { error: "SHA-256 must be a 64-character hex string" },
        { status: 400 }
      );
    }

    const cleanSha = sha256.toLowerCase();

    // Deduplication check
    const { data: existing } = await supabaseAdmin
      .from("files")
      .select("id")
      .eq("sha256", cleanSha)
      .eq("size_bytes", size)
      .maybeSingle();

    if (existing?.id) {
      return NextResponse.json({
        duplicate: true,
        fileId: existing.id,
      });
    }

    // Rate limit check (admins are exempt)
    const { data: profile } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("uid", user.id)
      .maybeSingle();

    if (profile?.role !== "admin") {
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count } = await supabaseAdmin
        .from("files")
        .select("id", { count: "exact", head: true })
        .eq("uploaded_by", user.id)
        .gte("created_at", dayAgo);

      if ((count || 0) >= DAILY_UPLOAD_LIMIT) {
        return NextResponse.json(
          { error: `Daily upload limit reached (${DAILY_UPLOAD_LIMIT} files/day)` },
          { status: 429 }
        );
      }
    }

    // Mint short-lived upload ticket (5 minutes)
    const nowSec = Math.floor(Date.now() / 1000);
    const ticket = mintToken({
      typ: "up",
      uid: user.id,
      maxBytes: size,
      exp: nowSec + 300,
    });

    return NextResponse.json({
      duplicate: false,
      ticket,
      uploadUrl: `${getGatewayUrl()}/upload`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

