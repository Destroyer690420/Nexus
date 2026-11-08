import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * SECURITY (Phase 15): this endpoint previously accepted attacker-chosen
 * uid/email/role with NO authentication, allowing arbitrary profile creation
 * and self-promotion to admin. Identity is now derived exclusively from the
 * verified Supabase JWT; role escalation is impossible (admin can never be
 * self-assigned; faculty starts unapproved).
 */
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

    const body = (await req.json().catch(() => ({}))) as { name?: string; role?: string };
    const name = body.name;

    // Role selection is client-requested but constrained: a brand-new user
    // may become 'student' or 'faculty' (faculty requires approval). An
    // existing row's role is never overwritten here.
    const { data: caller } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("uid", user.id)
      .maybeSingle();

    if (caller) {
      return NextResponse.json({ success: true, existed: true });
    }

    const role = body.role === "faculty" ? "faculty" : "student";

    const { error: upsertError } = await supabaseAdmin.from("users").upsert(
      {
        uid: user.id,
        email: user.email ?? "",
        role,
        name: typeof name === "string" ? name.slice(0, 120) : "",
        approved: role === "faculty" ? false : null,
        createdAt: Date.now(),
      },
      { onConflict: "uid" }
    );
    if (upsertError) throw upsertError;

    return NextResponse.json({ success: true, existed: false });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
