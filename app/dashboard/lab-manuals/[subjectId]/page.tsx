"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { PageHeader, PDFGrid } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { onAuthChange, getUserData } from "@/lib/supabase-auth";
import { getResourcesBySubject } from "@/lib/queries";
import type { StudentProfile, Resource } from "@/types";

export default function LabManualsSubjectPage() {
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
        const res = await getResourcesBySubject("lab_manuals", p.courseId, p.branchId, p.semesterId, subjectId);
        setResources(res);
      } else {
        const { data: res } = await supabase
          .from("resources").select("*")
          .eq("type", "lab_manuals").eq("subjectId", subjectId)
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
        subtitle={`${resources.length} lab manual${resources.length !== 1 ? "s" : ""}`}
        icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2"/><path d="M8.5 2h7"/><path d="M7 16h10"/></svg>}
      />
      <PDFGrid resources={resources} emptyMessage="No lab manuals uploaded for this subject yet." />
    </div>
  );
}
