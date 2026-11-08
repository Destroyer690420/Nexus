import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyToken } from "@/lib/files-signing";

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
    if (!body || typeof body.receipt !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid receipt" },
        { status: 400 }
      );
    }

    const rc = verifyToken(body.receipt, "rc");
    if (!rc) {
      return NextResponse.json(
        { error: "Invalid or expired upload receipt" },
        { status: 400 }
      );
    }

    // Ensure receipt belongs to the caller or caller is admin
    if (rc.uid !== user.id) {
      const { data: profile } = await supabaseAdmin
        .from("users")
        .select("role")
        .eq("uid", user.id)
        .maybeSingle();

      if (profile?.role !== "admin") {
        return NextResponse.json(
          { error: "Receipt user mismatch" },
          { status: 403 }
        );
      }
    }

    // Insert into files table. Never upsert: on unique violation (sha256, size_bytes),
    // return the existing row's id and never mutate existing metadata.
    const { data, error: insertError } = await supabaseAdmin
      .from("files")
      .insert({
        tg_file_id: rc.fid,
        tg_message_id: rc.mid,
        sha256: rc.sha.toLowerCase(),
        size_bytes: rc.size,
        mime: rc.mime,
        original_name: rc.name,
        uploaded_by: user.id,
      })
      .select("id")
      .single();

    if (insertError) {
      if (
        insertError.code === "23505" ||
        insertError.message?.includes("unique") ||
        insertError.details?.includes("already exists")
      ) {
        const { data: existing, error: selectError } = await supabaseAdmin
          .from("files")
          .select("id")
          .eq("sha256", rc.sha.toLowerCase())
          .eq("size_bytes", rc.size)
          .single();

        if (existing?.id) {
          return NextResponse.json({ fileId: existing.id });
        }
        if (selectError) {
          console.error("Failed to select existing file row on conflict:", selectError);
        }
      }

      console.error("Failed to register file row:", insertError);
      return NextResponse.json(
        { error: "Failed to register file in database" },
        { status: 500 }
      );
    }

    return NextResponse.json({ fileId: data.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
