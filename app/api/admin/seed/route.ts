import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

/**
 * SECURITY (Phase 15): this endpoint previously created an admin account
 * with a hardcoded password and returned those credentials to ANY caller.
 * It is now:
 *  - disabled unless ADMIN_SEED_SECRET is set and presented as Bearer,
 *  - refuses to run once any admin user already exists,
 *  - takes the admin password from env (ADMIN_SEED_PASSWORD), never returns it.
 * Prefer scripts/seed.mjs for initial provisioning; keep this route disabled
 * in production by simply not setting the secret.
 */

const ADMIN_EMAIL = "admin@nexus.com";

const courses = [
  {
    id: "btech",
    name: "B.Tech",
    code: "BTECH",
    hasBranches: true,
    semesters: [1, 2, 3, 4, 5, 6, 7, 8],
    branches: [
      { id: "btech_cse", name: "Computer Science & Engineering", code: "CSE", courseId: "btech" },
      { id: "btech_it", name: "Information Technology", code: "IT", courseId: "btech" },
      { id: "btech_ece", name: "Electronics & Communication", code: "ECE", courseId: "btech" },
      { id: "btech_ee", name: "Electrical Engineering", code: "EE", courseId: "btech" },
      { id: "btech_mech", name: "Mechanical Engineering", code: "ME", courseId: "btech" },
      { id: "btech_civil", name: "Civil Engineering", code: "CE", courseId: "btech" },
    ],
  },
  {
    id: "bca",
    name: "BCA",
    code: "BCA",
    hasBranches: false,
    semesters: [1, 2, 3, 4, 5, 6],
  },
  {
    id: "bba",
    name: "BBA",
    code: "BBA",
    hasBranches: false,
    semesters: [1, 2, 3, 4, 5, 6],
  },
];

export async function POST(req: NextRequest) {
  const secret = process.env.ADMIN_SEED_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Seeding is disabled on this deployment" }, { status: 404 });
  }
  const provided = req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Refuse when an admin already exists — one-time bootstrap only.
    const { data: existingAdmin } = await supabaseAdmin
      .from("users")
      .select("uid")
      .eq("role", "admin")
      .limit(1)
      .maybeSingle();
    if (existingAdmin) {
      return NextResponse.json({ error: "An admin user already exists" }, { status: 409 });
    }

    const results: string[] = [];

    const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = userList?.users?.find((u) => u.email === ADMIN_EMAIL);
    let adminUid: string;

    const seedPassword = process.env.ADMIN_SEED_PASSWORD;
    if (!seedPassword || seedPassword.length < 12) {
      return NextResponse.json(
        { error: "ADMIN_SEED_PASSWORD must be set (>=12 chars)" },
        { status: 500 }
      );
    }

    if (existingUser) {
      adminUid = existingUser.id;
      await supabaseAdmin.from("users").upsert(
        { uid: adminUid, email: ADMIN_EMAIL, role: "admin", createdAt: Date.now() },
        { onConflict: "uid" }
      );
      results.push(`Admin user linked: ${adminUid}`);
    } else {
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: seedPassword,
        email_confirm: true,
      });
      if (createError) throw createError;
      adminUid = newUser!.user.id;
      await supabaseAdmin.from("users").upsert(
        { uid: adminUid, email: ADMIN_EMAIL, role: "admin", createdAt: Date.now() },
        { onConflict: "uid" }
      );
      results.push(`Admin user created: ${adminUid}`);
    }

    for (const course of courses) {
      const { branches, ...courseData } = course;
      const { error: courseError } = await supabaseAdmin
        .from("courses")
        .upsert(courseData, { onConflict: "id" });
      if (courseError) throw courseError;
      results.push(`Course seeded: ${course.name}`);

      if (branches) {
        for (const branch of branches) {
          const { error: branchError } = await supabaseAdmin
            .from("branches")
            .upsert(branch, { onConflict: "id" });
          if (branchError) throw branchError;
        }
      }
    }

    return NextResponse.json({ success: true, adminUid, results });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
