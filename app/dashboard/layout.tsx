"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { onAuthChange, getUserData } from "@/lib/supabase-auth";
import { SearchBar } from "@/components/ui/SearchBar";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
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
      <aside className="w-60 border-r border-border bg-surface flex-shrink-0">
        <div className="p-5 border-b border-border">
          <h2 className="text-base font-semibold text-text-primary tracking-tight">
            Academia OS
          </h2>
          <div className="mt-3">
            <SearchBar />
          </div>
          <div className="mt-2">
            <ThemeToggle />
          </div>
        </div>
        <nav className="p-3 flex flex-col gap-1">
          <NavItem
            href="/dashboard"
            active={pathname === "/dashboard"}
            label="Home"
          />
          {userData?.role === "student" && (
            <>
              <NavItem href="/dashboard/notes" active={pathname.startsWith("/dashboard/notes")} label="Notes" />
              <NavItem href="/dashboard/pyqs" active={pathname.startsWith("/dashboard/pyqs")} label="PYQs" />
              <NavItem href="/dashboard/assignments" active={pathname.startsWith("/dashboard/assignments")} label="Assignments" />
              <NavItem href="/dashboard/lab-manuals" active={pathname.startsWith("/dashboard/lab-manuals")} label="Lab Manuals" />
              <NavItem href="/dashboard/contribute" active={pathname.startsWith("/dashboard/contribute")} label="Contribute" />
              <NavItem href="/dashboard/my-contributions" active={pathname.startsWith("/dashboard/my-contributions")} label="My Contributions" />
            </>
          )}
          <NavItem href="/dashboard/announcements" active={pathname.startsWith("/dashboard/announcements")} label="Announcements" />
          {userData?.role !== "student" && (
            <>
              <NavItem
                href="/dashboard/upload"
                active={pathname.startsWith("/dashboard/upload")}
                label="Upload"
              />
              <NavItem
                href="/dashboard/assignments/create"
                active={pathname.startsWith("/dashboard/assignments/create")}
                label="Create Assignment"
              />
              <NavItem
                href="/dashboard/submissions"
                active={pathname.startsWith("/dashboard/submissions")}
                label="Submissions"
              />
            </>
          )}
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
