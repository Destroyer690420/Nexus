import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const ADMIN_EMAIL = "admin@nexus.com";
const ADMIN_PASSWORD = "Admin123!";

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

export async function POST() {
  try {
    const results: string[] = [];

    const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = userList?.users?.find((u) => u.email === ADMIN_EMAIL);
    let adminUid: string;

    if (existingUser) {
      adminUid = existingUser.id;
      await supabaseAdmin.from("users").upsert(
        { uid: adminUid, email: ADMIN_EMAIL, role: "admin", createdAt: Date.now() },
        { onConflict: "uid" }
      );
      results.push(`Admin user already existed: ${adminUid}`);
    } else {
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
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

    return NextResponse.json({
      success: true,
      adminEmail: ADMIN_EMAIL,
      adminPassword: ADMIN_PASSWORD,
      adminUid,
      results,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
