"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader, SubjectGrid, EmptyState, Button } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { onAuthChange, getUserData } from "@/lib/supabase-auth";
import { getSubjects } from "@/lib/queries";
import type { StudentProfile } from "@/types";

export default function PYQsPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<{ id: string; name: string; code: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    const unsub = onAuthChange(async (user) => {
      if (!user) { router.replace("/auth"); return; }
      const data = await getUserData(user.id);
      if (!data) { router.replace("/auth"); return; }
      setUserRole(data.role);

      if (data.role === "student") {
        const { data: profile } = await supabase
          .from("student_profiles").select("*").eq("uid", user.id).single();
        if (!profile) { router.replace("/onboarding"); return; }
        const p = profile as unknown as StudentProfile;
        const subs = await getSubjects(p.courseId, p.branchId, p.semesterId);
        setSubjects(subs);
      } else {
        const { data: allSubs } = await supabase
          .from("subjects").select("id, name, code").order("name", { ascending: true });
        setSubjects((allSubs || []) as { id: string; name: string; code: string }[]);
      }
      setLoading(false);
    });
    return unsub;
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-6 w-6 border-2 border-text-tertiary border-t-accent rounded-full" />
      </div>
    );
  }

  const canUpload = userRole === "admin" || userRole === "faculty";

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Previous Year Questions"
        subtitle={`${subjects.length} subject${subjects.length !== 1 ? "s" : ""} available`}
        icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>}
      />

      {subjects.length === 0 ? (
        <EmptyState
          title="No subjects found"
          description={canUpload ? "No subjects have been added yet." : "No subjects available for your current course and semester."}
          action={canUpload ? <Button onClick={() => router.push("/dashboard/upload")}>Upload PYQs</Button> : undefined}
        />
      ) : (
        <SubjectGrid subjects={subjects} basePath="/dashboard/pyqs" />
      )}
    </div>
  );
}
