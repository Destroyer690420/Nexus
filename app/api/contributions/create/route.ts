import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { registerUploadedFile } from "@/lib/storage/server/register-upload";

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

    const { data: caller } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("uid", user.id)
      .single();

    if (!caller || caller.role !== "student") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const {
      type,
      title,
      description = "",
      courseId,
      branchId = null,
      semesterId,
      subjectId = "",
      unit,
      years,
      tags: tagsStr = "",
      fileUrl = "",
      storagePath,
      fileSha256,
      fileSize,
      fileMime,
      fileName,
    } = await req.json();

    if (!type || !title || !courseId || semesterId === undefined || semesterId === null || !subjectId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Students may not contribute assignment material (faculty/admin only).
    if (type === "assignments") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let storageObjectId: string | null = null;
    const resolvedFileUrl = typeof fileUrl === "string" ? fileUrl : "";
    if (storagePath && fileSha256 && fileSize) {
      const reg = await registerUploadedFile({
        stagingBucket: process.env.STORAGE_STAGING_BUCKET ?? "staging",
        stagingPath: String(storagePath),
        size: Number(fileSize),
        mimeType: fileMime ? String(fileMime) : undefined,
        fileName: String(fileName ?? "file"),
        sha256: String(fileSha256),
        refCount: type === "pyqs" && Array.isArray(years) && years.length > 0 ? years.length : 1,
      });
      storageObjectId = reg.objectId;
    } else if (!resolvedFileUrl) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const tags = typeof tagsStr === "string"
      ? tagsStr.split(",").map((t: string) => t.trim()).filter(Boolean)
      : tagsStr;

    const baseContribution = {
      type,
      title,
      description,
      courseId,
      branchId: branchId || null,
      semesterId: Number(semesterId),
      subjectId,
      unit: unit ? Number(unit) : null,
      fileUrl: resolvedFileUrl,
      ...(storageObjectId ? { storageObjectId } : {}),
      tags,
      contributedBy: user.id,
      contributorName: user.email || "",
      status: "pending",
      createdAt: Date.now(),
    };

    if (type === "pyqs" && Array.isArray(years) && years.length > 0) {
      const contributionsToInsert = years.map((y) => ({
        ...baseContribution,
        year: Number(y),
      }));
      const { error: insertError } = await supabaseAdmin.from("contributions").insert(contributionsToInsert);
      if (insertError) throw insertError;
    } else {
      const { error: insertError } = await supabaseAdmin.from("contributions").insert(baseContribution);
      if (insertError) throw insertError;
    }

    return NextResponse.json({
      success: true,
      fileUrl: resolvedFileUrl,
      storageObjectId,
      processing: Boolean(storageObjectId),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

