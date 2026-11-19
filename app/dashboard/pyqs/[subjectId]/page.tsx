"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { FileText, CaretRight, PlusCircle } from "@phosphor-icons/react";
import {
  LargeTitleHeader,
  Stickie,
  Button,
} from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { onAuthChange, getUserData } from "@/lib/supabase-auth";
import { getResourcesBySubject } from "@/lib/queries";
import type { StudentProfile, Resource } from "@/types";

export default function PYQsSubjectPage() {
  const params = useParams();
  const subjectId = decodeURIComponent(params.subjectId as string);
  const [years, setYears] = useState<{ year: number; count: number }[]>([]);
  const [subjectName, setSubjectName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const unsub = onAuthChange(async (user) => {
      if (!user) return;
      const data = await getUserData(user.id);
      if (!data || !active) return;

      const { data: subjectData } = await supabase
        .from("subjects")
        .select("name")
        .eq("id", subjectId)
        .single();
      if (subjectData && active) setSubjectName(subjectData.name as string);

      let resources: Resource[] = [];
      if (data.role === "student") {
        const { data: profile } = await supabase
          .from("student_profiles")
          .select("*")
          .eq("uid", user.id)
          .single();
        if (!profile || !active) return;
        const p = profile as unknown as StudentProfile;
        resources = await getResourcesBySubject(
          "pyqs",
          p.courseId,
          p.branchId,
          p.semesterId,
          subjectId
        );
      } else {
        const { data: res } = await supabase
          .from("resources")
          .select("*")
          .eq("type", "pyqs")
          .eq("subjectId", subjectId)
          .order("year", { ascending: false });
        resources = (res || []) as unknown as Resource[];
      }

      const yearCounts = new Map<number, number>();
      resources.forEach((r) => {
        const y = r.year || 0;
        yearCounts.set(y, (yearCounts.get(y) || 0) + 1);
      });

      const detected = Array.from(yearCounts.entries()).map(([year, count]) => ({
        year,
        count,
      }));

      if (detected.length === 0) {
        // Default past 4 years
        const curYear = new Date().getFullYear();
        setYears([curYear - 1, curYear - 2, curYear - 3, curYear - 4].map((y) => ({
          year: y,
          count: 0,
        })));
      } else {
        setYears(detected.sort((a, b) => b.year - a.year));
      }

      if (active) setLoading(false);
    });
    return () => {
      active = false;
      unsub();
    };
  }, [subjectId]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="flex flex-col items-center gap-3 animate-pulse">
          <Stickie mood="think" size={80} />
          <p className="font-display font-extrabold text-sm text-ink-3">
            Loading exam years...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <LargeTitleHeader
        title={subjectName || "Subject PYQs"}
        subtitle="Select an exam year to view question papers & answer keys"
        parentHref="/dashboard/pyqs"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {years.map(({ year, count }) => {
          const title = year === 0 ? "Other / Mixed Years" : `Year ${year}`;
          const subtitle =
            count > 0
              ? `${count} question paper${count !== 1 ? "s" : ""}`
              : "No papers uploaded yet";

          return (
            <Link
              key={year}
              href={`/dashboard/pyqs/${encodeURIComponent(subjectId)}/${year}`}
              className="group p-4 rounded-[20px] border-2 border-line bg-surface shadow-[0_3px_0_var(--line-strong)] hover:border-sun active:shadow-[0_1px_0_var(--line-strong)] active:translate-y-[2px] transition-all flex items-center justify-between gap-3 cursor-pointer"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-[14px] bg-sun-tint text-sun-deep flex items-center justify-center font-display font-black text-sm shrink-0">
                  {year === 0 ? <FileText size={24} weight="bold" /> : year}
                </div>
                <div className="min-w-0">
                  <h3 className="font-display font-black text-base text-ink group-hover:text-sun-deep transition-colors truncate">
                    {title}
                  </h3>
                  <p className="text-xs font-semibold text-ink-3 mt-0.5">
                    {subtitle}
                  </p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-[10px] bg-surface-sunken flex items-center justify-center text-ink-3 group-hover:text-sun-deep group-hover:translate-x-0.5 transition-all shrink-0">
                <CaretRight size={16} weight="bold" />
              </div>
            </Link>
          );
        })}
      </div>

      <div className="pt-4 flex justify-center">
        <Link href="/dashboard/contribute">
          <Button variant="ghost" size="md">
            <PlusCircle size={18} weight="bold" />
            Upload missing question paper for {subjectName || "this subject"}
          </Button>
        </Link>
      </div>
    </div>
  );
}
