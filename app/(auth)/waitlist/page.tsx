"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { onAuthChange, logout } from "@/lib/supabase-auth";

export default function WaitlistPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  useEffect(() => {
    const unsub = onAuthChange(async (user) => {
      if (!user) {
        router.replace("/auth");
        return;
      }
      setEmail(user.email || "");
    });
    return unsub;
  }, [router]);

  useEffect(() => {
    const channel = supabase
      .channel("waitlist")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "users",
          filter: `uid=eq.${supabase.auth.getSession().then(({ data }) => data.session?.user?.id)}`,
        },
        (payload) => {
          if ((payload.new as { approved?: boolean })?.approved === true) {
            router.replace("/dashboard");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  const handleLogout = async () => {
    await logout();
    router.replace("/auth");
  };

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent-light">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-accent"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      </div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
          Pending Approval
        </h1>
        <p className="mt-2 text-sm text-text-secondary max-w-xs mx-auto">
          Your account is pending admin approval for{" "}
          <span className="font-medium text-text-primary">{email}</span>.
          You&apos;ll be redirected automatically once approved.
        </p>
      </div>

      <div className="flex items-center gap-2 text-xs text-text-tertiary">
        <div className="animate-spin h-3 w-3 border-2 border-text-tertiary border-t-accent rounded-full" />
        Waiting for approval...
      </div>

      <Button variant="ghost" onClick={handleLogout} className="mt-4">
        Sign out
      </Button>
    </div>
  );
}
