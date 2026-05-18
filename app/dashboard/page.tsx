"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { onAuthChange, getUserData } from "@/lib/supabase-auth";
import { getRecentAnnouncementsForStudent, getAnnouncements } from "@/lib/queries";
import { Card, Badge, PageHeader } from "@/components/ui";
import type { UserData, Announcement, StudentProfile } from "@/types";

export default function DashboardPage() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [recentAnnouncement, setRecentAnnouncement] = useState<Announcement | null>(null);

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
        if (!profile) {
          router.replace("/onboarding");
          return;
        }
        const p = profile as unknown as StudentProfile;
        const recent = await getRecentAnnouncementsForStudent(p.courseId, p.semesterId, 7);
        if (recent.length > 0) {
          setRecentAnnouncement(recent[0]);
        }
      } else {
        const ann = await getAnnouncements();
        setAnnouncements(ann.slice(0, 3));
      }
    });
    return unsub;
  }, [router]);

  if (!userData) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-6 w-6 border-2 border-text-tertiary border-t-accent rounded-full" />
      </div>
    );
  }

  const isStudent = userData.role === "student";
  const displayName = userData.name || userData.email.split("@")[0];

  // ── Student View ──
  if (isStudent) {
    return (
      <div className="max-w-lg mx-auto">
        {/* Greeting */}
        <div className="flex items-center gap-3 mb-1">
          <div className="h-9 w-9 rounded-[var(--radius-md)] bg-accent flex items-center justify-center">
            <span className="text-white text-sm font-bold">N</span>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
              Nexus
            </h1>
            <p className="text-sm text-text-secondary">Welcome back, {displayName} 👋</p>
          </div>
        </div>

        {/* Announcement Banner (only if there's a recent announcement) */}
        {recentAnnouncement && (
          <div className="mb-6 animate-slide-up" style={{ animationDelay: "0.05s" }}>
            <div className="relative rounded-[var(--radius-lg)] border border-accent/20 bg-accent/[0.04] p-4 overflow-hidden">
              {/* Decorative accent line */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-accent/60 via-accent to-accent/60" />
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent flex-shrink-0">
                      <path d="m3 11 18-5v12L3 13v-2z"/>
                      <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>
                    </svg>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-accent">Notice</span>
                  </div>
                  <p className="text-sm font-medium text-text-primary line-clamp-1">{recentAnnouncement.title}</p>
                  <p className="text-xs text-text-secondary mt-0.5 line-clamp-1">{recentAnnouncement.content}</p>
                </div>
                <button
                  onClick={() => router.push("/dashboard/announcements")}
                  className="text-xs font-medium text-accent hover:text-accent-hover whitespace-nowrap transition-colors cursor-pointer flex-shrink-0 mt-1"
                >
                  see all →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2×2 Tile Grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <HomeTile
            icon={
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
              </svg>
            }
            label="Notes"
            color="#4f6ef7"
            onClick={() => router.push("/dashboard/notes")}
          />
          <HomeTile
            icon={
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/>
                <path d="M14 2v6h6"/>
                <path d="M16 13H8"/>
                <path d="M16 17H8"/>
                <path d="M10 9H8"/>
              </svg>
            }
            label="PYQ"
            color="#10b981"
            onClick={() => router.push("/dashboard/pyqs")}
          />
          <HomeTile
            icon={
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="5" width="6" height="6" rx="1"/>
                <path d="m3 17 2 2 4-4"/>
                <path d="M13 6h8"/>
                <path d="M13 12h8"/>
                <path d="M13 18h8"/>
              </svg>
            }
            label="Assignments"
            color="#f59e0b"
            onClick={() => router.push("/dashboard/assignments")}
          />
          <HomeTile
            icon={
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2"/>
                <path d="M8.5 2h7"/>
                <path d="M7 16h10"/>
              </svg>
            }
            label="Lab Manuals"
            color="#8b5cf6"
            onClick={() => router.push("/dashboard/lab-manuals")}
          />
        </div>
      </div>
    );
  }

  // ── Faculty / Admin View ──
  const roleLabel =
    userData.role === "admin"
      ? "Admin"
      : "Faculty";

  const greeting = getGreeting();

  return (
    <div className="max-w-3xl">
      <div className="mb-8 animate-fade-in">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
          {greeting} 👋
        </h1>
        <p className="mt-1.5 text-sm text-text-secondary">
          You are signed in as <Badge variant="accent">{roleLabel}</Badge>
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8 animate-slide-up" style={{ animationDelay: "0.05s" }}>
        <QuickAction icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>} label="Upload" onClick={() => router.push("/dashboard/upload")} />
        <QuickAction icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>} label="New Assignment" onClick={() => router.push("/dashboard/assignments/create")} />
        <QuickAction icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>} label="Submissions" onClick={() => router.push("/dashboard/submissions")} />
      </div>

      <div className="grid gap-4 animate-slide-up" style={{ animationDelay: "0.1s" }}>
        <Card>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 h-9 w-9 rounded-[var(--radius-md)] bg-accent-light flex items-center justify-center text-accent">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text-primary">
                Getting Started
              </h3>
              <p className="mt-1 text-sm text-text-secondary leading-relaxed">
                {userData.role === "admin"
                  ? "Go to the Admin Panel to approve faculty accounts and seed data."
                  : "You can now upload notes, post assignments, and manage content."}
              </p>
            </div>
          </div>
        </Card>

        {/* Announcements */}
        {announcements.length > 0 && (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-[var(--radius-sm)] bg-accent-light flex items-center justify-center text-accent">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 11 18-5v12L3 13v-2z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>
                </div>
                <h3 className="text-sm font-semibold text-text-primary">
                  Announcements
                </h3>
              </div>
              <button
                onClick={() => router.push("/dashboard/announcements")}
                className="text-xs text-accent hover:text-accent-hover font-medium transition-colors cursor-pointer"
              >
                View all →
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {announcements.map((a) => (
                <div key={a.id} className="border-b border-border-light pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2">
                    {a.pinned && <Badge variant="warning">Pinned</Badge>}
                    <p className="text-sm font-medium text-text-primary">{a.title}</p>
                  </div>
                  <p className="text-xs text-text-secondary mt-1 line-clamp-2">{a.content}</p>
                  <p className="text-xs text-text-tertiary mt-1.5">
                    {new Date(a.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function HomeTile({ icon, label, color, onClick }: { icon: React.ReactNode; label: string; color: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col items-center justify-center aspect-square rounded-[var(--radius-xl)] border border-border bg-surface hover:shadow-xl hover:-translate-y-1 active:translate-y-0 active:shadow-sm transition-all duration-250 ease-out cursor-pointer overflow-hidden"
    >
      {/* Subtle gradient bg on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `radial-gradient(circle at center, ${color}08 0%, transparent 70%)` }}
      />
      <div className="relative z-10 flex flex-col items-center gap-3">
        <div
          className="h-14 w-14 sm:h-16 sm:w-16 rounded-[var(--radius-lg)] flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
          style={{ backgroundColor: `${color}12`, color }}
        >
          {icon}
        </div>
        <span className="text-sm sm:text-base font-semibold text-text-primary">{label}</span>
      </div>
    </button>
  );
}

function QuickAction({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-4 rounded-[var(--radius-lg)] border border-border bg-surface hover:bg-surface-hover hover:border-accent/30 hover:shadow-md hover:shadow-accent-glow hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group active:translate-y-0"
    >
      <div className="text-text-secondary group-hover:text-accent transition-colors duration-200">
        {icon}
      </div>
      <span className="text-xs font-medium text-text-secondary group-hover:text-text-primary transition-colors duration-200">{label}</span>
    </button>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
