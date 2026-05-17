"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { PageHeader, PDFGrid } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { onAuthChange, getUserData } from "@/lib/supabase-auth";
import { getResourcesBySubject } from "@/lib/queries";
import type { StudentProfile, Resource } from "@/types";

export default function AssignmentsSubjectPage() {
  const router = useRouter();
  const params = useParams();
  const subjectId = decodeURIComponent(params.subjectId as string);
  const [resources, setResources] = useState<Resource[]>([]);
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

      if (data.role === "student") {
        const { data: profile } = await supabase
          .from("student_profiles").select("*").eq("uid", user.id).single();
        if (!profile) { router.replace("/onboarding"); return; }
        const p = profile as unknown as StudentProfile;
        const res = await getResourcesBySubject("assignments", p.courseId, p.branchId, p.semesterId, subjectId);
        setResources(res);
      } else {
        const { data: res } = await supabase
          .from("resources").select("*")
          .eq("type", "assignments").eq("subjectId", subjectId)
          .order("createdAt", { ascending: false });
        setResources((res || []) as unknown as Resource[]);
      }
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

  return (
    <div className="max-w-2xl">
      <PageHeader
        title={subjectName || subjectId}
        subtitle={`${resources.length} assignment${resources.length !== 1 ? "s" : ""}`}
        icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="6" height="6" rx="1"/><path d="m3 17 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/></svg>}
      />
      <PDFGrid resources={resources} emptyMessage="No assignments uploaded for this subject yet." />
    </div>
  );
}
