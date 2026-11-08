"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Eye, EyeSlash, Info } from "@phosphor-icons/react";
import { Button, TextField, SegmentedControl, Stickie } from "@/components/ui";
import {
  signUpWithEmail,
  signInWithGoogle,
  getAuthErrorMessage,
  onAuthChange,
} from "@/lib/supabase-auth";
import { getAuthRedirectTarget } from "@/lib/auth-redirect";
import { supabase } from "@/lib/supabase";
import type { UserRole } from "@/types";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>("student");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let active = true;
    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const user = session?.user ?? null;
        if (!user) {
          if (active) setCheckingSession(false);
          return;
        }
        if (!active) return;
        const target = await getAuthRedirectTarget(user.id);
        if (active) router.replace(target);
      } catch {
        if (active) setCheckingSession(false);
      }
    };
    checkSession();
    const unsub = onAuthChange(async (user) => {
      if (!user) {
        if (active) setCheckingSession(false);
        return;
      }
      if (!active) return;
      const target = await getAuthRedirectTarget(user.id);
      if (active) router.replace(target);
    });
    return () => {
      active = false;
      unsub();
    };
  }, [router]);

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signUpWithEmail(email, password, role, name);
      router.replace(`/auth/verify-email?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError(getAuthErrorMessage(err));
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError("");
    try {
      await signInWithGoogle();
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
      <div className="flex items-center justify-between mb-4">
        <Link
          href="/auth"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-2 hover:text-ink transition-colors -ml-1 p-2 rounded-lg"
          aria-label="Back to welcome"
        >
          <ArrowLeft size={16} weight="bold" />
          <span>Back</span>
        </Link>
      </div>

      <div className="flex flex-col items-center text-center mb-5">
        <Stickie mood="wave" size={64} />
        <h1 className="mt-2 font-display font-black text-2xl tracking-tight text-ink">
          Join Nexus
        </h1>
        <p className="mt-1 text-xs font-semibold text-ink-2">
          Start exploring study materials or contribute resources.
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

      {/* Role selection SegmentedControl */}
      <div className="mb-4">
        <label className="block text-[13px] font-display font-extrabold text-ink mb-1.5">
          I am a:
        </label>
        <SegmentedControl
          options={[
            { value: "student", label: "Student" },
            { value: "faculty", label: "Faculty" },
          ]}
          value={role}
          onChange={(val) => setRole(val as UserRole)}
        />
        {role === "faculty" && (
          <div className="mt-2 flex items-start gap-1.5 text-xs font-medium text-tangerine-deep bg-tangerine-tint p-2.5 rounded-[12px] border border-tangerine-deep/20">
            <Info size={16} weight="bold" className="shrink-0 mt-0.5" />
            <span>
              Faculty accounts require admin approval before uploading materials.
            </span>
          </div>
        )}
      </div>

      <form onSubmit={handleEmailSignup} className="flex flex-col gap-3.5">
        <TextField
          label="Full name"
          type="text"
          placeholder="e.g. Gaurav Sharma"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoComplete="name"
        />

        <TextField
          label="College email"
          type="email"
          placeholder="you@college.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />

        <TextField
          label="Password"
          type={showPassword ? "text" : "password"}
          placeholder="At least 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          autoComplete="new-password"
          trailing={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="w-10 h-10 flex items-center justify-center text-ink-3 hover:text-ink transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeSlash size={20} weight="bold" />
              ) : (
                <Eye size={20} weight="bold" />
              )}
            </button>
          }
        />

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
          >
            Create account
          </Button>
        </div>
      </form>

      <div className="relative my-4 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-line" />
        </div>
        <span className="relative bg-surface px-3 text-[11px] font-bold text-ink-3 uppercase tracking-wider">
          or
        </span>
      </div>

      <Button
        onClick={handleGoogle}
        loading={loading}
        variant="secondary"
        size="md"
        fullWidth
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          className="shrink-0"
          aria-hidden="true"
        >
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

      <div className="mt-5 text-center">
        <Link
          href="/auth/login"
          className="text-xs font-bold text-ink-2 hover:text-berry transition-colors"
        >
          Already have an account? <span className="text-berry underline">Sign in</span>
        </Link>
      </div>
    </div>
  );
}
