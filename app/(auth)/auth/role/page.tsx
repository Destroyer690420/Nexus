"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { getCurrentUser, createUserData, getAuthErrorMessage } from "@/lib/supabase-auth";
import type { UserRole } from "@/types";

export default function RoleSelectionPage() {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>("student");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleContinue = async () => {
    setLoading(true);
    setError("");
    try {
      const user = await getCurrentUser();
      if (!user) {
        router.replace("/auth");
        return;
      }
      await createUserData(user.id, user.email || "", role);

      if (role === "student") {
        const { data: profile } = await supabase
          .from("student_profiles")
          .select("uid")
          .eq("uid", user.id)
          .single();
        if (profile) router.replace("/dashboard");
        else router.replace("/onboarding");
      } else {
        router.replace("/waitlist");
      }
    } catch (err) {
      setError(getAuthErrorMessage(err));
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
          Almost there
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          How will you use Academia OS?
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <button
          type="button"
          onClick={() => setRole("student")}
          className={`rounded-lg border p-5 text-left transition-all duration-150 ease-out cursor-pointer ${
            role === "student"
              ? "border-accent bg-accent-light"
              : "border-border bg-surface hover:bg-surface-hover"
          }`}
        >
          <div
            className={`text-base font-semibold ${
              role === "student" ? "text-accent" : "text-text-primary"
            }`}
          >
            Student
          </div>
          <div
            className={`mt-1 text-sm ${
              role === "student" ? "text-accent/80" : "text-text-secondary"
            }`}
          >
            Access notes, PYQs, assignments, and study materials
          </div>
        </button>
        <button
          type="button"
          onClick={() => setRole("faculty")}
          className={`rounded-lg border p-5 text-left transition-all duration-150 ease-out cursor-pointer ${
            role === "faculty"
              ? "border-accent bg-accent-light"
              : "border-border bg-surface hover:bg-surface-hover"
          }`}
        >
          <div
            className={`text-base font-semibold ${
              role === "faculty" ? "text-accent" : "text-text-primary"
            }`}
          >
            Faculty
          </div>
          <div
            className={`mt-1 text-sm ${
              role === "faculty" ? "text-accent/80" : "text-text-secondary"
            }`}
          >
            Upload resources, post assignments, and manage content
          </div>
        </button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button onClick={handleContinue} loading={loading} className="w-full h-11">
        Continue
      </Button>
    </div>
  );
}
