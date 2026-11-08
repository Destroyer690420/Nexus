"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthChange } from "@/lib/supabase-auth";
import { getAuthRedirectTarget } from "@/lib/auth-redirect";
import { Stickie } from "@/components/ui";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    let active = true;
    const unsub = onAuthChange(async (user) => {
      if (!user || !active) return;
      const target = await getAuthRedirectTarget(user.id);
      if (active) router.replace(target);
    });
    return () => {
      active = false;
      unsub();
    };
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center py-10 text-center gap-3 animate-pulse">
      <Stickie mood="think" size={90} />
      <h2 className="font-display font-extrabold text-base text-ink">
        Taking you in...
      </h2>
      <p className="text-xs font-semibold text-ink-3">
        Connecting with campus servers.
      </p>
    </div>
  );
}
