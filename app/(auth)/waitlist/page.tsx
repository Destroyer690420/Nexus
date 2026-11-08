"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Stickie } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { onAuthChange, logout } from "@/lib/supabase-auth";

export default function WaitlistPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  useEffect(() => {
    let active = true;
    const unsub = onAuthChange(async (user) => {
      if (!user) {
        if (active) router.replace("/auth");
        return;
      }
      if (active) setEmail(user.email || "");
    });
    return () => {
      active = false;
      unsub();
    };
  }, [router]);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setupListener = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) return;

      channel = supabase
        .channel(`waitlist-${userId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "users",
            filter: `uid=eq.${userId}`,
          },
          (payload) => {
            if ((payload.new as { approved?: boolean })?.approved === true) {
              router.replace("/dashboard");
            }
          }
        )
        .subscribe();
    };

    setupListener();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [router]);

  const handleLogout = async () => {
    await logout();
    router.replace("/auth");
  };

  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-2">
        <Stickie mood="sleepy" size={120} />
      </div>

      <h1 className="font-display font-black text-2xl tracking-tight text-ink">
        Faculty approval pending
      </h1>

      <p className="mt-2 text-xs font-semibold text-ink-2 max-w-xs mx-auto leading-relaxed">
        An admin is reviewing your credentials. You will get access automatically once approved.
      </p>

      {email && (
        <div className="mt-3 px-3 py-1.5 rounded-[12px] bg-tangerine-tint border border-tangerine-deep/20 text-tangerine-deep font-mono text-xs font-bold">
          {email}
        </div>
      )}

      <div className="mt-6 flex items-center justify-center gap-2 text-xs font-bold text-ink-3">
        <div className="w-2.5 h-2.5 rounded-full bg-sun animate-ping" />
        <span>Waiting for admin approval...</span>
      </div>

      <div className="mt-6 w-full max-w-xs">
        <Button variant="ghost" size="md" fullWidth onClick={handleLogout}>
          Sign out
        </Button>
      </div>
    </div>
  );
}
