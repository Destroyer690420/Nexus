"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import {
  auth,
  sendVerificationEmail,
  getUserData,
  onAuthChange,
  getAuthErrorMessage,
} from "@/lib/auth";

export default function VerifyEmailPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const unsub = onAuthChange(async (user) => {
      if (!user) {
        router.replace("/auth");
        return;
      }
      setEmail(user.email || "");
      if (user.emailVerified) {
        const data = await getUserData(user.uid);
        if (data?.role === "student") router.replace("/onboarding");
        else if (data?.role === "faculty") router.replace("/waitlist");
        else router.replace("/dashboard");
      }
    });
    return unsub;
  }, [router]);

  useEffect(() => {
    const interval = setInterval(async () => {
      const user = auth.currentUser;
      if (!user) return;
      await user.reload();
      if (user.emailVerified) {
        clearInterval(interval);
        const data = await getUserData(user.uid);
        if (data?.role === "student") router.replace("/onboarding");
        else if (data?.role === "faculty") router.replace("/waitlist");
        else router.replace("/dashboard");
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [router]);

  const handleResend = async () => {
    setResending(true);
    setMessage("");
    try {
      await sendVerificationEmail();
      setMessage("Verification email sent!");
    } catch (err) {
      setMessage(getAuthErrorMessage(err));
    }
    setResending(false);
  };

  const handleCheckNow = async () => {
    setChecking(true);
    setMessage("");
    const user = auth.currentUser;
    if (!user) {
      router.replace("/auth");
      return;
    }
    await user.reload();
    if (user.emailVerified) {
      const data = await getUserData(user.uid);
      if (data?.role === "student") router.replace("/onboarding");
      else if (data?.role === "faculty") router.replace("/waitlist");
      else router.replace("/dashboard");
    } else {
      setMessage("Not verified yet. Check your inbox.");
    }
    setChecking(false);
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
          Check your email
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          We sent a verification link to{" "}
          <span className="font-medium text-text-primary">{email}</span>
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <Button
          onClick={handleCheckNow}
          loading={checking}
          className="w-full h-11"
        >
          I&apos;ve verified my email
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

      <p className="text-center text-xs text-text-tertiary">
        Auto-detecting verification status...
      </p>
    </div>
  );
}
