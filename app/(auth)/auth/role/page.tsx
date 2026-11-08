"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  ChalkboardTeacher,
  CheckCircle,
} from "@phosphor-icons/react";
import { Button, Stickie } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import {
  getCurrentUser,
  createUserData,
  getAuthErrorMessage,
} from "@/lib/supabase-auth";
import { getAuthRedirectTarget } from "@/lib/auth-redirect";
import type { UserRole } from "@/types";

export default function RoleSelectionPage() {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>("student");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let active = true;
    const checkSession = async () => {
      try {
        const user = await getCurrentUser();
        if (!user) {
          if (active) setCheckingSession(false);
          return;
        }

        const target = await getAuthRedirectTarget(user.id);
        if (!active) return;
        if (target !== "/auth/role") {
          router.replace(target);
        } else {
          if (active) setCheckingSession(false);
        }
      } catch {
        if (active) setCheckingSession(false);
      }
    };
    checkSession();
    return () => {
      active = false;
    };
  }, [router]);

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

  if (checkingSession) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Stickie mood="think" size={80} />
        <p className="font-display font-extrabold text-sm text-ink-3">
          Checking session...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-col items-center text-center mb-6">
        <Stickie mood="think" size={72} />
        <h1 className="mt-3 font-display font-black text-2xl tracking-tight text-ink">
          One quick question
        </h1>
        <p className="mt-1 text-xs font-semibold text-ink-2">
          How will you be using Nexus this semester?
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-4 p-3 rounded-[16px] bg-crimson-tint border-2 border-crimson/20 text-crimson-deep text-xs font-semibold"
        >
          {error}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {/* Student card */}
        <button
          type="button"
          onClick={() => setRole("student")}
          className={`w-full p-4 rounded-[20px] border-2 text-left transition-all cursor-pointer flex items-center justify-between ${
            role === "student"
              ? "border-berry bg-berry-tint/40 shadow-[0_3px_0_var(--color-berry)]"
              : "border-line bg-surface hover:border-line-strong shadow-[0_3px_0_var(--line-strong)]"
          }`}
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              className={`w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0 ${
                role === "student"
                  ? "bg-berry text-white"
                  : "bg-surface-sunken text-ink-2"
              }`}
            >
              <GraduationCap size={26} weight="bold" />
            </div>
            <div>
              <h2 className="font-display font-black text-base text-ink">
                Student
              </h2>
              <p className="text-xs font-medium text-ink-2 mt-0.5">
                Find notes, PYQs, and upload study material.
              </p>
            </div>
          </div>
          <div className="shrink-0 ml-2">
            {role === "student" ? (
              <CheckCircle size={24} weight="fill" className="text-berry" />
            ) : (
              <div className="w-5 h-5 rounded-full border-2 border-line-strong" />
            )}
          </div>
        </button>

        {/* Faculty card */}
        <button
          type="button"
          onClick={() => setRole("faculty")}
          className={`w-full p-4 rounded-[20px] border-2 text-left transition-all cursor-pointer flex items-center justify-between ${
            role === "faculty"
              ? "border-berry bg-berry-tint/40 shadow-[0_3px_0_var(--color-berry)]"
              : "border-line bg-surface hover:border-line-strong shadow-[0_3px_0_var(--line-strong)]"
          }`}
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              className={`w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0 ${
                role === "faculty"
                  ? "bg-berry text-white"
                  : "bg-surface-sunken text-ink-2"
              }`}
            >
              <ChalkboardTeacher size={26} weight="bold" />
            </div>
            <div>
              <h2 className="font-display font-black text-base text-ink">
                Faculty / Professor
              </h2>
              <p className="text-xs font-medium text-ink-2 mt-0.5">
                Share course materials, lab manuals, and assignments.
              </p>
            </div>
          </div>
          <div className="shrink-0 ml-2">
            {role === "faculty" ? (
              <CheckCircle size={24} weight="fill" className="text-berry" />
            ) : (
              <div className="w-5 h-5 rounded-full border-2 border-line-strong" />
            )}
          </div>
        </button>
      </div>

      <div className="mt-6">
        <Button
          onClick={handleContinue}
          variant="primary"
          size="lg"
          fullWidth
          loading={loading}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
