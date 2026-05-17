"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { PageHeader, DrillDownList } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { onAuthChange, getUserData } from "@/lib/supabase-auth";
import { getResourcesBySubject } from "@/lib/queries";
import type { StudentProfile, Resource } from "@/types";

export default function PYQsSubjectPage() {
  const router = useRouter();
  const params = useParams();
  const subjectId = decodeURIComponent(params.subjectId as string);
  const [years, setYears] = useState<number[]>([]);
  const [subjectName, setSubjectName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthChange(async (user) => {
      if (!user) { router.replace("/auth"); return; }
      const data = await getUserData(user.id);
      if (!data) { router.replace("/auth"); return; }

      const { data: subjectData } = await supabase
        .from("subjects").select("name").eq("id", subjectId).single();
      if (subjectData) setSubjectName(subjectData.name as string);

      let resources: Resource[] = [];
      if (data.role === "student") {
        const { data: profile } = await supabase
          .from("student_profiles").select("*").eq("uid", user.id).single();
        if (!profile) { router.replace("/onboarding"); return; }
        const p = profile as unknown as StudentProfile;
        resources = await getResourcesBySubject("pyqs", p.courseId, p.branchId, p.semesterId, subjectId);
      } else {
        const { data: res } = await supabase
          .from("resources").select("*")
          .eq("type", "pyqs").eq("subjectId", subjectId)
          .order("year", { ascending: false });
        resources = (res || []) as unknown as Resource[];
      }

      // Extract unique years
      const yearSet = new Set<number>();
      resources.forEach((r) => {
        if (r.year) yearSet.add(r.year);
        else yearSet.add(0); // Uncategorized
      });
      const sorted = Array.from(yearSet).sort((a, b) => b - a); // newest first
      setYears(sorted);
      setLoading(false);
    });
    return unsub;
  }, [router, subjectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-6 w-6 border-2 border-text-tertiary border-t-accent rounded-full" />
      </div>
    );
  }

  const items = years.map((y) => ({
    label: y === 0 ? "Other" : String(y),
    href: `/dashboard/pyqs/${encodeURIComponent(subjectId)}/${y}`,
    subtitle: y === 0 ? "Uncategorized papers" : undefined,
  }));

  return (
    <div className="max-w-2xl">
      <PageHeader
        title={subjectName || subjectId}
        subtitle={`${years.length} year${years.length !== 1 ? "s" : ""} available`}
        icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/></svg>}
      />
      <DrillDownList items={items} emptyMessage="No PYQs uploaded for this subject yet." />
    </div>
  );
}
