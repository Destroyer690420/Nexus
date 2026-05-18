"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { onAuthChange, getUserData, getAuthErrorMessage } from "@/lib/supabase-auth";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const unsub = onAuthChange(async (user) => {
      if (!user) return;
      if (user.email_confirmed_at) {
        const data = await getUserData(user.id);
        if (data?.role === "student") router.replace("/onboarding");
        else if (data?.role === "faculty") router.replace("/waitlist");
        else router.replace("/dashboard");
      }
    });
    return unsub;
  }, [router]);

  const handleResend = async () => {
    setResending(true);
    setMessage("");
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      });
      if (error) throw error;
      setMessage("Verification email sent! Check your inbox.");
    } catch (err) {
      setMessage(getAuthErrorMessage(err));
    }
    setResending(false);
  };

  const handleLogin = () => {
    router.replace("/auth/login");
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent-light">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-accent"
          >
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="m22 7-10 7L2 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
          Verify your email
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          We sent a confirmation link to{" "}
          <span className="font-medium text-text-primary">
            {email || "your email"}
          </span>
        </p>
        <p className="mt-3 rounded-md border border-border bg-surface px-4 py-3 text-sm text-text-secondary">
          Open your email inbox, find the message from Nexus, and click
          the <strong className="text-text-primary">Confirm</strong> button to
          activate your account. You can then sign in.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <Button
          onClick={handleLogin}
          variant="primary"
          className="w-full h-11"
        >
          Go to sign in
        </Button>
        <Button
          onClick={handleResend}
          loading={resending}
          variant="ghost"
          className="w-full h-11"
        >
          Resend verification email
        </Button>
      </div>

      {message && (
        <p className="text-center text-sm text-text-secondary">{message}</p>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-6 w-6 border-2 border-text-tertiary border-t-accent rounded-full" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
