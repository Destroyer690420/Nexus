"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthChange } from "@/lib/supabase-auth";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthChange((user) => {
      if (!user) return;
      router.replace("/auth/role");
    });
    return unsub;
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="animate-spin h-6 w-6 border-2 border-text-tertiary border-t-accent rounded-full" />
    </div>
  );
}
