"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { PageHeader, PDFGrid } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { onAuthChange, getUserData } from "@/lib/supabase-auth";
import { getResourcesBySubject } from "@/lib/queries";
import type { StudentProfile, Resource } from "@/types";

export default function NotesUnitPage() {
  const router = useRouter();
  const params = useParams();
  const subjectId = decodeURIComponent(params.subjectId as string);
  const unit = Number(params.unit);
  const [resources, setResources] = useState<Resource[]>([]);
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

      let allResources: Resource[] = [];
      if (data.role === "student") {
        const { data: profile } = await supabase
          .from("student_profiles").select("*").eq("uid", user.id).single();
        if (!profile) { router.replace("/onboarding"); return; }
        const p = profile as unknown as StudentProfile;
        allResources = await getResourcesBySubject("notes", p.courseId, p.branchId, p.semesterId, subjectId);
      } else {
        const { data: res } = await supabase
          .from("resources").select("*")
          .eq("type", "notes").eq("subjectId", subjectId)
          .order("createdAt", { ascending: false });
        allResources = (res || []) as unknown as Resource[];
      }

      // Filter by unit
      const filtered = allResources.filter((r) => {
        if (unit === 0) return !r.unit;
        return r.unit === unit;
      });
      setResources(filtered);
      setLoading(false);
    });
    return unsub;
  }, [router, subjectId, unit]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-6 w-6 border-2 border-text-tertiary border-t-accent rounded-full" />
      </div>
    );
  }

  const unitLabel = unit === 0 ? "General" : `Unit ${unit}`;

  return (
    <div className="max-w-2xl">
      <PageHeader
        title={unitLabel}
        subtitle={`${subjectName} · ${resources.length} file${resources.length !== 1 ? "s" : ""}`}
        icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/></svg>}
      />
      <PDFGrid resources={resources} emptyMessage="No notes uploaded for this unit yet." />
    </div>
  );
}
