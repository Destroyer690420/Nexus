"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, Button } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { onAuthChange, getUserData, getCurrentUser } from "@/lib/supabase-auth";
import { getSubmission, upsertSubmission } from "@/lib/queries";

interface Assignment {
  id: string;
  title: string;
  description: string;
  subjectId: string;
  fileUrl: string;
  tags: string[];
  createdAt: number;
}

export default function AssignmentsPage() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, { status: string; id: string }>>({});
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthChange(async (user) => {
      if (!user) { router.replace("/auth"); return; }
      const data = await getUserData(user.id);
      if (!data || data.role !== "student") { router.replace("/dashboard"); return; }

      const { data: profile } = await supabase
        .from("student_profiles").select("*").eq("uid", user.id).single();
      if (!profile) { router.replace("/onboarding"); return; }

      let query = supabase
        .from("resources").select("*")
        .eq("type", "assignments")
        .eq("courseId", (profile as { courseId: string }).courseId)
        .eq("semesterId", (profile as { semesterId: number }).semesterId)
        .order("createdAt", { ascending: false });

      const p = profile as { branchId: string | null };
      if (p.branchId) query = query.eq("branchId", p.branchId);

      const { data: assignmentData } = await query;
      const list = (assignmentData || []) as Assignment[];
      setAssignments(list);

      const subMap: Record<string, { status: string; id: string }> = {};
      for (const a of list) {
        const sub = await getSubmission(a.id, user.id);
        if (sub) subMap[a.id] = { status: sub.status, id: sub.id };
      }
      setSubmissions(subMap);
      setLoading(false);
    });
    return unsub;
  }, [router]);

  const handleToggle = async (assignmentId: string) => {
    setToggling(assignmentId);
    const current = submissions[assignmentId];
    const newStatus = current?.status === "submitted" ? "pending" : "submitted";
    try {
      const user = await getCurrentUser();
      if (!user) return;
      await upsertSubmission(assignmentId, user.id, newStatus);
      setSubmissions((prev) => ({
        ...prev,
        [assignmentId]: { status: newStatus, id: prev[assignmentId]?.id || "" },
      }));
    } catch {
      alert("Failed to update status.");
    }
    setToggling(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-6 w-6 border-2 border-text-tertiary border-t-accent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight text-text-primary mb-1">
        Assignments
      </h1>
      <p className="text-sm text-text-secondary mb-8">
        {assignments.length} assignment{assignments.length !== 1 ? "s" : ""}.
      </p>

      {assignments.length === 0 ? (
        <Card><p className="text-sm text-text-secondary">No assignments available for your current course and semester yet.</p></Card>
      ) : (
        <div className="flex flex-col gap-3">
          {assignments.map((a) => {
            const sub = submissions[a.id];
            const isSubmitted = sub?.status === "submitted";
            const subLabel = isSubmitted ? "Submitted" : "Pending";

            return (
              <Card key={a.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {a.subjectId && (
                        <span className="rounded bg-accent-light px-2 py-0.5 text-xs font-medium text-accent">{a.subjectId}</span>
                      )}
                      <span className={`rounded px-2 py-0.5 text-xs font-medium ${isSubmitted ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                        {subLabel}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-text-primary mt-1">{a.title}</p>
                    {a.description && <p className="text-xs text-text-secondary mt-1">{a.description}</p>}
                    {a.tags && a.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {a.tags.map((tag) => (
                          <span key={tag} className="rounded bg-surface px-2 py-0.5 text-xs text-text-tertiary">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    {a.fileUrl && (
                      <a href={a.fileUrl} target="_blank" rel="noopener noreferrer"
                        className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent-light transition-colors text-center">
                        Details
                      </a>
                    )}
                    <Button
                      variant={isSubmitted ? "ghost" : "primary"}
                      onClick={() => handleToggle(a.id)}
                      loading={toggling === a.id}
                    >
                      {isSubmitted ? "Mark Pending" : "Mark Submitted"}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
