"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Card } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { onAuthChange, getUserData } from "@/lib/supabase-auth";
import { uploadFile } from "@/lib/upload";
import type { UserData, ResourceType } from "@/types";

interface Course { id: string; name: string; code: string; hasBranches: boolean; semesters: number[] }
interface Branch { id: string; name: string; code: string }
interface SubjectItem { id: string; name: string; code: string }

const resourceTypes: { value: ResourceType; label: string }[] = [
  { value: "notes", label: "Notes" },
  { value: "pyqs", label: "PYQs" },
  { value: "assignments", label: "Assignments" },
  { value: "labManuals", label: "Lab Manuals" },
  { value: "others", label: "Others" },
];

export default function UploadPage() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const [type, setType] = useState<ResourceType>("notes");
  const [courses, setCourses] = useState<Course[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [courseId, setCourseId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [semesterId, setSemesterId] = useState("");
  const [subject, setSubject] = useState("");
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [unit, setUnit] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
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
    if (!title || !courseId || !semesterId || !subject) {
      setError("Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      let fileUrl = "";
      if (file) {
        const path = `resources/${userData?.uid}/${Date.now()}`;
        fileUrl = await uploadFile(file, path);
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Not authenticated");

      const res = await fetch("/api/resources/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type,
          title,
          description: description || "",
          courseId,
          branchId: branchId || null,
          semesterId: Number(semesterId),
          subjectId: subject,
          unit: unit ? Number(unit) : null,
          fileUrl,
          tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Upload failed");
      }

      setSuccess(`${title} uploaded successfully!`);
      setTitle("");
      setDescription("");
      setTags("");
      setSubject("");
      setUnit("");
      setSemesterId("");
      setFile(null);
    } catch (err) {
      setError((err as { message?: string })?.message || "Upload failed.");
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
        Upload Resource
      </h1>
      <p className="text-sm text-text-secondary mb-8">
        Share study materials with students.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-primary">Resource Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as ResourceType)}
            className="rounded-md border border-border bg-white px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent"
          >
            {resourceTypes.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary">Course *</label>
            <select value={courseId} onChange={(e) => setCourseId(e.target.value)} required
              className="rounded-md border border-border bg-white px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent">
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
                className="rounded-md border border-border bg-white px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent">
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
              className="rounded-md border border-border bg-white px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent">
              <option value="" disabled>Select semester</option>
              {selectedCourse?.semesters.map((s) => (
                <option key={s} value={String(s)}>Semester {s}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary">Unit</label>
            <select value={unit} onChange={(e) => setUnit(e.target.value)}
              className="rounded-md border border-border bg-white px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent">
              <option value="">None</option>
              {[1, 2, 3, 4].map((u) => (
                <option key={u} value={String(u)}>Unit {u}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-primary">Subject *</label>
          {subjects.length === 0 && courseId && semesterId ? (
            <p className="text-xs text-text-tertiary">
              No subjects added yet for this selection. Ask an admin to add subjects via the Admin Panel → Courses.
            </p>
          ) : (
            <select value={subject} onChange={(e) => setSubject(e.target.value)} required
              className="rounded-md border border-border bg-white px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent">
              <option value="" disabled>Select subject</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.name}>{s.name} ({s.code})</option>
              ))}
            </select>
          )}
        </div>

        <Input label="Title *" value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Unit 1 - Arrays and Linked Lists" required />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-primary">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of this resource..."
            rows={3}
            className="rounded-md border border-border bg-white px-3 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-accent focus:ring-1 focus:ring-accent resize-none" />
        </div>

        <Input label="Tags" value={tags} onChange={(e) => setTags(e.target.value)}
          placeholder="e.g. arrays, pointers, memory (comma separated)" />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-primary">File</label>
          <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="text-sm text-text-secondary file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:border-border file:text-sm file:bg-surface file:text-text-primary file:cursor-pointer hover:file:bg-surface-hover" />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {success && <p className="text-sm text-success">{success}</p>}

        <Button type="submit" loading={submitting} className="w-full h-11">
          Upload
        </Button>
      </form>
    </div>
  );
}
