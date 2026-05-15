"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Card } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { onAuthChange, getUserData } from "@/lib/supabase-auth";
import { getAssignmentsForStudent, getFullSubmission } from "@/lib/queries";
import type { UserData, Assignment, Submission } from "@/types";

export default function AssignmentsPage() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, Submission | null>>({});
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [fileMap, setFileMap] = useState<Record<string, File | null>>({});

  useEffect(() => {
    const unsub = onAuthChange(async (user) => {
      if (!user) { router.replace("/auth"); return; }
      const data = await getUserData(user.id);
      if (!data || data.role !== "student") { router.replace("/dashboard"); return; }

      const { data: profile } = await supabase
        .from("student_profiles").select("*").eq("uid", user.id).single();
      if (!profile) { router.replace("/onboarding"); return; }

      const p = profile as { courseId: string; branchId: string | null; semesterId: number };
      const list = await getAssignmentsForStudent(p.courseId, p.branchId, p.semesterId);
      setAssignments(list);

      const subMap: Record<string, Submission | null> = {};
      for (const a of list) {
        const sub = await getFullSubmission(a.id, user.id);
        subMap[a.id] = sub;
      }
      setSubmissions(subMap);
      setLoading(false);
    });
    return unsub;
  }, [router]);

  const handleFileChange = (assignmentId: string, file: File | null) => {
    setFileMap((prev) => ({ ...prev, [assignmentId]: file }));
  };

  const handleSubmit = async (assignmentId: string) => {
    const file = fileMap[assignmentId];
    if (!file) return;

    setUploadingId(assignmentId);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Not authenticated");

      const formData = new FormData();
      formData.append("assignmentId", assignmentId);
      formData.append("file", file);

      const res = await fetch("/api/submissions/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Upload failed");
      }

      const result = await res.json();
      setSubmissions((prev) => ({
        ...prev,
        [assignmentId]: {
          id: prev[assignmentId]?.id || "",
          assignmentId,
          studentId: "",
          fileUrl: result.fileUrl,
          status: result.status,
          submittedAt: Date.now(),
        },
      }));
      setFileMap((prev) => ({ ...prev, [assignmentId]: null }));
    } catch (err) {
      alert((err as { message?: string })?.message || "Upload failed.");
    }
    setUploadingId(null);
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
            const isSubmitted = sub && (sub.status === "submitted" || sub.status === "late");
            const isGraded = isSubmitted && sub?.gradedAt;
            const dueDate = new Date(a.dueDate);
            const isOverdue = Date.now() > a.dueDate;
            const selectedFile = fileMap[a.id];

            return (
              <Card key={a.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {a.subjectId && (
                        <span className="rounded bg-accent-light px-2 py-0.5 text-xs font-medium text-accent">{a.subjectId}</span>
                      )}
                      <span className={`rounded px-2 py-0.5 text-xs font-medium ${
                        isGraded ? "bg-accent-light text-accent" :
                        isSubmitted ? "bg-success/10 text-success" :
                        isOverdue ? "bg-destructive/10 text-destructive" :
                        "bg-warning/10 text-warning"
                      }`}>
                        {isGraded ? "Graded" : isSubmitted ? "Submitted" : isOverdue ? "Overdue" : "Pending"}
                      </span>
                      {a.maxMarks && (
                        <span className="text-xs text-text-tertiary">{a.maxMarks} marks</span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-text-primary mt-1">{a.title}</p>
                    {a.description && <p className="text-xs text-text-secondary mt-1">{a.description}</p>}
                    <p className="text-xs text-text-tertiary mt-1.5">
                      Due: {dueDate.toLocaleDateString()} at {dueDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                    {isGraded && (
                      <div className="mt-2 p-2 rounded bg-surface">
                        {sub!.grade && <p className="text-xs font-medium text-text-primary">Grade: {sub!.grade}</p>}
                        {sub!.feedback && <p className="text-xs text-text-secondary mt-1">Feedback: {sub!.feedback}</p>}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    {a.fileUrl && (
                      <a href={a.fileUrl} target="_blank" rel="noopener noreferrer"
                        className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent-light transition-colors text-center">
                        Download
                      </a>
                    )}
                    {!isSubmitted && (
                      <>
                        <input
                          type="file"
                          onChange={(e) => handleFileChange(a.id, e.target.files?.[0] || null)}
                          className="text-xs text-text-secondary file:mr-2 file:py-1 file:px-2 file:rounded file:border file:border-border file:text-xs file:bg-surface file:text-text-primary file:cursor-pointer"
                        />
                        <Button
                          variant="primary"
                          onClick={() => handleSubmit(a.id)}
                          loading={uploadingId === a.id}
                          disabled={!selectedFile}
                          className="text-xs h-8"
                        >
                          Submit
                        </Button>
                      </>
                    )}
                    {isSubmitted && sub?.fileUrl && (
                      <a href={sub.fileUrl} target="_blank" rel="noopener noreferrer"
                        className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface transition-colors text-center">
                        View Submission
                      </a>
                    )}
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
