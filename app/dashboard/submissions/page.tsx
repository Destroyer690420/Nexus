"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Card } from "@/components/ui";
import { onAuthChange, getUserData } from "@/lib/supabase-auth";
import { getAllAssignments, getSubmissionsForAssignment, gradeSubmission } from "@/lib/queries";
import type { UserData, Assignment, Submission } from "@/types";

export default function SubmissionsPage() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [subLoading, setSubLoading] = useState(false);
  const [gradingId, setGradingId] = useState<string | null>(null);
  const [gradeInput, setGradeInput] = useState("");
  const [feedbackInput, setFeedbackInput] = useState("");

  useEffect(() => {
    const unsub = onAuthChange(async (user) => {
      if (!user) { router.replace("/auth"); return; }
      const data = await getUserData(user.id);
      if (!data || (data.role !== "faculty" && data.role !== "admin")) {
        router.replace("/dashboard");
        return;
      }
      setUserData(data);
      const asgn = await getAllAssignments();
      setAssignments(asgn);
      setLoading(false);
    });
    return unsub;
  }, [router]);

  const loadSubmissions = async (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setSubLoading(true);
    setSubmissions([]);
    setGradeInput("");
    setFeedbackInput("");
    setGradingId(null);
    const subs = await getSubmissionsForAssignment(assignment.id);
    setSubmissions(subs);
    setSubLoading(false);
  };

  const handleGrade = async (submissionId: string) => {
    setGradingId(submissionId);
    try {
      await gradeSubmission(submissionId, gradeInput || null, feedbackInput, userData!.uid);
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === submissionId
            ? { ...s, grade: gradeInput || null, feedback: feedbackInput, gradedBy: userData!.uid, gradedAt: Date.now() }
            : s
        )
      );
      setGradeInput("");
      setFeedbackInput("");
      setGradingId(null);
    } catch {
      alert("Failed to grade submission.");
    }
    setGradingId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-6 w-6 border-2 border-text-tertiary border-t-accent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-semibold tracking-tight text-text-primary mb-1">
        Submissions
      </h1>
      <p className="text-sm text-text-secondary mb-8">
        Review and grade student submissions.
      </p>

      {!selectedAssignment ? (
        <>
          <p className="text-sm font-medium text-text-primary mb-3">Select an assignment:</p>
          {assignments.length === 0 ? (
            <Card><p className="text-sm text-text-secondary">No assignments created yet.</p></Card>
          ) : (
            <div className="flex flex-col gap-3">
              {assignments.map((a) => (
                <Card key={a.id} className="p-4 cursor-pointer hover:border-accent transition-colors" onClick={() => loadSubmissions(a)}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-text-primary">{a.title}</p>
                      <p className="text-xs text-text-tertiary mt-1">
                        {a.subjectId} &middot; Due {new Date(a.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-xs text-text-tertiary">View submissions &rarr;</span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      ) : (
        <div>
          <button
            onClick={() => { setSelectedAssignment(null); setSubmissions([]); }}
            className="text-sm text-accent hover:underline mb-4"
          >
            &larr; Back to assignments
          </button>

          <div className="mb-4">
            <h2 className="text-lg font-medium text-text-primary">{selectedAssignment.title}</h2>
            <p className="text-xs text-text-tertiary mt-1">
              {selectedAssignment.subjectId} &middot; Due {new Date(selectedAssignment.dueDate).toLocaleDateString()}
              {selectedAssignment.maxMarks && ` &middot; ${selectedAssignment.maxMarks} marks`}
            </p>
          </div>

          {subLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-6 w-6 border-2 border-text-tertiary border-t-accent rounded-full" />
            </div>
          ) : submissions.length === 0 ? (
            <Card><p className="text-sm text-text-secondary">No submissions yet for this assignment.</p></Card>
          ) : (
            <div className="flex flex-col gap-3">
              {submissions.map((sub) => {
                const isGrading = gradingId === sub.id;
                const isGraded = !!sub.gradedAt;
                return (
                  <Card key={sub.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-text-primary">
                            {sub.studentEmail || sub.studentId.slice(0, 8)}
                          </span>
                          <span className={`rounded px-2 py-0.5 text-xs font-medium ${
                            sub.status === "submitted" ? "bg-success/10 text-success" :
                            sub.status === "late" ? "bg-warning/10 text-warning" :
                            "bg-surface text-text-tertiary"
                          }`}>
                            {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                          </span>
                          {isGraded && (
                            <span className="rounded bg-accent-light px-2 py-0.5 text-xs font-medium text-accent">
                              Graded
                            </span>
                          )}
                        </div>
                        {sub.submittedAt && (
                          <p className="text-xs text-text-tertiary mt-1">
                            Submitted {new Date(sub.submittedAt).toLocaleString()}
                          </p>
                        )}
                        {sub.fileUrl && (
                          <a href={sub.fileUrl} target="_blank" rel="noopener noreferrer"
                            className="inline-block mt-2 text-xs text-accent underline underline-offset-2">
                            View submission file
                          </a>
                        )}
                        {isGraded && sub.grade && (
                          <p className="text-xs text-text-secondary mt-2">
                            Grade: <span className="font-medium text-text-primary">{sub.grade}</span>
                          </p>
                        )}
                        {isGraded && sub.feedback && (
                          <p className="text-xs text-text-secondary mt-1">
                            Feedback: {sub.feedback}
                          </p>
                        )}
                      </div>

                      <div className="ml-4 flex-shrink-0">
                        {!isGrading ? (
                          <Button variant="ghost" onClick={() => { setGradingId(sub.id); setGradeInput(sub.grade || ""); setFeedbackInput(sub.feedback || ""); }}>
                            {isGraded ? "Edit Grade" : "Grade"}
                          </Button>
                        ) : (
                          <div className="flex flex-col gap-2 w-56">
                            <input
                              type="text"
                              value={gradeInput}
                              onChange={(e) => setGradeInput(e.target.value)}
                              placeholder="Grade (e.g. 85/100)"
                              className="rounded-md border border-border bg-white px-3 py-1.5 text-sm text-text-primary outline-none focus:border-accent"
                            />
                            <textarea
                              value={feedbackInput}
                              onChange={(e) => setFeedbackInput(e.target.value)}
                              placeholder="Feedback..."
                              rows={2}
                              className="rounded-md border border-border bg-white px-3 py-1.5 text-sm text-text-primary outline-none focus:border-accent resize-none"
                            />
                            <div className="flex gap-2">
                              <Button variant="primary" onClick={() => handleGrade(sub.id)} loading={gradingId === sub.id}>
                                Save
                              </Button>
                              <Button variant="ghost" onClick={() => { setGradingId(null); setGradeInput(""); setFeedbackInput(""); }}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
