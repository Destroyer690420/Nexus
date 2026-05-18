"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { signInWithGoogle, getUserData, onAuthChange } from "@/lib/supabase-auth";
import { getCurrentUser } from "@/lib/supabase-auth";

export default function AuthPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsub = onAuthChange(async (user) => {
      if (!user) return;
      const data = await getUserData(user.id);
      if (!data) return;
      if (data.role === "student") router.replace("/onboarding");
      else if (data.role === "faculty") router.replace("/waitlist");
      else router.replace("/dashboard");
    });
    return unsub;
  }, [router]);

  const handleGoogle = async () => {
    setLoading(true);
    setError("");
    try {
      await signInWithGoogle();
    } catch (err) {
      setError((err as { message?: string })?.message || "Something went wrong.");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[var(--radius-lg)] bg-accent shadow-lg shadow-accent/25">
          <span className="text-white text-xl font-bold">N</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">
          Nexus
        </h1>
        <p className="mt-1.5 text-sm text-text-secondary">
          College resources, simplified.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <Button
          onClick={handleGoogle}
          loading={loading}
          variant="secondary"
          className="w-full h-12 text-[13px]"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </Button>

        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-surface/80 px-3 text-text-tertiary font-medium">or</span>
          </div>
        </div>

        <Button
          onClick={() => router.push("/auth/login")}
          variant="ghost"
          className="w-full h-12 text-[13px] text-text-secondary"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 7L2 7"/></svg>
          Continue with Email
        </Button>
      </div>

      {error && (
        <div className="rounded-[var(--radius-md)] bg-destructive/10 border border-destructive/20 p-3">
          <p className="text-center text-sm text-destructive">{error}</p>
        </div>
      )}
    </div>
  );
}
