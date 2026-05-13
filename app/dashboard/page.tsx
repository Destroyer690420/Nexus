"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { onAuthChange, getUserData } from "@/lib/supabase-auth";
import type { UserData } from "@/types";

export default function DashboardPage() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    const unsub = onAuthChange(async (user) => {
      if (!user) {
        router.replace("/auth");
        return;
      }
      const data = await getUserData(user.id);
      if (!data) {
        router.replace("/auth");
        return;
      }
      setUserData(data);

      if (data.role === "student") {
        const { data: profile } = await supabase
          .from("student_profiles")
          .select("*")
          .eq("uid", user.id)
          .single();
        if (!profile) {
          router.replace("/onboarding");
          return;
        }
      }
    });
    return unsub;
  }, [router]);

  if (!userData) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-6 w-6 border-2 border-text-tertiary border-t-accent rounded-full" />
      </div>
    );
  }

  const roleLabel =
    userData.role === "admin"
      ? "Admin"
      : userData.role === "faculty"
        ? "Faculty"
        : "Student";

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
        Welcome
      </h1>
      <p className="mt-1 text-sm text-text-secondary">
        You are signed in as{" "}
        <span className="font-medium text-text-primary">{roleLabel}</span>.
      </p>

      <div className="mt-8 grid gap-4">
        <div className="rounded-lg border border-border bg-white p-5">
          <h3 className="text-sm font-medium text-text-primary">
            Getting Started
          </h3>
          <p className="mt-1 text-sm text-text-secondary">
            {userData.role === "admin"
              ? "Go to the Admin Panel to approve faculty accounts and seed data."
              : userData.role === "faculty"
                ? "You can now upload notes, post assignments, and manage content."
                : "Browse notes, PYQs, and assignments filtered for your course."}
          </p>
        </div>
      </div>
    </div>
  );
}
