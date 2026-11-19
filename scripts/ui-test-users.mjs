// scripts/ui-test-users.mjs
// Creates and cleans up ephemeral test users for E2E tests

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx > 0) {
      const k = trimmed.slice(0, eqIdx).trim();
      const v = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[k]) {
        process.env[k] = v;
      }
    }
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const USERS_FILE = path.resolve(process.cwd(), ".ui-test-users.json");

export async function createTestUsers() {
  const runId = crypto.randomBytes(4).toString("hex");
  const defaultPassword = `TestPass!${crypto.randomBytes(6).toString("hex")}`;

  const roles = [
    { role: "student", prefix: "student" },
    { role: "faculty", prefix: "faculty" },
    { role: "admin", prefix: "admin" },
  ];

  const created = {};

  for (const { role, prefix } of roles) {
    const email = `nexus-ui-${prefix}-${runId}@example.test`;
    const name = `Test ${prefix.charAt(0).toUpperCase() + prefix.slice(1)} ${runId}`;

    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: defaultPassword,
      email_confirm: true,
      user_metadata: { name },
    });

    if (authError) {
      console.error(`Failed to create auth user for ${role}:`, authError);
      throw authError;
    }

    const uid = authData.user.id;

    // 2. Insert into public.users
    const { error: userError } = await supabase.from("users").upsert({
      uid,
      email,
      role,
      approved: role !== "faculty" || true, // Approve for tests
      createdAt: Date.now(),
    });

    if (userError) {
      console.error(`Failed to insert public.users for ${role}:`, userError);
      throw userError;
    }

    // 3. For student, insert student profile
    if (role === "student") {
      // Find a valid course and branch if available
      const { data: courses } = await supabase.from("courses").select("id").limit(1);
      const courseId = courses?.[0]?.id || "btech";
      const { data: branches } = await supabase.from("branches").select("id").eq("courseId", courseId).limit(1);
      const branchId = branches?.[0]?.id || null;

      await supabase.from("student_profiles").upsert({
        uid,
        courseId,
        branchId,
        semesterId: 1,
        createdAt: Date.now(),
      });
    }

    created[role] = {
      uid,
      email,
      password: defaultPassword,
      name,
      role,
    };
  }

  fs.writeFileSync(USERS_FILE, JSON.stringify(created, null, 2), "utf-8");
  console.log(`Created ${Object.keys(created).length} test users (runId: ${runId})`);
  return created;
}

export async function cleanupTestUsers() {
  if (!fs.existsSync(USERS_FILE)) {
    console.log("No test users file found to clean up.");
    return;
  }

  let users = {};
  try {
    users = JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
  } catch {
    return;
  }

  for (const key of Object.keys(users)) {
    const u = users[key];
    if (!u?.uid) continue;

    // Clean student profile
    await supabase.from("student_profiles").delete().eq("uid", u.uid);
    // Clean contributions created by this user
    await supabase.from("contributions").delete().eq("contributedBy", u.uid);
    // Clean announcements created by this user
    await supabase.from("announcements").delete().eq("authorId", u.uid);
    // Clean public.users
    await supabase.from("users").delete().eq("uid", u.uid);
    // Delete auth user
    await supabase.auth.admin.deleteUser(u.uid);
  }

  try {
    fs.unlinkSync(USERS_FILE);
  } catch {}

  console.log("Cleaned up test users successfully.");
}

// If run directly from CLI
if (process.argv[1]?.endsWith("ui-test-users.mjs")) {
  const cmd = process.argv[2];
  if (cmd === "create") {
    createTestUsers().then(() => process.exit(0)).catch((err) => {
      console.error(err);
      process.exit(1);
    });
  } else if (cmd === "cleanup") {
    cleanupTestUsers().then(() => process.exit(0)).catch((err) => {
      console.error(err);
      process.exit(1);
    });
  } else {
    console.log("Usage: node scripts/ui-test-users.mjs [create|cleanup]");
  }
}
