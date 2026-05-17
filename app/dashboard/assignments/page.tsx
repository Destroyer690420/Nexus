"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader, SubjectGrid, EmptyState, Button, Card, Badge } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { onAuthChange, getUserData } from "@/lib/supabase-auth";
import { getSubjects } from "@/lib/queries";
import type { StudentProfile, Assignment } from "@/types";

export default function AssignmentsPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<{ id: string; name: string; code: string }[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    const unsub = onAuthChange(async (user) => {
      if (!user) { router.replace("/auth"); return; }
      const data = await getUserData(user.id);
      if (!data) { router.replace("/auth"); return; }
      setUserRole(data.role);

      if (data.role === "student") {
        // Student: show subject grid, resources with type "assignments"
        const { data: profile } = await supabase
          .from("student_profiles").select("*").eq("uid", user.id).single();
        if (!profile) { router.replace("/onboarding"); return; }
        const p = profile as unknown as StudentProfile;
        const subs = await getSubjects(p.courseId, p.branchId, p.semesterId);
        setSubjects(subs);
      } else {
        // Faculty/admin: show all assignments from assignments table
        const { data: allAssignments } = await supabase
          .from("assignments")
          .select("*")
          .order("createdAt", { ascending: false });
        setAssignments((allAssignments || []).map((r: Record<string, unknown>) => ({
          id: r.id as string, title: r.title as string, description: r.description as string,
          courseId: r.courseId as string, branchId: r.branchId as string | null,
          semesterId: r.semesterId as number, subjectId: r.subjectId as string,
          fileUrl: r.fileUrl as string, dueDate: r.dueDate as number,
          maxMarks: r.maxMarks as number | null, allowLate: r.allowLate as boolean,
          createdBy: r.createdBy as string, createdAt: r.createdAt as number,
        })));
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

  const isStudent = userRole === "student";

  // ── Student View: Subject Grid ──
  if (isStudent) {
    return (
      <div className="max-w-2xl">
        <PageHeader
          title="Assignments"
          subtitle={`${subjects.length} subject${subjects.length !== 1 ? "s" : ""} available`}
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="6" height="6" rx="1"/><path d="m3 17 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/></svg>}
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

  // ── Faculty/Admin View: Assignment List ──
  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Assignments"
        subtitle={`${assignments.length} assignment${assignments.length !== 1 ? "s" : ""}`}
        icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="6" height="6" rx="1"/><path d="m3 17 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/></svg>}
        action={<Button onClick={() => router.push("/dashboard/assignments/create")}>+ New</Button>}
      />
      {assignments.length === 0 ? (
        <EmptyState title="No assignments" description="No assignments have been created yet." />
      ) : (
        <div className="flex flex-col gap-3">
          {assignments.map((a) => {
            const dueDate = new Date(a.dueDate);
            const isOverdue = Date.now() > a.dueDate;
            return (
              <Card key={a.id} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {a.subjectId && <Badge variant="accent">{a.subjectId}</Badge>}
                      <Badge variant={isOverdue ? "destructive" : "warning"}>
                        {isOverdue ? "Past Due" : "Active"}
                      </Badge>
                    </div>
                    <p className="text-sm font-semibold text-text-primary mt-2">{a.title}</p>
                    {a.description && <p className="text-xs text-text-secondary mt-1">{a.description}</p>}
                    <p className="text-xs text-text-tertiary mt-2">Due: {dueDate.toLocaleDateString()}</p>
                  </div>
                  {a.fileUrl && (
                    <a href={a.fileUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-border px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent-light transition-all duration-200 flex-shrink-0">
                      Download
                    </a>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
