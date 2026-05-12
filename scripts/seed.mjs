import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

let serviceAccount;
const saEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
if (saEnv) {
  serviceAccount = JSON.parse(saEnv);
} else {
  const saPath = resolve(__dirname, "../service-account.json");
  if (!existsSync(saPath)) {
    console.error(
      "Missing service-account.json. Download it from Firebase Console > Project Settings > Service Accounts, then save it in the project root."
    );
    process.exit(1);
  }
  serviceAccount = JSON.parse(readFileSync(saPath, "utf-8"));
}

const app = initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore(app);
const auth = getAuth(app);

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
    id: "bba",
    name: "BBA",
    code: "BBA",
    hasBranches: false,
    semesters: [1, 2, 3, 4, 5, 6],
  },
  {
    id: "bcom",
    name: "B.Com",
    code: "BCOM",
    hasBranches: false,
    semesters: [1, 2, 3, 4, 5, 6],
  },
  {
    id: "ba",
    name: "BA",
    code: "BA",
    hasBranches: true,
    semesters: [1, 2, 3, 4, 5, 6],
    branches: [
      { id: "english", name: "English", code: "ENG" },
      { id: "economics", name: "Economics", code: "ECO" },
      { id: "pol-sci", name: "Political Science", code: "PSC" },
      { id: "history", name: "History", code: "HIS" },
      { id: "psychology", name: "Psychology", code: "PSY" },
      { id: "sociology", name: "Sociology", code: "SOC" },
    ],
  },
  {
    id: "mtech",
    name: "M.Tech",
    code: "MTECH",
    hasBranches: true,
    semesters: [1, 2, 3, 4],
    branches: [
      { id: "cse", name: "Computer Science & Engineering", code: "CSE" },
      { id: "ece", name: "Electronics & Communication", code: "ECE" },
      { id: "ee", name: "Electrical Engineering", code: "EE" },
      { id: "mech", name: "Mechanical Engineering", code: "ME" },
    ],
  },
];

async function seed() {
  console.log("Seeding database...\n");

  // 1. Create admin user
  try {
    const existing = await auth.getUserByEmail(ADMIN_EMAIL);
    console.log(`Admin user already exists: ${existing.uid}`);
    await db.collection("users").doc(existing.uid).set(
      {
        uid: existing.uid,
        email: ADMIN_EMAIL,
        role: "admin",
        createdAt: Date.now(),
      },
      { merge: true }
    );
  } catch {
    const user = await auth.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      displayName: "Admin",
    });
    await db.collection("users").doc(user.uid).set({
      uid: user.uid,
      email: ADMIN_EMAIL,
      role: "admin",
      createdAt: Date.now(),
    });
    console.log(`Admin user created: ${user.uid}`);
  }

  console.log(`  Email: ${ADMIN_EMAIL}`);
  console.log(`  Password: ${ADMIN_PASSWORD}\n`);

  // 2. Seed courses
  for (const course of courses) {
    const { branches, ...courseData } = course;
    await db.collection("courses").doc(course.id).set(courseData);
    console.log(`Course: ${course.name}`);

    if (branches) {
      for (const branch of branches) {
        await db
          .collection("branches")
          .doc(`${course.id}_${branch.id}`)
          .set({ ...branch, courseId: course.id });
        console.log(`  Branch: ${branch.name}`);
      }
    }
  }

  console.log("\nSeeding complete!");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
