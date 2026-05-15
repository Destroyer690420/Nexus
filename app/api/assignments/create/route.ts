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

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string;
    const description = (formData.get("description") as string) || "";
    const courseId = formData.get("courseId") as string;
    const branchId = (formData.get("branchId") as string) || null;
    const semesterId = Number(formData.get("semesterId"));
    const subjectId = formData.get("subjectId") as string;
    const dueDate = Number(formData.get("dueDate"));
    const maxMarks = formData.get("maxMarks") ? Number(formData.get("maxMarks")) : null;
    const allowLate = formData.get("allowLate") === "true";

    if (!title || !courseId || !semesterId || !subjectId || !dueDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let fileUrl = "";

    if (file && file.size > 0) {
      const ext = file.name.split(".").pop();
      const fileName = `assignments/${user.id}/${Date.now()}_${crypto.randomUUID()}.${ext}`;

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

      fileUrl = urlData.publicUrl;
    }

    const { error: insertError } = await supabaseAdmin.from("assignments").insert({
      title,
      description,
      courseId,
      branchId,
      semesterId,
      subjectId,
      fileUrl,
      dueDate,
      maxMarks,
      allowLate,
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
