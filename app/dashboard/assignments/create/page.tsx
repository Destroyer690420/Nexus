"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { onAuthChange, getUserData } from "@/lib/supabase-auth";
import type { UserData } from "@/types";

interface Course { id: string; name: string; code: string; hasBranches: boolean; semesters: number[] }
interface Branch { id: string; name: string; code: string }
interface SubjectItem { id: string; name: string; code: string }

export default function CreateAssignmentPage() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const [courses, setCourses] = useState<Course[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [courseId, setCourseId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [semesterId, setSemesterId] = useState("");
  const [subject, setSubject] = useState("");
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [maxMarks, setMaxMarks] = useState("");
  const [allowLate, setAllowLate] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const unsub = onAuthChange(async (user) => {
      if (!user) { router.replace("/auth"); return; }
      const data = await getUserData(user.id);
      if (!data || (data.role !== "faculty" && data.role !== "admin")) {
        router.replace("/dashboard");
        return;
      }
      setUserData(data);
      const { data: courseData } = await supabase.from("courses").select("*");
      setCourses((courseData || []) as Course[]);
      setLoading(false);
    });
    return unsub;
  }, [router]);

  useEffect(() => {
    if (!courseId) { setBranches([]); setBranchId(""); return; }
    const course = courses.find((c) => c.id === courseId);
    if (!course?.hasBranches) { setBranches([]); setBranchId(""); return; }
    (async () => {
      const { data } = await supabase.from("branches").select("*").eq("courseId", courseId);
      setBranches((data || []) as Branch[]);
      setBranchId("");
    })();
  }, [courseId, courses]);

  useEffect(() => {
    if (!courseId || !semesterId) { setSubjects([]); setSubject(""); return; }
    const course = courses.find((c) => c.id === courseId);
    const branch = course?.hasBranches ? branchId : null;
    if (course?.hasBranches && !branchId) { setSubjects([]); setSubject(""); return; }
    (async () => {
      let query = supabase
        .from("subjects")
        .select("id, name, code")
        .eq("courseId", courseId)
        .eq("semesterId", Number(semesterId));
      if (branch) {
        query = query.eq("branchId", branch);
      } else {
        query = query.is("branchId", null);
      }
      const { data } = await query.order("name", { ascending: true });
      setSubjects((data || []) as SubjectItem[]);
      setSubject("");
    })();
  }, [courseId, branchId, semesterId, courses]);

  const selectedCourse = courses.find((c) => c.id === courseId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !courseId || !semesterId || !subject || !dueDate) {
      setError("Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Not authenticated");

      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description || "");
      formData.append("courseId", courseId);
      formData.append("branchId", branchId || "");
      formData.append("semesterId", String(semesterId));
      formData.append("subjectId", subject);
      formData.append("dueDate", String(new Date(dueDate).getTime()));
      if (maxMarks) formData.append("maxMarks", maxMarks);
      formData.append("allowLate", String(allowLate));
      if (file) formData.append("file", file);

      const res = await fetch("/api/assignments/create", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create assignment");
      }

      setSuccess("Assignment created successfully!");
      setTitle("");
      setDescription("");
      setDueDate("");
      setMaxMarks("");
      setSubject("");
      setFile(null);
    } catch (err) {
      setError((err as { message?: string })?.message || "Failed to create assignment.");
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-6 w-6 border-2 border-text-tertiary border-t-accent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight text-text-primary mb-1">
        Create Assignment
      </h1>
      <p className="text-sm text-text-secondary mb-8">
        Post a new assignment for students.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary">Course *</label>
            <select value={courseId} onChange={(e) => setCourseId(e.target.value)} required
              className="rounded-md border border-border bg-input-bg px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent">
              <option value="" disabled>Select course</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
              ))}
            </select>
          </div>

          {selectedCourse?.hasBranches && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-primary">Branch</label>
              <select value={branchId} onChange={(e) => setBranchId(e.target.value)}
                className="rounded-md border border-border bg-input-bg px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent">
                <option value="" disabled>Select branch</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary">Semester *</label>
            <select value={semesterId} onChange={(e) => setSemesterId(e.target.value)} required
              className="rounded-md border border-border bg-input-bg px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent">
              <option value="" disabled>Select semester</option>
              {selectedCourse?.semesters.map((s) => (
                <option key={s} value={String(s)}>Semester {s}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary">Due Date *</label>
            <input type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required
              className="rounded-md border border-border bg-input-bg px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent" />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-primary">Subject *</label>
          {subjects.length === 0 && courseId && semesterId ? (
            <p className="text-xs text-text-tertiary">
              No subjects added yet for this selection.
            </p>
          ) : (
            <select value={subject} onChange={(e) => setSubject(e.target.value)} required
              className="rounded-md border border-border bg-input-bg px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent">
              <option value="" disabled>Select subject</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.name}>{s.name} ({s.code})</option>
              ))}
            </select>
          )}
        </div>

        <Input label="Title *" value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Assignment 1 - Data Structures" required />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-primary">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="Instructions for this assignment..."
            rows={3}
            className="rounded-md border border-border bg-input-bg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-accent focus:ring-1 focus:ring-accent resize-none" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary">Max Marks</label>
            <input type="number" value={maxMarks} onChange={(e) => setMaxMarks(e.target.value)}
              placeholder="e.g. 100" min="0"
              className="rounded-md border border-border bg-input-bg px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary">File</label>
            <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="text-sm text-text-secondary file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:border-border file:text-sm file:bg-surface file:text-text-primary file:cursor-pointer hover:file:bg-surface-hover" />
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={allowLate} onChange={(e) => setAllowLate(e.target.checked)}
            className="rounded border-border text-accent focus:ring-accent" />
          <span className="text-sm text-text-secondary">Allow late submissions</span>
        </label>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {success && <p className="text-sm text-success">{success}</p>}

        <Button type="submit" loading={submitting} className="w-full h-11">
          Create Assignment
        </Button>
      </form>
    </div>
  );
}
