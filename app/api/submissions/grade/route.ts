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

    const body = await req.json();
    const { submissionId, grade, feedback } = body;

    if (!submissionId) {
      return NextResponse.json({ error: "Missing submissionId" }, { status: 400 });
    }

    const { error: updateError } = await supabaseAdmin
      .from("submissions")
      .update({
        grade: grade || null,
        feedback: feedback || "",
        gradedBy: user.id,
        gradedAt: Date.now(),
      })
      .eq("id", submissionId);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
