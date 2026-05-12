"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@/components/ui";
import {
  signUpWithEmail,
  signInWithGoogle,
  getUserData,
  getAuthErrorMessage,
} from "@/lib/auth";
import type { UserRole } from "@/types";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("student");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signUpWithEmail(email, password, role);
      router.replace("/auth/verify-email");
    } catch (err) {
      setError(getAuthErrorMessage(err));
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError("");
    try {
      const user = await signInWithGoogle();
      const data = await getUserData(user.uid);
      if (data) {
        if (data.role === "student") router.replace("/onboarding");
        else if (data.role === "faculty") router.replace("/waitlist");
        else router.replace("/dashboard");
      } else {
        router.replace("/auth/role");
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
          Create your account
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Choose how you&apos;ll use Academia OS
        </p>
      </div>

      <form onSubmit={handleEmailSignup} className="flex flex-col gap-4">
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
          placeholder="At least 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-primary">
            I am a
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setRole("student")}
              className={`rounded-md border px-4 py-3 text-sm font-medium transition-all duration-150 ease-out cursor-pointer ${
                role === "student"
                  ? "border-accent bg-accent-light text-accent"
                  : "border-border bg-white text-text-secondary hover:bg-surface"
              }`}
            >
              <div className="font-semibold">Student</div>
              <div className="text-xs mt-0.5 opacity-80">Access resources</div>
            </button>
            <button
              type="button"
              onClick={() => setRole("faculty")}
              className={`rounded-md border px-4 py-3 text-sm font-medium transition-all duration-150 ease-out cursor-pointer ${
                role === "faculty"
                  ? "border-accent bg-accent-light text-accent"
                  : "border-border bg-white text-text-secondary hover:bg-surface"
              }`}
            >
              <div className="font-semibold">Faculty</div>
              <div className="text-xs mt-0.5 opacity-80">Upload & manage</div>
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" loading={loading} className="w-full h-11">
          Create account
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
        Already have an account?{" "}
        <button
          onClick={() => router.push("/auth/login")}
          className="text-accent hover:underline cursor-pointer font-medium"
        >
          Sign in
        </button>
      </p>
    </div>
  );
}
