"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@/components/ui";
import {
  loginWithEmail,
  signInWithGoogle,
  getUserData,
  getAuthErrorMessage,
  onAuthChange,
} from "@/lib/supabase-auth";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const redirectUser = async (userId: string) => {
    const data = await getUserData(userId);
    if (!data) return router.replace("/auth/role");
    if (data.role === "student") {
      const { data: profile } = await supabase
        .from("student_profiles")
        .select("uid")
        .eq("uid", userId)
        .single();
      if (profile) router.replace("/dashboard");
      else router.replace("/onboarding");
    } else if (data.role === "faculty") {
      if (data.approved) router.replace("/dashboard");
      else router.replace("/waitlist");
    } else {
      router.replace("/dashboard");
    }
  };

  useEffect(() => {
    let active = true;
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user ?? null;
      if (!user || !active) return;
      await redirectUser(user.id);
    };
    checkSession();
    const unsub = onAuthChange(async (user) => {
      if (!user || !active) return;
      await redirectUser(user.id);
    });
    return () => {
      active = false;
      unsub();
    };
  }, [router]);


  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const user = await loginWithEmail(email, password);
      if (!user.email_confirmed_at) {
        router.replace("/auth/verify-email");
        return;
      }
      await redirectUser(user.id);
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

  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
          Welcome back
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Sign in to your account
        </p>
      </div>

      <form onSubmit={handleEmailLogin} className="flex flex-col gap-4">
        <Input
          label="Email"
          type="email"
          placeholder="you@college.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" loading={loading} className="w-full h-11">
          Sign in
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-text-tertiary">or</span>
        </div>
      </div>

      <Button
        onClick={handleGoogle}
        loading={loading}
        variant="secondary"
        className="w-full h-11"
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

      <p className="text-center text-sm text-text-secondary">
        Don&apos;t have an account?{" "}
        <button
          onClick={() => router.push("/auth/signup")}
          className="text-accent hover:underline cursor-pointer font-medium"
        >
          Sign up
        </button>
      </p>
    </div>
  );
}
