"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { onAuthChange, getUserData } from "@/lib/supabase-auth";
import type { UserData } from "@/types";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthChange(async (user) => {
      if (!user) {
        router.replace("/auth");
        return;
      }
      const data = await getUserData(user.id);
      if (!data) {
        router.replace("/auth");
        return;
      }
      setUserData(data);

      if (data.role === "faculty" && !data.approved) {
        if (pathname !== "/waitlist") {
          router.replace("/waitlist");
        }
      }
      setLoading(false);
    });
    return unsub;
  }, [router, pathname]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin h-6 w-6 border-2 border-text-tertiary border-t-accent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-60 border-r border-border bg-white flex-shrink-0">
        <div className="p-5 border-b border-border">
          <h2 className="text-base font-semibold text-text-primary tracking-tight">
            Academia OS
          </h2>
        </div>
        <nav className="p-3 flex flex-col gap-1">
          <NavItem
            href="/dashboard"
            active={pathname === "/dashboard"}
            label="Home"
          />
          <NavItem
            href="/dashboard/profile"
            active={pathname.startsWith("/dashboard/profile")}
            label="Profile"
          />
          {userData?.role === "admin" && (
            <NavItem
              href="/dashboard/admin"
              active={pathname.startsWith("/dashboard/admin")}
              label="Admin Panel"
            />
          )}
        </nav>
      </aside>
      <main className="flex-1 bg-background p-8">{children}</main>
    </div>
  );
}

function NavItem({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push(href)}
      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-all duration-150 ease-out cursor-pointer ${
        active
          ? "bg-accent-light text-accent font-medium"
          : "text-text-secondary hover:bg-surface"
      }`}
    >
      {label}
    </button>
  );
}
