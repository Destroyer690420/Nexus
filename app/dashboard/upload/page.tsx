"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, PageHeader } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { onAuthChange, getUserData } from "@/lib/supabase-auth";
import type { UserData, ResourceType } from "@/types";

interface Course { id: string; name: string; code: string; hasBranches: boolean; semesters: number[] }
interface Branch { id: string; name: string; code: string }
interface SubjectItem { id: string; name: string; code: string }

const resourceTypes: { value: ResourceType; label: string }[] = [
  { value: "notes", label: "Notes" }, { value: "pyqs", label: "PYQs" }, { value: "assignments", label: "Assignments" },
  { value: "lab_manuals", label: "Lab Manuals" }, { value: "others", label: "Others" },
];

const selectClass = "rounded-[var(--radius-md)] border border-border bg-input-bg px-3.5 py-2.5 text-sm text-text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-200 w-full";

export default function UploadPage() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<ResourceType>("notes");
  const [courses, setCourses] = useState<Course[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [courseId, setCourseId] = useState(""); const [branchId, setBranchId] = useState("");
  const [semesterId, setSemesterId] = useState(""); const [subject, setSubject] = useState("");
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [unit, setUnit] = useState(""); const [title, setTitle] = useState("");
  const [description, setDescription] = useState(""); const [tags, setTags] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false); const [error, setError] = useState(""); const [success, setSuccess] = useState("");

  useEffect(() => {
    const unsub = onAuthChange(async (user) => {
      if (!user) { router.replace("/auth"); return; }
      const data = await getUserData(user.id);
      if (!data || (data.role !== "faculty" && data.role !== "admin")) { router.replace("/dashboard"); return; }
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
    (async () => { const { data } = await supabase.from("branches").select("*").eq("courseId", courseId); setBranches((data || []) as Branch[]); setBranchId(""); })();
  }, [courseId, courses]);

  useEffect(() => {
    if (!courseId || !semesterId) { setSubjects([]); setSubject(""); return; }
    const course = courses.find((c) => c.id === courseId);
    const branch = course?.hasBranches ? branchId : null;
    if (course?.hasBranches && !branchId) { setSubjects([]); setSubject(""); return; }
    (async () => {
      let query = supabase.from("subjects").select("id, name, code").eq("courseId", courseId).eq("semesterId", Number(semesterId));
      if (branch) { query = query.eq("branchId", branch); } else { query = query.is("branchId", null); }
      const { data } = await query.order("name", { ascending: true });
      setSubjects((data || []) as SubjectItem[]); setSubject("");
    })();
  }, [courseId, branchId, semesterId, courses]);

  const selectedCourse = courses.find((c) => c.id === courseId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !courseId || !semesterId || !subject) { setError("Please fill in all required fields."); return; }
    setSubmitting(true); setError(""); setSuccess("");
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Not authenticated");
      const formData = new FormData();
      formData.append("type", type); formData.append("title", title); formData.append("description", description || "");
      formData.append("courseId", courseId); formData.append("branchId", branchId || "");
      formData.append("semesterId", String(semesterId)); formData.append("subjectId", subject);
      formData.append("unit", unit || ""); formData.append("tags", tags);
      if (file) formData.append("file", file);
      const res = await fetch("/api/resources/create", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Upload failed"); }
      setSuccess(`${title} uploaded successfully!`);
      setTitle(""); setDescription(""); setTags(""); setSubject(""); setUnit(""); setSemesterId(""); setFile(null);
    } catch (err) { setError((err as { message?: string })?.message || "Upload failed."); }
    setSubmitting(false);
  };

  if (loading) return <div className="flex items-center justify-center py-12"><div className="animate-spin h-6 w-6 border-2 border-text-tertiary border-t-accent rounded-full" /></div>;

  return (
    <div className="max-w-2xl">
      <PageHeader title="Upload Resource" subtitle="Share study materials with students."
        icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>} />

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-primary">Resource Type</label>
          <select value={type} onChange={(e) => setType(e.target.value as ResourceType)} className={selectClass}>
            {resourceTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary">Course *</label>
            <select value={courseId} onChange={(e) => setCourseId(e.target.value)} required className={selectClass}>
              <option value="" disabled>Select course</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
            </select>
          </div>
          {selectedCourse?.hasBranches && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-primary">Branch</label>
              <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className={selectClass}>
                <option value="" disabled>Select branch</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary">Semester *</label>
            <select value={semesterId} onChange={(e) => setSemesterId(e.target.value)} required className={selectClass}>
              <option value="" disabled>Select semester</option>
              {selectedCourse?.semesters.map((s) => <option key={s} value={String(s)}>Semester {s}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary">Unit</label>
            <select value={unit} onChange={(e) => setUnit(e.target.value)} className={selectClass}>
              <option value="">None</option>
              {[1, 2, 3, 4].map((u) => <option key={u} value={String(u)}>Unit {u}</option>)}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-primary">Subject *</label>
          {subjects.length === 0 && courseId && semesterId ? (
            <p className="text-xs text-text-tertiary">No subjects added yet. Ask an admin to add subjects via Admin Panel → Courses.</p>
          ) : (
            <select value={subject} onChange={(e) => setSubject(e.target.value)} required className={selectClass}>
              <option value="" disabled>Select subject</option>
              {subjects.map((s) => <option key={s.id} value={s.name}>{s.name} ({s.code})</option>)}
            </select>
          )}
        </div>

        <Input label="Title *" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Unit 1 - Arrays and Linked Lists" required />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-primary">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of this resource..."
            rows={3} className="rounded-[var(--radius-md)] border border-border bg-input-bg px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 resize-none transition-all duration-200" />
        </div>

        <Input label="Tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="e.g. arrays, pointers, memory (comma separated)" />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-primary">File</label>
          <label className="flex items-center gap-3 cursor-pointer rounded-[var(--radius-md)] border border-dashed border-border hover:border-accent/30 hover:bg-accent-light/50 px-4 py-3 transition-all duration-200">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-tertiary"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            <span className="text-sm text-text-secondary">{file ? file.name : "Click to upload a file"}</span>
            <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="hidden" />
          </label>
        </div>

        {error && <div className="rounded-[var(--radius-md)] bg-destructive/10 border border-destructive/20 p-3"><p className="text-sm text-destructive">{error}</p></div>}
        {success && <div className="rounded-[var(--radius-md)] bg-success/10 border border-success/20 p-3"><p className="text-sm text-success">{success}</p></div>}

        <Button type="submit" loading={submitting} className="w-full h-11">Upload</Button>
      </form>
    </div>
  );
}
