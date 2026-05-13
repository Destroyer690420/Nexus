"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthChange, getUserData } from "@/lib/supabase-auth";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthChange(async (user) => {
      if (!user) return;
      const data = await getUserData(user.id);
      if (!data) router.replace("/auth/role");
      else if (data.role === "student") router.replace("/onboarding");
      else if (data.role === "faculty") router.replace("/waitlist");
      else router.replace("/dashboard");
    });
    return unsub;
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="animate-spin h-6 w-6 border-2 border-text-tertiary border-t-accent rounded-full" />
    </div>
  );
}
