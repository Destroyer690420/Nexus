"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  House,
  Books,
  FileText,
  Flask,
  PlusCircle,
  Megaphone,
  UploadSimple,
  User,
  ShieldCheck,
  SignOut,
  Folder,
  MagnifyingGlass,
} from "@phosphor-icons/react";
import { onAuthChange, getUserData, logout } from "@/lib/supabase-auth";
import { Avatar, Chip, TabBar, TabBarItem, Stickie } from "@/components/ui";
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
          return;
        }
      }
      setLoading(false);
    });
    return unsub;
  }, [router, pathname]);

  const handleLogout = async () => {
    await logout();
    router.replace("/auth");
  };

  const isStudent = userData?.role === "student";
  const isAdmin = userData?.role === "admin";
  const isFaculty = userData?.role === "faculty";

  // Mobile bottom tab bar items
  const tabItems: TabBarItem[] = useMemo(() => {
    const items: TabBarItem[] = [
      {
        href: "/dashboard",
        label: "Home",
        icon: (active) => (
          <House size={24} weight={active ? "fill" : "bold"} />
        ),
      },
      {
        href: "/dashboard/notes",
        label: "Browse",
        icon: (active) => (
          <Books size={24} weight={active ? "fill" : "bold"} />
        ),
      },
      {
        href: isStudent ? "/dashboard/contribute" : "/dashboard/upload",
        label: isStudent ? "Contribute" : "Upload",
        icon: (active) =>
          isStudent ? (
            <PlusCircle size={24} weight={active ? "fill" : "bold"} />
          ) : (
            <UploadSimple size={24} weight={active ? "fill" : "bold"} />
          ),
      },
      {
        href: "/dashboard/search",
        label: "Search",
        icon: (active) => (
          <MagnifyingGlass size={24} weight={active ? "fill" : "bold"} />
        ),
      },
      {
        href: "/dashboard/profile",
        label: "Profile",
        icon: (active) => (
          <User size={24} weight={active ? "fill" : "bold"} />
        ),
      },
    ];
    return items;
  }, [isStudent]);

  // Desktop sidebar navigation items
  const sidebarNavItems = useMemo(() => {
    const items = [
      {
        href: "/dashboard",
        label: "Home",
        icon: (active: boolean) => (
          <House size={20} weight={active ? "fill" : "bold"} />
        ),
      },
      {
        href: "/dashboard/notes",
        label: "Notes",
        icon: (active: boolean) => (
          <Books size={20} weight={active ? "fill" : "bold"} />
        ),
      },
      {
        href: "/dashboard/pyqs",
        label: "PYQs",
        icon: (active: boolean) => (
          <FileText size={20} weight={active ? "fill" : "bold"} />
        ),
      },
      {
        href: "/dashboard/assignments",
        label: "Assignments",
        icon: (active: boolean) => (
          <Folder size={20} weight={active ? "fill" : "bold"} />
        ),
      },
      {
        href: "/dashboard/lab-manuals",
        label: "Lab Manuals",
        icon: (active: boolean) => (
          <Flask size={20} weight={active ? "fill" : "bold"} />
        ),
      },
      {
        href: "/dashboard/announcements",
        label: "Announcements",
        icon: (active: boolean) => (
          <Megaphone size={20} weight={active ? "fill" : "bold"} />
        ),
      },
    ];

    if (isStudent) {
      items.push(
        {
          href: "/dashboard/contribute",
          label: "Contribute",
          icon: (active: boolean) => (
            <PlusCircle size={20} weight={active ? "fill" : "bold"} />
          ),
        },
        {
          href: "/dashboard/my-contributions",
          label: "My Contributions",
          icon: (active: boolean) => (
            <FileText size={20} weight={active ? "fill" : "bold"} />
          ),
        }
      );
    } else {
      items.push({
        href: "/dashboard/upload",
        label: "Upload Material",
        icon: (active: boolean) => (
          <UploadSimple size={20} weight={active ? "fill" : "bold"} />
        ),
      });
    }

    if (isAdmin) {
      items.push({
        href: "/dashboard/admin",
        label: "Admin Panel",
        icon: (active: boolean) => (
          <ShieldCheck size={20} weight={active ? "fill" : "bold"} />
        ),
      });
    }

    items.push({
      href: "/dashboard/search",
      label: "Search",
      icon: (active: boolean) => (
        <MagnifyingGlass size={20} weight={active ? "fill" : "bold"} />
      ),
    });

    items.push({
      href: "/dashboard/profile",
      label: "Profile",
      icon: (active: boolean) => (
        <User size={20} weight={active ? "fill" : "bold"} />
      ),
    });

    return items;
  }, [isStudent, isAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6 text-center">
        <div className="flex flex-col items-center gap-3 animate-pulse">
          <Stickie mood="think" size={90} />
          <p className="font-display font-extrabold text-sm text-ink-3">
            Loading your campus...
          </p>
        </div>
      </div>
    );
  }

  const roleBadgeVariant: "neutral" | "tangerine" | "berry" = isAdmin
    ? "berry"
    : isFaculty
    ? "tangerine"
    : "neutral";

  const roleLabel = isAdmin ? "Admin" : isFaculty ? "Faculty" : "Student";

  return (
    <div className="min-h-screen bg-bg flex flex-col md:flex-row text-ink">
      {/* ── DESKTOP SIDEBAR (>=768px) ── */}
      <aside
        aria-label="Desktop Navigation"
        className="hidden md:flex flex-col w-64 flex-shrink-0 h-screen sticky top-0 border-r-2 border-line bg-surface/85 backdrop-blur-[20px] p-4 select-none"
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-3 py-3 mb-2">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-[12px] bg-berry text-white flex items-center justify-center font-display font-black text-xl shadow-[0_3px_0_var(--color-berry-deep)] group-active:translate-y-[1px] transition-transform">
              N
            </div>
            <div>
              <span className="font-display font-black text-xl text-ink tracking-tight block">
                Nexus
              </span>
              <span className="text-[10px] font-extrabold text-ink-3 uppercase tracking-wider block -mt-0.5">
                Campus Library
              </span>
            </div>
          </Link>

          <Chip variant={roleBadgeVariant} className="text-[11px] font-black uppercase tracking-wider">
            {roleLabel}
          </Chip>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 space-y-1 overflow-y-auto pr-1 py-2">
          {sidebarNavItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-[16px] font-display font-extrabold text-[14px] transition-all duration-150 ${
                  isActive
                    ? "bg-berry-tint text-berry-deep shadow-[0_2px_0_var(--line-strong)]"
                    : "text-ink-2 hover:bg-surface-sunken hover:text-ink"
                }`}
              >
                <div
                  className={`shrink-0 ${
                    isActive ? "text-berry" : "text-ink-3"
                  }`}
                >
                  {item.icon(isActive)}
                </div>
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Footer with profile and logout */}
        <div className="pt-3 border-t-2 border-line mt-auto flex items-center justify-between gap-2">
          <Link
            href="/dashboard/profile"
            className="flex items-center gap-2.5 min-w-0 p-1.5 rounded-[14px] hover:bg-surface-sunken transition-colors group flex-1"
          >
            <Avatar
              name={userData?.name || "Campus User"}
              src={userData?.avatarUrl}
              size="sm"
            />
            <div className="min-w-0 flex-1">
              <p className="font-display font-extrabold text-xs text-ink truncate group-hover:text-berry transition-colors">
                {userData?.name || "User"}
              </p>
              <p className="text-[11px] font-semibold text-ink-3 truncate">
                {userData?.email}
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="w-9 h-9 rounded-[10px] flex items-center justify-center text-ink-3 hover:text-crimson hover:bg-crimson-tint transition-colors shrink-0"
            title="Sign out"
            aria-label="Sign out"
          >
            <SignOut size={18} weight="bold" />
          </button>
        </div>
      </aside>

      {/* ── MOBILE TOP BAR (<768px) ── */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between h-14 px-4 glass-bar border-b border-line">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-[10px] bg-berry text-white flex items-center justify-center font-display font-black text-base shadow-[0_2px_0_var(--color-berry-deep)]">
            N
          </div>
          <span className="font-display font-black text-lg text-ink tracking-tight">
            Nexus
          </span>
        </Link>

        <div className="flex items-center gap-2.5">
          <Chip variant={roleBadgeVariant} className="text-[10px] font-black uppercase tracking-wider py-0.5 px-2">
            {roleLabel}
          </Chip>
          <Link href="/dashboard/profile" aria-label="Go to profile">
            <Avatar
              name={userData?.name || "User"}
              src={userData?.avatarUrl}
              size="sm"
            />
          </Link>
        </div>
      </header>

      {/* ── MAIN CONTENT AREA ── */}
      <main className="flex-1 min-w-0 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-8">
        {children}
      </main>

      {/* ── MOBILE BOTTOM TAB BAR (<768px) ── */}
      <TabBar items={tabItems} />
    </div>
  );
}
