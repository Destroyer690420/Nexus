"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button, Stickie } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { onAuthChange, getAuthErrorMessage } from "@/lib/supabase-auth";
import { getAuthRedirectTarget } from "@/lib/auth-redirect";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  // Countdown timer for resend
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    let active = true;
    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const user = session?.user ?? null;
        if (!user || !user.email_confirmed_at) {
          if (active) setCheckingSession(false);
          return;
        }

        const target = await getAuthRedirectTarget(user.id);
        if (active) router.replace(target);
      } catch {
        if (active) setCheckingSession(false);
      }
    };
    checkSession();

    const unsub = onAuthChange(async (user) => {
      if (!user || !active) return;
      if (user.email_confirmed_at) {
        const target = await getAuthRedirectTarget(user.id);
        if (active) router.replace(target);
      }
    });
    return () => {
      active = false;
      unsub();
    };
  }, [router]);

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setMessage("");
    setIsError(false);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      });
      if (error) throw error;
      setMessage("Verification email resent! Check your inbox.");
      setCooldown(60);
    } catch (err) {
      setIsError(true);
      setMessage(getAuthErrorMessage(err));
    }
    setResending(false);
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
    <div className="flex flex-col items-center text-center">
      <div className="mb-2">
        <Stickie mood="mail" size={120} />
      </div>

      <h1 className="font-display font-black text-2xl tracking-tight text-ink">
        Check your inbox
      </h1>

      <p className="mt-2 text-xs font-semibold text-ink-2 max-w-[300px]">
        We sent a confirmation link to enter campus:
      </p>

      {email && (
        <div className="mt-2.5 px-3.5 py-1.5 rounded-[12px] bg-berry-tint border border-berry/20 text-berry font-mono text-xs font-bold break-all">
          {email}
        </div>
      )}

      {message && (
        <div
          role={isError ? "alert" : "status"}
          className={`mt-4 w-full p-3 rounded-[16px] text-xs font-semibold ${
            isError
              ? "bg-crimson-tint border-2 border-crimson/20 text-crimson-deep"
              : "bg-fern-tint border-2 border-fern/20 text-fern-deep"
          }`}
        >
          {message}
        </div>
      )}

      <div className="mt-6 w-full flex flex-col gap-2.5">
        <Button
          onClick={handleResend}
          disabled={cooldown > 0 || !email}
          loading={resending}
          variant="secondary"
          size="md"
          fullWidth
        >
          {cooldown > 0 ? `Resend email (${cooldown}s)` : "Resend email"}
        </Button>

        <Link href="/auth/login" className="block w-full">
          <Button variant="ghost" size="md" fullWidth>
            Back to sign in
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Stickie mood="think" size={80} />
          <p className="font-display font-extrabold text-sm text-ink-3">
            Loading...
          </p>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
