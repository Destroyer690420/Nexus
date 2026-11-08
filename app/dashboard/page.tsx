"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Books,
  FileText,
  Folder,
  Flask,
  PlusCircle,
  UploadSimple,
  Megaphone,
  PushPin,
  ArrowRight,
  ShieldCheck,
} from "@phosphor-icons/react";
import { supabase } from "@/lib/supabase";
import { onAuthChange, getUserData } from "@/lib/supabase-auth";
import {
  getRecentAnnouncementsForStudent,
  getAnnouncements,
} from "@/lib/queries";
import { Chip, Stickie, Button } from "@/components/ui";
import type { UserData, Announcement, StudentProfile } from "@/types";

interface AcademicInfo {
  courseName: string;
  courseCode: string;
  branchName?: string;
  branchCode?: string;
  semester: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [academicInfo, setAcademicInfo] = useState<AcademicInfo | null>(null);
  const [recentAnnouncement, setRecentAnnouncement] =
    useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

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
      if (!active) return;
      setUserData(data);

      if (data.role === "student") {
        const { data: profile } = await supabase
          .from("student_profiles")
          .select("*")
          .eq("uid", user.id)
          .single();

        if (!active) return;
        if (!profile) {
          router.replace("/onboarding");
          return;
        }

        const p = profile as unknown as StudentProfile;

        // Fetch course details
        const { data: course } = await supabase
          .from("courses")
          .select("name, code")
          .eq("id", p.courseId)
          .single();

        let branchData: { name: string; code: string } | null = null;
        if (p.branchId) {
          const { data: b } = await supabase
            .from("branches")
            .select("name, code")
            .eq("id", p.branchId)
            .single();
          branchData = b;
        }

        if (active) {
          setAcademicInfo({
            courseName: course?.name || "Course",
            courseCode: course?.code || "",
            branchName: branchData?.name,
            branchCode: branchData?.code,
            semester: p.semesterId,
          });
        }

        const recent = await getRecentAnnouncementsForStudent(
          p.courseId,
          p.semesterId,
          7
        );
        if (active && recent.length > 0) {
          setRecentAnnouncement(recent[0]);
        }
      } else {
        const ann = await getAnnouncements();
        if (active) {
          if (ann.length > 0) {
            setRecentAnnouncement(ann[0]);
          }
        }
      }

      if (active) setLoading(false);
    });

    return () => {
      active = false;
      unsub();
    };
  }, [router]);

  if (loading || !userData) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="flex flex-col items-center gap-3 animate-pulse">
          <Stickie mood="think" size={80} />
          <p className="font-display font-extrabold text-sm text-ink-2">
            Loading your campus...
          </p>
        </div>
      </div>
    );
  }

  const isStudent = userData.role === "student";
  const isAdmin = userData.role === "admin";
  const displayName = userData.name || userData.email.split("@")[0];

  const categories = [
    {
      id: "notes",
      title: "Notes",
      subtitle: "Browse unit-wise study material",
      href: "/dashboard/notes",
      icon: Books,
      borderClass: "border-berry",
      bgClass: "bg-berry-tint/50",
      ledgeClass: "shadow-[0_4px_0_var(--color-berry-deep)]",
      activeLedge: "active:shadow-[0_1px_0_var(--color-berry-deep)]",
      iconColor: "text-berry",
      iconBg: "bg-berry text-white",
    },
    {
      id: "pyqs",
      title: "PYQs",
      subtitle: "Previous year question papers",
      href: "/dashboard/pyqs",
      icon: FileText,
      borderClass: "border-sun",
      bgClass: "bg-sun-tint/50",
      ledgeClass: "shadow-[0_4px_0_var(--color-sun-deep)]",
      activeLedge: "active:shadow-[0_1px_0_var(--color-sun-deep)]",
      iconColor: "text-sun-deep",
      iconBg: "bg-sun text-ink",
    },
    {
      id: "assignments",
      title: "Assignments",
      subtitle: "Faculty problem sets & manuals",
      href: "/dashboard/assignments",
      icon: Folder,
      borderClass: "border-tangerine",
      bgClass: "bg-tangerine-tint/50",
      ledgeClass: "shadow-[0_4px_0_var(--color-tangerine-deep)]",
      activeLedge: "active:shadow-[0_1px_0_var(--color-tangerine-deep)]",
      iconColor: "text-tangerine-deep",
      iconBg: "bg-tangerine text-white",
    },
    {
      id: "lab-manuals",
      title: "Lab Manuals",
      subtitle: "Experiments & practical codes",
      href: "/dashboard/lab-manuals",
      icon: Flask,
      borderClass: "border-fern",
      bgClass: "bg-fern-tint/50",
      ledgeClass: "shadow-[0_4px_0_var(--color-fern-deep)]",
      activeLedge: "active:shadow-[0_1px_0_var(--color-fern-deep)]",
      iconColor: "text-fern-deep",
      iconBg: "bg-fern text-white",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-8 space-y-6">
      {/* ── HEADER GREETING ── */}
      <div className="space-y-1.5">
        <h1 className="font-display font-black text-2xl md:text-3xl text-ink tracking-tight">
          Hey {displayName}! 👋
        </h1>

        {isStudent && academicInfo && (
          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            <Chip variant="neutral" className="font-extrabold text-xs">
              {academicInfo.courseCode || academicInfo.courseName}
              {academicInfo.branchCode ? ` • ${academicInfo.branchCode}` : ""}
              {` • Sem ${academicInfo.semester}`}
            </Chip>
            <span className="text-xs font-semibold text-ink-3">
              Your personalized academic desk
            </span>
          </div>
        )}

        {!isStudent && (
          <div className="flex items-center gap-2 pt-0.5">
            <Chip
              variant={isAdmin ? "berry" : "tangerine"}
              className="font-extrabold text-xs"
            >
              {isAdmin ? "Campus Administrator" : "Faculty Member"}
            </Chip>
            <span className="text-xs font-semibold text-ink-3">
              Manage resources and campus communications
            </span>
          </div>
        )}
      </div>

      {/* ── RECENT ANNOUNCEMENT BANNER ── */}
      {recentAnnouncement && (
        <div className="p-4 rounded-[22px] border-2 border-line bg-surface shadow-[0_3px_0_var(--line-strong)] flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-[14px] bg-berry-tint text-berry flex items-center justify-center shrink-0">
            {recentAnnouncement.pinned ? (
              <PushPin size={20} weight="fill" />
            ) : (
              <Megaphone size={20} weight="bold" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-display font-black text-[11px] uppercase tracking-wider text-berry">
                {recentAnnouncement.pinned ? "Pinned Notice" : "Campus Announcement"}
              </span>
              <span className="text-[11px] font-semibold text-ink-3">
                • {new Date(recentAnnouncement.createdAt).toLocaleDateString()}
              </span>
            </div>
            <h2 className="font-display font-extrabold text-sm text-ink truncate">
              {recentAnnouncement.title}
            </h2>
            <p className="text-xs font-medium text-ink-2 mt-0.5 line-clamp-1">
              {recentAnnouncement.content}
            </p>
          </div>
          <Link
            href="/dashboard/announcements"
            className="shrink-0 self-center px-3 py-1.5 rounded-[10px] bg-surface-sunken hover:bg-surface-2 text-ink text-xs font-display font-extrabold transition-colors flex items-center gap-1"
          >
            <span>View</span>
            <ArrowRight size={14} weight="bold" />
          </Link>
        </div>
      )}

      {/* ── 4 CATEGORY CARDS (2x2 Mobile, 4-across Desktop) ── */}
      <div className="space-y-2.5">
        <h2 className="font-display font-black text-lg text-ink">
          Study Materials
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.id}
                href={cat.href}
                className={`group p-4 md:p-5 rounded-[22px] border-2 ${cat.borderClass} ${cat.bgClass} ${cat.ledgeClass} ${cat.activeLedge} active:translate-y-[2px] transition-all flex flex-col justify-between min-h-[140px] md:min-h-[160px] cursor-pointer`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`w-11 h-11 rounded-[14px] flex items-center justify-center ${cat.iconBg} shadow-sm group-hover:scale-105 transition-transform`}
                  >
                    <Icon size={24} weight="bold" />
                  </div>
                  <ArrowRight
                    size={16}
                    weight="bold"
                    className={`${cat.iconColor} opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all`}
                  />
                </div>

                <div className="mt-4">
                  <h3 className="font-display font-black text-base md:text-lg text-ink">
                    {cat.title}
                  </h3>
                  <p className="text-xs font-semibold text-ink-2 mt-0.5 line-clamp-1">
                    {cat.subtitle}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── QUICK ACTION CARD ── */}
      <div className="pt-2">
        {isStudent ? (
          <div className="p-5 rounded-[22px] border-2 border-line bg-surface shadow-[0_4px_0_var(--line-strong)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-[16px] bg-berry-tint text-berry flex items-center justify-center shrink-0">
                <PlusCircle size={28} weight="bold" />
              </div>
              <div>
                <h3 className="font-display font-black text-base text-ink">
                  Got notes or past papers?
                </h3>
                <p className="text-xs font-semibold text-ink-2 mt-0.5">
                  Help your classmates by contributing study materials.
                </p>
              </div>
            </div>
            <Link href="/dashboard/contribute" className="w-full sm:w-auto shrink-0">
              <Button variant="primary" size="md">
                Contribute file
              </Button>
            </Link>
          </div>
        ) : (
          <div className="p-5 rounded-[22px] border-2 border-line bg-surface shadow-[0_4px_0_var(--line-strong)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-[16px] bg-tangerine-tint text-tangerine-deep flex items-center justify-center shrink-0">
                <UploadSimple size={28} weight="bold" />
              </div>
              <div>
                <h3 className="font-display font-black text-base text-ink">
                  Publish course material
                </h3>
                <p className="text-xs font-semibold text-ink-2 mt-0.5">
                  Upload assignments, notes, or lab manuals directly to students.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <Link href="/dashboard/upload" className="flex-1 sm:flex-initial">
                <Button variant="primary" size="md">
                  Upload material
                </Button>
              </Link>
              {isAdmin && (
                <Link href="/dashboard/admin" className="flex-1 sm:flex-initial">
                  <Button variant="secondary" size="md">
                    <ShieldCheck size={18} weight="bold" />
                    Admin panel
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
