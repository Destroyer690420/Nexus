import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { mintToken, getGatewayUrl } from "@/lib/files-signing";

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
    if (!body || typeof body.fileId !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid fileId" },
        { status: 400 }
      );
    }

    const fileId = body.fileId.trim();
    const disposition: "inline" | "attachment" =
      body.disposition === "attachment" ? "attachment" : "inline";

    // Fetch file record
    const { data: file, error: fileError } = await supabaseAdmin
      .from("files")
      .select("id, tg_file_id, original_name, mime, size_bytes, uploaded_by")
      .eq("id", fileId)
      .maybeSingle();

    if (fileError || !file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Check authorization
    // 1. Uploader can always access
    let authorized = file.uploaded_by === user.id;

    if (!authorized) {
      // 2. Admin or faculty can access
      const { data: profile } = await supabaseAdmin
        .from("users")
        .select("role")
        .eq("uid", user.id)
        .maybeSingle();

      if (profile?.role === "admin" || profile?.role === "faculty") {
        authorized = true;
      }
    }

    if (!authorized) {
      // 3. Resource reference check (resources are approved campus materials)
      const { data: resource } = await supabaseAdmin
        .from("resources")
        .select("id")
        .eq("fileId", fileId)
        .limit(1)
        .maybeSingle();

      if (resource) {
        authorized = true;
      }
    }

    if (!authorized) {
      // 4. Contribution check: user's own contribution or approved contribution
      const { data: contribution } = await supabaseAdmin
        .from("contributions")
        .select("id, contributedBy, status")
        .eq("fileId", fileId)
        .limit(1)
        .maybeSingle();

      if (
        contribution &&
        (contribution.contributedBy === user.id ||
          contribution.status === "approved")
      ) {
        authorized = true;
      }
    }

    if (!authorized) {
      return NextResponse.json(
        { error: "Access denied to requested file" },
        { status: 403 }
      );
    }

    // Mint signed dl token valid for 10 minutes
    const nowSec = Math.floor(Date.now() / 1000);
    const dlToken = mintToken({
      typ: "dl",
      fid: file.tg_file_id,
      name: file.original_name,
      mime: file.mime,
      size: file.size_bytes,
      disp: disposition,
      exp: nowSec + 600,
    });

    return NextResponse.json({
      url: `${getGatewayUrl()}/f/${dlToken}`,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

