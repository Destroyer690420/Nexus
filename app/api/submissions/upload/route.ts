import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

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

    const formData = await req.formData();
    const assignmentId = formData.get("assignmentId") as string;
    const file = formData.get("file") as File | null;

    if (!assignmentId || !file || file.size === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data: assignment } = await supabaseAdmin
      .from("assignments")
      .select("*")
      .eq("id", assignmentId)
      .single();

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    const now = Date.now();
    const dueDate = (assignment as Record<string, unknown>).dueDate as number;
    const allowLate = (assignment as Record<string, unknown>).allowLate as boolean;
    const isLate = now > dueDate;

    if (isLate && !allowLate) {
      return NextResponse.json({ error: "Submission deadline has passed and late submissions are not allowed" }, { status: 400 });
    }

    const ext = file.name.split(".").pop();
    const fileName = `submissions/${user.id}/${assignmentId}/${Date.now()}_${crypto.randomUUID()}.${ext}`;

    const { error: bucketError } = await supabaseAdmin.storage.createBucket("resources", {
      public: true,
    });

    const { error: uploadError } = await supabaseAdmin.storage
      .from("resources")
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      return NextResponse.json({ error: `Storage upload failed: ${uploadError.message}` }, { status: 500 });
    }

    const { data: urlData } = supabaseAdmin.storage
      .from("resources")
      .getPublicUrl(fileName);

    const fileUrl = urlData.publicUrl;
    const status = isLate ? "late" : "submitted";

    const { data: existing } = await supabaseAdmin
      .from("submissions")
      .select("id")
      .eq("assignmentId", assignmentId)
      .eq("studentId", user.id)
      .maybeSingle();

    if (existing) {
      const { error: updateError } = await supabaseAdmin
        .from("submissions")
        .update({
          status,
          fileUrl,
          submittedAt: now,
        })
        .eq("id", (existing as Record<string, unknown>).id);
      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabaseAdmin.from("submissions").insert({
        assignmentId,
        studentId: user.id,
        status,
        fileUrl,
        submittedAt: now,
      });
      if (insertError) throw insertError;
    }

    return NextResponse.json({ success: true, fileUrl, status });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
