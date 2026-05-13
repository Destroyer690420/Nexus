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

    const { uid, email, role } = await req.json();
    if (user.id !== uid) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error: upsertError } = await supabaseAdmin.from("users").upsert(
      {
        uid,
        email,
        role,
        approved: role === "faculty" ? false : null,
        createdAt: Date.now(),
      },
      { onConflict: "uid" }
    );

    if (upsertError) throw upsertError;

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
