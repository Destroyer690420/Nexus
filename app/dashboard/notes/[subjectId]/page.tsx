"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { PageHeader, DrillDownList } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { onAuthChange, getUserData } from "@/lib/supabase-auth";
import { getResourcesBySubject } from "@/lib/queries";
import type { StudentProfile, Resource } from "@/types";

export default function NotesSubjectPage() {
  const router = useRouter();
  const params = useParams();
  const subjectId = decodeURIComponent(params.subjectId as string);
  const [units, setUnits] = useState<number[]>([]);
  const [subjectName, setSubjectName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthChange(async (user) => {
      if (!user) { router.replace("/auth"); return; }
      const data = await getUserData(user.id);
      if (!data) { router.replace("/auth"); return; }

      // Get subject name
      const { data: subjectData } = await supabase
        .from("subjects").select("name").eq("id", subjectId).single();
      if (subjectData) setSubjectName(subjectData.name as string);

      let resources: Resource[] = [];
      if (data.role === "student") {
        const { data: profile } = await supabase
          .from("student_profiles").select("*").eq("uid", user.id).single();
        if (!profile) { router.replace("/onboarding"); return; }
        const p = profile as unknown as StudentProfile;
        resources = await getResourcesBySubject("notes", p.courseId, p.branchId, p.semesterId, subjectId);
      } else {
        const { data: res } = await supabase
          .from("resources").select("*")
          .eq("type", "notes").eq("subjectId", subjectId)
          .order("unit", { ascending: true });
        resources = (res || []) as unknown as Resource[];
      }

      // Extract unique units
      const unitSet = new Set<number>();
      resources.forEach((r) => {
        if (r.unit) unitSet.add(r.unit);
        else unitSet.add(0); // "General" unit
      });
      const sorted = Array.from(unitSet).sort((a, b) => a - b);
      setUnits(sorted);
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

  const items = units.map((u) => ({
    label: u === 0 ? "General" : `Unit ${u}`,
    href: `/dashboard/notes/${encodeURIComponent(subjectId)}/${u}`,
    subtitle: u === 0 ? "Uncategorized notes" : undefined,
  }));

  return (
    <div className="max-w-2xl">
      <PageHeader
        title={subjectName || subjectId}
        subtitle={`${units.length} unit${units.length !== 1 ? "s" : ""} available`}
        icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>}
      />
      <DrillDownList items={items} emptyMessage="No notes uploaded for this subject yet." />
    </div>
  );
}
