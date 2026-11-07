"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader, SubjectGrid, EmptyState, Button, PDFGrid } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { onAuthChange, getUserData } from "@/lib/supabase-auth";
import { getSubjects, getResources } from "@/lib/queries";
import type { StudentProfile, Resource } from "@/types";

const assignmentIcon = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="6" height="6" rx="1"/>
    <path d="m3 17 2 2 4-4"/>
    <path d="M13 6h8"/>
    <path d="M13 12h8"/>
    <path d="M13 18h8"/>
  </svg>
);

export default function AssignmentsPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<{ id: string; name: string; code: string }[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
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
        setSubjects(await getSubjects(p.courseId, p.branchId, p.semesterId));
      } else {
        // Faculty/admin-posted assignment material still lives in resources.
        setResources(await getResources("assignments"));
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

  if (userRole === "student") {
    return (
      <div className="max-w-2xl">
        <PageHeader
          title="Assignments"
          subtitle={`${subjects.length} subject${subjects.length !== 1 ? "s" : ""} available`}
          icon={assignmentIcon}
        />
        {subjects.length === 0 ? (
          <EmptyState
            title="No subjects found"
            description="No subjects available for your current course and semester."
          />
        ) : (
          <SubjectGrid subjects={subjects} basePath="/dashboard/assignments" />
        )}
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Assignments"
        subtitle={`${resources.length} file${resources.length !== 1 ? "s" : ""} available`}
        icon={assignmentIcon}
        action={<Button onClick={() => router.push("/dashboard/upload")}>Upload</Button>}
      />
      <PDFGrid resources={resources} emptyMessage="No assignment material uploaded yet." />
    </div>
  );
}
