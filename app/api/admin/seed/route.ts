import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

const ADMIN_EMAIL = "admin@academiaos.com";
const ADMIN_PASSWORD = "Admin123!";

const courses = [
  {
    id: "btech",
    name: "B.Tech",
    code: "BTECH",
    hasBranches: true,
    semesters: [1, 2, 3, 4, 5, 6, 7, 8],
    branches: [
      { id: "cse", name: "Computer Science & Engineering", code: "CSE" },
      { id: "it", name: "Information Technology", code: "IT" },
      { id: "ece", name: "Electronics & Communication", code: "ECE" },
      { id: "ee", name: "Electrical Engineering", code: "EE" },
      { id: "mech", name: "Mechanical Engineering", code: "ME" },
      { id: "civil", name: "Civil Engineering", code: "CE" },
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

    let adminUid: string;
    try {
      const existing = await adminAuth.getUserByEmail(ADMIN_EMAIL);
      adminUid = existing.uid;
      await adminDb.collection("users").doc(existing.uid).set(
        { uid: existing.uid, email: ADMIN_EMAIL, role: "admin", createdAt: Date.now() },
        { merge: true }
      );
      results.push(`Admin user already existed: ${existing.uid}`);
    } catch {
      const user = await adminAuth.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        displayName: "Admin",
      });
      adminUid = user.uid;
      await adminDb.collection("users").doc(user.uid).set({
        uid: user.uid,
        email: ADMIN_EMAIL,
        role: "admin",
        createdAt: Date.now(),
      });
      results.push(`Admin user created: ${user.uid}`);
    }

    for (const course of courses) {
      const { branches, ...courseData } = course;
      await adminDb.collection("courses").doc(course.id).set(courseData);
      results.push(`Course seeded: ${course.name}`);

      if (branches) {
        for (const branch of branches) {
          await adminDb
            .collection("branches")
            .doc(`${course.id}_${branch.id}`)
            .set({ ...branch, courseId: course.id });
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
