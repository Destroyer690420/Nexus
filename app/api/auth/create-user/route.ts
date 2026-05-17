import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  try {
    const { uid, email, role, name } = await req.json();
    if (!uid || !email || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { error: upsertError } = await supabaseAdmin.from("users").upsert(
      {
        uid,
        email,
        role,
        name: name || "",
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
