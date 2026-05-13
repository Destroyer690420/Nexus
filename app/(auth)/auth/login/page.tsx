"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@/components/ui";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  loginWithEmail,
  signInWithGoogle,
  getAuthErrorMessage,
} from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const { user, userData, loading: authLoading } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user && userData) {
      if (userData.role === "student") router.replace("/onboarding");
      else if (userData.role === "faculty") router.replace("/waitlist");
      else router.replace("/dashboard");
    } else if (!authLoading && user && !userData) {
      router.replace("/auth/role");
    }
  }, [user, userData, authLoading, router]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    setLoading(true);
    setError("");
    
    try {
      const loggedUser = await loginWithEmail(email, password);
      if (!loggedUser.emailVerified) {
        router.replace("/auth/verify-email");
        return;
      }
      // AuthProvider and useEffect will handle redirection to correct dashboard
    } catch (err: any) {
      console.error("Login failed:", err);
      setError(getAuthErrorMessage(err));
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    if (loading) return;
    
    setLoading(true);
    setError("");
    
    try {
      await signInWithGoogle();
      // AuthProvider handles the state, useEffect handles redirect
    } catch (err: any) {
      console.error("Google login failed:", err);
      setError(getAuthErrorMessage(err));
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-text-primary">
          Welcome Back
        </h1>
        <p className="mt-2 text-sm text-text-secondary">
          Pick up where you left off
        </p>
      </div>

      <form onSubmit={handleEmailLogin} className="flex flex-col gap-5">
        <Input
          label="Email Address"
          type="email"
          placeholder="you@college.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <div className="flex flex-col gap-1">
          <Input
            label="Password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          <div className="flex justify-end px-1">
            <button
              type="button"
              className="text-xs font-medium text-accent hover:underline"
              onClick={() => router.push("/auth/forgot-password")}
            >
              Forgot password?
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-destructive/10 p-3 text-xs font-medium text-destructive animate-in fade-in slide-in-from-top-1">
            {error}
          </div>
        )}

        <Button 
          type="submit" 
          loading={loading} 
          className="w-full h-12 text-sm font-bold shadow-lg shadow-accent/20 hover:shadow-accent/40 transition-shadow"
        >
          Sign In
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-background px-4 font-medium text-text-tertiary">Quick access</span>
        </div>
      </div>

      <Button
        onClick={handleGoogle}
        disabled={loading}
        variant="secondary"
        className="w-full h-12 text-sm font-semibold border-2 hover:bg-surface transition-colors gap-3"
      >
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Continue with Google
      </Button>

      <p className="text-center text-sm text-text-secondary">
        New to Academia OS?{" "}
        <button
          onClick={() => router.push("/auth/signup")}
          className="text-accent hover:text-accent-dark transition-colors font-bold"
        >
          Create account
        </button>
      </p>
    </div>
  );
}
