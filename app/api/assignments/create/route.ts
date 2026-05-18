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

    if (!caller || (caller.role !== "admin" && caller.role !== "faculty")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const {
      title,
      description = "",
      courseId,
      branchId = null,
      semesterId,
      subjectId,
      dueDate,
      maxMarks,
      allowLate = false,
      fileUrl = "",
    } = await req.json();

    if (!title || !courseId || semesterId === undefined || semesterId === null || !subjectId || !dueDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { error: insertError } = await supabaseAdmin.from("assignments").insert({
      title,
      description,
      courseId,
      branchId: branchId || null,
      semesterId: Number(semesterId),
      subjectId,
      fileUrl,
      dueDate: Number(dueDate),
      maxMarks: maxMarks ? Number(maxMarks) : null,
      allowLate: allowLate === true,
      createdBy: user.id,
      createdAt: Date.now(),
    });

    if (insertError) throw insertError;

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
