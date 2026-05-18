"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, PageHeader } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { onAuthChange, getUserData } from "@/lib/supabase-auth";
import { uploadFile } from "@/lib/upload";
import type { ResourceType, StudentProfile } from "@/types";

interface SubjectItem { id: string; name: string; code: string }

const resourceTypes: { value: ResourceType; label: string }[] = [
  { value: "notes", label: "Notes" }, { value: "pyqs", label: "PYQs" }, { value: "assignments", label: "Assignments" },
  { value: "lab_manuals", label: "Lab Manuals" }, { value: "others", label: "Others" },
];
const sc = "rounded-[var(--radius-md)] border border-border bg-input-bg px-3.5 py-2.5 text-sm text-text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-200 w-full";

export default function ContributePage() {
  const router = useRouter();
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [courseInfo, setCourseInfo] = useState<{ courseName: string; courseCode: string; branchName: string | null; semester: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<ResourceType>("notes");
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [subject, setSubject] = useState("");
  const [unit, setUnit] = useState("");
  const [title, setTitle] = useState("");
  const [years, setYears] = useState<number[]>([]);
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 10 }, (_, i) => currentYear - i);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const unsub = onAuthChange(async (user) => {
      if (!user) { router.replace("/auth"); return; }
      const data = await getUserData(user.id);
      if (!data || data.role !== "student") { router.replace("/dashboard"); return; }

      const { data: profile } = await supabase
        .from("student_profiles")
        .select("*")
        .eq("uid", user.id)
        .single();

      if (!profile) { router.replace("/onboarding"); return; }
      const p = profile as unknown as StudentProfile;
      setStudentProfile(p);

      const { data: courseData } = await supabase
        .from("courses")
        .select("*")
        .eq("id", p.courseId)
        .single();

      let branchName: string | null = null;
      if (p.branchId && courseData?.hasBranches) {
        const { data: branchData } = await supabase
          .from("branches")
          .select("name")
          .eq("id", p.branchId)
          .single();
        branchName = branchData?.name || null;
      }

      if (courseData) {
        setCourseInfo({
          courseName: courseData.name,
          courseCode: courseData.code,
          branchName,
          semester: p.semesterId,
        });
      }

      setLoading(false);
    });
    return unsub;
  }, [router]);

  useEffect(() => {
    if (!studentProfile) return;
    const loadSubjects = async () => {
      let query = supabase
        .from("subjects")
        .select("id, name, code")
        .eq("courseId", studentProfile.courseId)
        .eq("semesterId", studentProfile.semesterId);

      if (studentProfile.branchId) {
        query = query.eq("branchId", studentProfile.branchId);
      } else {
        query = query.is("branchId", null);
      }

      const { data } = await query.order("name", { ascending: true });
      setSubjects((data || []) as SubjectItem[]);
    };
    loadSubjects();
  }, [studentProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!title) { setError("Please enter a title."); return; }
    if (!subject) { setError("Please select a subject."); return; }
    if (type === "notes" && !unit) { setError("Please select a unit for notes."); return; }
    if (type === "pyqs" && years.length === 0) { setError("Please select at least one year for PYQs."); return; }
    if (!file) { setError("Please upload a file."); return; }

    setSubmitting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Not authenticated");

      const result = await uploadFile(file);
      const fileUrl = result.publicUrl;

      const res = await fetch("/api/contributions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          type,
          title,
          description,
          courseId: studentProfile!.courseId,
          branchId: studentProfile!.branchId || "",
          semesterId: studentProfile!.semesterId,
          subjectId: subject,
          unit: unit || "",
          years,
          tags,
          fileUrl,
        }),
      });

      if (!res.ok) {
        let errorMessage = "Upload failed";
        try { const err = await res.json(); errorMessage = err.error || errorMessage; }
        catch { const text = await res.text(); if (text) errorMessage = text; }
        throw new Error(errorMessage);
      }

      setSuccess("Contribution submitted! It will appear in your resources once approved by an admin.");
      setTitle("");
      setDescription("");
      setTags("");
      setSubject("");
      setUnit("");
      setFile(null);
      setYears([]);
    } catch (err) {
      setError((err as { message?: string })?.message || "Upload failed.");
    }
    setSubmitting(false);
  };

  if (loading) return <div className="flex items-center justify-center py-12"><div className="animate-spin h-6 w-6 border-2 border-text-tertiary border-t-accent rounded-full" /></div>;

  return (
    <div className="max-w-2xl">
      <PageHeader title="Contribute a Resource" subtitle="Share study materials with your peers. Your contribution will be reviewed before appearing."
        icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>} />

      {courseInfo && (
        <div className="mb-5 rounded-[var(--radius-md)] border border-border bg-surface px-4 py-3">
          <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-1">Contributing to</p>
          <p className="text-sm text-text-primary">
            {courseInfo.courseName} ({courseInfo.courseCode})
            {courseInfo.branchName ? ` — ${courseInfo.branchName}` : ""}
            {" — "}Semester {courseInfo.semester}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-primary">Resource Type *</label>
          <select value={type} onChange={(e) => setType(e.target.value as ResourceType)} className={sc}>
            {resourceTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary">Subject *</label>
            {subjects.length === 0 ? (
              <p className="text-xs text-text-tertiary">No subjects added yet.</p>
            ) : (
              <select value={subject} onChange={(e) => setSubject(e.target.value)} required className={sc}>
                <option value="" disabled>Select subject</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
              </select>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            {type === "pyqs" ? (
              <>
                <label className="text-sm font-medium text-text-primary">Years *</label>
                <div className="flex flex-wrap gap-2">
                  {yearOptions.map(y => (
                    <button
                      key={y}
                      type="button"
                      onClick={() => setYears(prev => prev.includes(y) ? prev.filter(x => x !== y) : [...prev, y])}
                      className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all duration-200 ${years.includes(y) ? 'bg-accent text-white border-accent shadow-sm' : 'bg-input-bg text-text-secondary border-border hover:border-accent/50 hover:text-accent'}`}
                    >
                      {y}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <label className="text-sm font-medium text-text-primary">
                  {type === "notes" ? "Unit *" : "Unit"}
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  required={type === "notes"}
                  className={sc}
                >
                  <option value="">None</option>
                  {[1, 2, 3, 4].map((u) => <option key={u} value={String(u)}>Unit {u}</option>)}
                </select>
              </>
            )}
          </div>
        </div>

        <Input label="Title *" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Unit 1 - Arrays and Linked Lists" required />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-primary">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of this resource..."
            rows={3}
            className="rounded-[var(--radius-md)] border border-border bg-input-bg px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 resize-none transition-all duration-200"
          />
        </div>

        <Input label="Tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="e.g. arrays, pointers (comma separated)" />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-primary">File *</label>
          <label className="flex items-center gap-3 cursor-pointer rounded-[var(--radius-md)] border border-dashed border-border hover:border-accent/30 hover:bg-accent-light/50 px-4 py-3 transition-all duration-200">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-tertiary"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            <span className="text-sm text-text-secondary">{file ? file.name : "Click to upload a file"}</span>
            <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="hidden" required />
          </label>
        </div>

        {error && <div className="rounded-[var(--radius-md)] bg-destructive/10 border border-destructive/20 p-3"><p className="text-sm text-destructive">{error}</p></div>}
        {success && <div className="rounded-[var(--radius-md)] bg-success/10 border border-success/20 p-3"><p className="text-sm text-success">{success}</p></div>}

        <Button type="submit" loading={submitting} className="w-full h-11">Submit Contribution</Button>
      </form>
    </div>
  );
}
