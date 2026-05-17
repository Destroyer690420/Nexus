import { supabase } from "./supabase";
import type { User } from "@supabase/supabase-js";
import type { UserRole, UserData } from "@/types";

function mapUser(row: Record<string, unknown> | null): UserData | null {
  if (!row) return null;
  return {
    uid: row.uid as string,
    email: row.email as string,
    name: (row.name as string) || "",
    avatarUrl: (row.avatarUrl as string) || "",
    role: row.role as UserRole,
    createdAt: row.createdAt as number,
    approved: row.approved as boolean | undefined,
  };
}

export async function signUpWithEmail(
  email: string,
  password: string,
  role: UserRole,
  name?: string
) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  if (!data.user) throw new Error("Signup failed");

  const res = await fetch("/api/auth/create-user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      uid: data.user.id,
      email: data.user.email || email,
      role,
      name: name || "",
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to create user profile");
  }

  return data.user;
}

export async function loginWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data.user;
}

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  if (error) throw error;
  return data;
}

export async function sendVerificationEmail() {
  const { data: sessionData } = await supabase.auth.getSession();
  const email = sessionData.session?.user?.email;
  if (email) {
    await supabase.auth.resend({ type: "signup", email });
  }
}

export async function getUserData(uid: string): Promise<UserData | null> {
  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("uid", uid)
    .single();
  return mapUser(data as Record<string, unknown> | null);
}

export async function createUserData(
  uid: string,
  email: string,
  role: UserRole,
  name?: string
) {
  const res = await fetch("/api/auth/create-user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uid, email, role, name: name || "" }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to create user profile");
  }
  return {
    uid,
    email,
    name: name || "",
    avatarUrl: "",
    role,
    approved: role === "faculty" ? false : undefined,
    createdAt: Date.now(),
  } as UserData;
}

export async function updateUserProfile(
  uid: string,
  updates: { name?: string; avatarUrl?: string }
): Promise<void> {
  const { error } = await supabase
    .from("users")
    .update(updates)
    .eq("uid", uid);
  if (error) throw error;
}

export function onAuthChange(
  callback: (user: User | null) => void
) {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });
  return () => subscription.unsubscribe();
}

export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSessionToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function checkEmailVerified(userId: string): Promise<boolean> {
  const { data } = await supabase.auth.admin.getUserById(userId);
  return !!data.user?.email_confirmed_at;
}

const errorMessages: Record<string, string> = {
  "user_already_exists": "An account with this email already exists.",
  "invalid_credentials": "Invalid email or password.",
  "email_not_confirmed": "Please verify your email address.",
  "too_many_requests": "Too many attempts. Please try again later.",
  "weak_password": "Password should be at least 6 characters.",
  "signup_disabled": "Signup is currently disabled.",
};

export function getAuthErrorMessage(error: unknown): string {
  const msg = (error as { message?: string })?.message || "";
  const code = (error as { code?: string })?.code || "";
  const status = (error as { status?: number })?.status;

  if (status === 429) return errorMessages["too_many_requests"];

  if (msg.includes("already registered") || msg.includes("already exists"))
    return errorMessages["user_already_exists"];
  if (msg.includes("Invalid login credentials"))
    return errorMessages["invalid_credentials"];
  if (msg.includes("Email not confirmed"))
    return errorMessages["email_not_confirmed"];
  if (msg.includes("weak"))
    return errorMessages["weak_password"];

  return errorMessages[code] || msg || "Something went wrong. Please try again.";
}
