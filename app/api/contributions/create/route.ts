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
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as string;
    const title = formData.get("title") as string;
    const description = (formData.get("description") as string) || "";
    const courseId = formData.get("courseId") as string;
    const branchId = (formData.get("branchId") as string) || null;
    const semesterId = Number(formData.get("semesterId"));
    const subjectId = (formData.get("subjectId") as string) || "";
    const unit = formData.get("unit") ? Number(formData.get("unit")) : null;
    const tagsStr = (formData.get("tags") as string) || "";
    const tags = tagsStr ? tagsStr.split(",").map((t: string) => t.trim()).filter(Boolean) : [];

    let fileUrl = "";

    if (file && file.size > 0) {
      const ext = file.name.split(".").pop();
      const fileName = `contributions/${user.id}/${Date.now()}_${crypto.randomUUID()}.${ext}`;

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

    const { error: insertError } = await supabaseAdmin.from("contributions").insert({
      type,
      title,
      description,
      courseId,
      branchId,
      semesterId,
      subjectId,
      unit,
      fileUrl,
      tags,
      contributedBy: user.id,
      contributorName: user.email || "",
      status: "pending",
      createdAt: Date.now(),
    });

    if (insertError) throw insertError;

    return NextResponse.json({ success: true, fileUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
