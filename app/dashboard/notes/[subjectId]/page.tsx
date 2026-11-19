"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Books, CaretRight, PlusCircle } from "@phosphor-icons/react";
import {
  LargeTitleHeader,
  Stickie,
  Button,
} from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { onAuthChange, getUserData } from "@/lib/supabase-auth";
import { getResourcesBySubject } from "@/lib/queries";
import type { StudentProfile, Resource } from "@/types";

export default function NotesSubjectPage() {
  const params = useParams();
  const subjectId = decodeURIComponent(params.subjectId as string);
  const [units, setUnits] = useState<{ unit: number; count: number }[]>([]);
  const [subjectName, setSubjectName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const unsub = onAuthChange(async (user) => {
      if (!user) return;
      const data = await getUserData(user.id);
      if (!data || !active) return;

      // Get subject name
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
          "notes",
          p.courseId,
          p.branchId,
          p.semesterId,
          subjectId
        );
      } else {
        const { data: res } = await supabase
          .from("resources")
          .select("*")
          .eq("type", "notes")
          .eq("subjectId", subjectId)
          .order("unit", { ascending: true });
        resources = (res || []) as unknown as Resource[];
      }

      // Group by units
      const unitCounts = new Map<number, number>();
      resources.forEach((r) => {
        const u = r.unit || 0;
        unitCounts.set(u, (unitCounts.get(u) || 0) + 1);
      });

      // Default to units 1..5 if none or add existing
      const detected = Array.from(unitCounts.entries()).map(([unit, count]) => ({
        unit,
        count,
      }));

      // If no resources yet, show units 1 through 5 as empty slots
      if (detected.length === 0) {
        setUnits([1, 2, 3, 4, 5].map((u) => ({ unit: u, count: 0 })));
      } else {
        setUnits(detected.sort((a, b) => a.unit - b.unit));
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
            Loading syllabus units...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <LargeTitleHeader
        title={subjectName || "Subject Notes"}
        subtitle="Select a unit to browse lecture notes & presentations"
        parentHref="/dashboard/notes"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {units.map(({ unit, count }) => {
          const title = unit === 0 ? "General & Syllabus" : `Unit ${unit}`;
          const subtitle =
            count > 0
              ? `${count} document${count !== 1 ? "s" : ""} available`
              : "No notes uploaded yet";

          return (
            <Link
              key={unit}
              href={`/dashboard/notes/${encodeURIComponent(subjectId)}/${unit}`}
              className="group p-4 rounded-[20px] border-2 border-line bg-surface shadow-[0_3px_0_var(--line-strong)] hover:border-berry active:shadow-[0_1px_0_var(--line-strong)] active:translate-y-[2px] transition-all flex items-center justify-between gap-3 cursor-pointer"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-[14px] bg-berry-tint text-berry flex items-center justify-center font-display font-black text-lg shrink-0">
                  {unit === 0 ? <Books size={24} weight="bold" /> : unit}
                </div>
                <div className="min-w-0">
                  <h3 className="font-display font-black text-base text-ink group-hover:text-berry transition-colors truncate">
                    {title}
                  </h3>
                  <p className="text-xs font-semibold text-ink-3 mt-0.5">
                    {subtitle}
                  </p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-[10px] bg-surface-sunken flex items-center justify-center text-ink-3 group-hover:text-berry group-hover:translate-x-0.5 transition-all shrink-0">
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
            Upload missing notes for {subjectName || "this subject"}
          </Button>
        </Link>
      </div>
    </div>
  );
}
