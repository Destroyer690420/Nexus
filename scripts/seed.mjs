import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

let supabaseUrl, supabaseServiceKey;
const envPath = resolve(__dirname, "../.env.local");
if (existsSync(envPath)) {
  const env = readFileSync(envPath, "utf-8");
  const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/);
  const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);
  if (urlMatch) supabaseUrl = urlMatch[1].trim();
  if (keyMatch) supabaseServiceKey = keyMatch[1].trim();
}

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

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

async function seed() {
  console.log("Seeding database...\n");

  const { data: userList } = await supabase.auth.admin.listUsers();
  let existing = userList?.users?.find((u) => u.email === ADMIN_EMAIL);

  if (existing) {
    console.log(`Admin user already exists: ${existing.id}`);
    await supabase.from("users").upsert(
      { uid: existing.id, email: ADMIN_EMAIL, role: "admin", createdAt: Date.now() },
      { onConflict: "uid" }
    );
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
    });
    if (error) throw error;
    console.log(`Admin user created: ${data.user.id}`);
    await supabase.from("users").upsert(
      { uid: data.user.id, email: ADMIN_EMAIL, role: "admin", createdAt: Date.now() },
      { onConflict: "uid" }
    );
  }

  console.log(`  Email: ${ADMIN_EMAIL}`);
  console.log(`  Password: ${ADMIN_PASSWORD}\n`);

  for (const course of courses) {
    const { branches, ...courseData } = course;
    await supabase.from("courses").upsert(courseData, { onConflict: "id" });
    console.log(`Course: ${course.name}`);

    if (branches) {
      for (const branch of branches) {
        await supabase.from("branches").upsert(branch, { onConflict: "id" });
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
