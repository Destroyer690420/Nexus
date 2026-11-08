import { supabase } from "./supabase";
import { getUserData } from "./supabase-auth";

/**
 * Computes the canonical dashboard redirect target for a given user.
 * Preserves the exact role and profile conditions:
 * - Missing user row -> /auth/role
 * - Student with profile -> /dashboard
 * - Student without profile -> /onboarding
 * - Approved faculty -> /dashboard
 * - Unapproved faculty -> /waitlist
 * - Admin -> /dashboard
 */
export async function getAuthRedirectTarget(userId: string): Promise<string> {
  const data = await getUserData(userId);
  if (!data) return "/auth/role";

  if (data.role === "student") {
    const { data: profile } = await supabase
      .from("student_profiles")
      .select("uid")
      .eq("uid", userId)
      .single();
    return profile ? "/dashboard" : "/onboarding";
  }

  if (data.role === "faculty") {
    return data.approved ? "/dashboard" : "/waitlist";
  }

  return "/dashboard";
}
