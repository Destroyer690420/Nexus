"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { onAuthChange, getUserData, logout } from "@/lib/supabase-auth";
import { SearchBar } from "@/components/ui/SearchBar";
import { supabase } from "@/lib/supabase";
import type { UserData, StudentProfile } from "@/types";

const NAV_ICONS: Record<string, React.ReactNode> = {
  Home: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  Notes: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>,
  PYQs: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>,
  Assignments: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="6" height="6" rx="1"/><path d="m3 17 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/></svg>,
  "Lab Manuals": <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2"/><path d="M8.5 2h7"/><path d="M7 16h10"/></svg>,
  Contribute: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  "My Contributions": <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>,
  Announcements: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 11 18-5v12L3 13v-2z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>,
  Upload: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  "Create Assignment": <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>,
  Submissions: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>,
  Profile: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  "Admin Panel": <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>,
  Search: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>,
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const isStudent = userData?.role === "student";

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

      if (data.role === "student") {
        const { data: profile } = await supabase
          .from("student_profiles")
          .select("*")
          .eq("uid", user.id)
          .single();
        if (profile) {
          setStudentProfile(profile as unknown as StudentProfile);
        }
      }

      if (data.role === "faculty" && !data.approved) {
        if (pathname !== "/waitlist") {
          router.replace("/waitlist");
        }
      }
      setLoading(false);
    });
    return unsub;
  }, [router, pathname]);

  // Close mobile drawer when navigating
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await logout();
    router.replace("/auth");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 animate-fade-in">
          <div className="animate-spin h-7 w-7 border-[2.5px] border-border border-t-accent rounded-full" />
          <p className="text-sm text-text-tertiary">Loading...</p>
        </div>
      </div>
    );
  }

  const navItems = buildNavItems(userData);

  return (
    <div className="flex min-h-screen bg-background">
      {/* ── DESKTOP SIDEBAR (left, retractable) ── */}
      <aside
        className={`hidden lg:flex fixed top-0 left-0 bottom-0 flex-col bg-sidebar-bg border-r border-border z-50 transition-all duration-300 ease-out ${
          sidebarCollapsed ? "w-[68px]" : "w-64"
        }`}
      >
        {/* Logo + collapse toggle */}
        <div className="p-4 pb-3 flex items-center justify-between">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-[var(--radius-md)] bg-accent flex items-center justify-center shadow-sm shadow-accent/25">
                <span className="text-white text-sm font-bold">N</span>
              </div>
              <h2 className="text-base font-semibold text-text-primary tracking-tight">
                Nexus
              </h2>
            </div>
          )}
          {sidebarCollapsed && (
            <div className="h-8 w-8 rounded-[var(--radius-md)] bg-accent flex items-center justify-center shadow-sm shadow-accent/25 mx-auto">
              <span className="text-white text-sm font-bold">N</span>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`p-1.5 rounded-[var(--radius-sm)] text-text-tertiary hover:text-text-primary hover:bg-surface-hover transition-all duration-200 cursor-pointer ${sidebarCollapsed ? "mx-auto mt-2" : ""}`}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {sidebarCollapsed ? (
                <><path d="m9 18 6-6-6-6"/></>
              ) : (
                <><path d="m15 18-6-6 6-6"/></>
              )}
            </svg>
          </button>
        </div>

        {/* Search (hidden when collapsed) */}
        {!sidebarCollapsed && (
          <div className="px-4 pb-3">
            <SearchBar />
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-0.5">
          {navItems.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              active={item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href)}
              label={item.label}
              icon={NAV_ICONS[item.label]}
              collapsed={sidebarCollapsed}
            />
          ))}
        </nav>

        {/* Bottom section */}
        <div className="border-t border-border p-3 flex flex-col gap-1">
          <button
            onClick={handleLogout}
            className={`flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] text-xs font-medium text-text-secondary hover:text-destructive hover:bg-destructive/5 transition-all duration-200 w-full cursor-pointer ${sidebarCollapsed ? "justify-center" : ""}`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            {!sidebarCollapsed && <span>Sign out</span>}
          </button>
          {!sidebarCollapsed && userData && (
            <div className="px-3 py-2 mt-1 rounded-[var(--radius-md)] bg-surface-hover/50">
              <p className="text-xs font-medium text-text-primary truncate">{userData.name || userData.email}</p>
              <p className="text-[10px] text-text-tertiary capitalize">{userData.role}</p>
            </div>
          )}
        </div>
      </aside>

      {/* ── MOBILE: Right-side drawer overlay ── */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-overlay backdrop-blur-sm z-40 animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── MOBILE: Right-side drawer ── */}
      <aside
        className={`lg:hidden fixed top-0 right-0 bottom-0 w-[280px] bg-sidebar-bg border-l border-border flex flex-col z-50 transition-transform duration-300 ease-out ${
          sidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Close button */}
        <div className="p-5 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-[var(--radius-md)] bg-accent flex items-center justify-center shadow-sm shadow-accent/25">
              <span className="text-white text-sm font-bold">N</span>
            </div>
            <h2 className="text-base font-semibold text-text-primary tracking-tight">
              Nexus
            </h2>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-[var(--radius-sm)] text-text-tertiary hover:text-text-primary hover:bg-surface-hover transition-all duration-200 cursor-pointer"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-0.5">
          {navItems.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              active={item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href)}
              label={item.label}
              icon={NAV_ICONS[item.label]}
            />
          ))}
        </nav>

        {/* Logout at bottom */}
        <div className="border-t border-border p-3 flex flex-col gap-1">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] text-xs font-medium text-destructive hover:bg-destructive/5 transition-all duration-200 w-full cursor-pointer"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            <span>Logout →</span>
          </button>
          {userData && (
            <div className="px-3 py-2 mt-1 rounded-[var(--radius-md)] bg-surface-hover/50">
              <p className="text-xs font-medium text-text-primary truncate">{userData.name || userData.email}</p>
              <p className="text-[10px] text-text-tertiary capitalize">{userData.role}</p>
            </div>
          )}
        </div>
      </aside>

      {/* ── Main content area ── */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${sidebarCollapsed ? "lg:ml-[68px]" : "lg:ml-64"}`}>
        {/* Mobile top header */}
        <header className="lg:hidden sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-[var(--radius-sm)] bg-accent flex items-center justify-center">
              <span className="text-white text-xs font-bold">N</span>
            </div>
            <span className="text-sm font-semibold text-text-primary">Nexus</span>
          </div>
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-[var(--radius-md)] text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-all duration-200 cursor-pointer flex-shrink-0"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8 max-w-6xl w-full mx-auto pb-20 lg:pb-0 animate-fade-in">
          {children}
        </main>

        {/* Mobile bottom navigation */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-background/90 backdrop-blur-lg border-t border-border">
          <div className="flex items-center justify-around py-2">
            <BottomNavItem
              href="/dashboard"
              label="Home"
              icon={NAV_ICONS["Home"]}
              active={pathname === "/dashboard"}
            />
            <BottomNavItem
              href="/dashboard/announcements"
              label="Announcements"
              icon={NAV_ICONS["Announcements"]}
              active={pathname.startsWith("/dashboard/announcements")}
            />
            {isStudent && (
              <BottomNavItem
                href="/dashboard/contribute"
                label="Contribute"
                icon={NAV_ICONS["Contribute"]}
                active={pathname.startsWith("/dashboard/contribute")}
              />
            )}
            <BottomNavItem
              href="/dashboard/profile"
              label="Profile"
              icon={NAV_ICONS["Profile"]}
              active={pathname.startsWith("/dashboard/profile")}
            />
          </div>
        </nav>
      </div>
    </div>
  );
}

function buildNavItems(userData: UserData | null) {
  const items: { href: string; label: string }[] = [
    { href: "/dashboard", label: "Home" },
  ];

  const isStudent = userData?.role === "student";

  if (!isStudent) {
    // Faculty/admin see resource pages in sidebar
    items.push(
      { href: "/dashboard/notes", label: "Notes" },
      { href: "/dashboard/pyqs", label: "PYQs" },
      { href: "/dashboard/assignments", label: "Assignments" },
      { href: "/dashboard/lab-manuals", label: "Lab Manuals" },
    );
  }

  items.push({ href: "/dashboard/announcements", label: "Announcements" });

  // Student: contribute resources (goes through approval)
  if (isStudent) {
    items.push(
      { href: "/dashboard/contribute", label: "Contribute" },
      { href: "/dashboard/my-contributions", label: "My Contributions" },
    );
  }

  // Faculty/admin: upload and manage
  if (!isStudent) {
    items.push(
      { href: "/dashboard/upload", label: "Upload" },
      { href: "/dashboard/assignments/create", label: "Create Assignment" },
      { href: "/dashboard/submissions", label: "Submissions" },
    );
  }

  items.push({ href: "/dashboard/profile", label: "Profile" });

  if (userData?.role === "admin") {
    items.push({ href: "/dashboard/admin", label: "Admin Panel" });
  }

  return items;
}


function NavItem({
  href,
  active,
  label,
  icon,
  collapsed,
}: {
  href: string;
  active: boolean;
  label: string;
  icon?: React.ReactNode;
  collapsed?: boolean;
}) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push(href)}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-[var(--radius-md)] text-[13px] transition-all duration-200 ease-out cursor-pointer group ${
        collapsed ? "justify-center" : ""
      } ${
        active
          ? "bg-accent-light text-accent font-medium shadow-sm shadow-accent-glow"
          : "text-text-secondary hover:bg-sidebar-hover hover:text-text-primary"
      }`}
      title={collapsed ? label : undefined}
    >
      <span className={`flex-shrink-0 transition-transform duration-200 ${active ? "" : "group-hover:scale-105"}`}>
        {icon}
      </span>
      {!collapsed && <span className="truncate">{label}</span>}
    </button>
  );
}

function BottomNavItem({
  href,
  label,
  icon,
  active,
}: {
  href: string;
  label: string;
  icon?: React.ReactNode;
  active: boolean;
}) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push(href)}
      className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-[var(--radius-sm)] transition-all duration-200 cursor-pointer min-w-0 ${
        active
          ? "text-accent"
          : "text-text-tertiary hover:text-text-secondary"
      }`}
    >
      <span className={`flex-shrink-0 transition-transform duration-200 ${active ? "scale-110" : ""}`}>
        {icon}
      </span>
      <span className="text-[10px] font-medium truncate">{label}</span>
    </button>
  );
}
