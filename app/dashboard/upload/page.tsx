"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle,
} from "@phosphor-icons/react";
import {
  LargeTitleHeader,
  SegmentedControl,
  TextField,
  Textarea,
  Select,
  FilePicker,
  Button,
  Stickie,
} from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { onAuthChange, getUserData } from "@/lib/supabase-auth";
import { uploadFile } from "@/lib/upload";
import type { ResourceType } from "@/types";

interface Course {
  id: string;
  name: string;
  code: string;
  hasBranches: boolean;
  semesters: number[];
}

interface Branch {
  id: string;
  name: string;
  code: string;
}

interface SubjectItem {
  id: string;
  name: string;
  code: string;
}

export default function UploadPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<ResourceType>("notes");
  const [courses, setCourses] = useState<Course[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [courseId, setCourseId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [semesterId, setSemesterId] = useState("");
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [subject, setSubject] = useState("");
  const [unit, setUnit] = useState("");
  const [year, setYear] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 10 }, (_, i) => currentYear - i);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    const unsub = onAuthChange(async (user) => {
      if (!user) {
        router.replace("/auth");
        return;
      }
      const data = await getUserData(user.id);
      if (!data || (data.role !== "faculty" && data.role !== "admin")) {
        router.replace("/dashboard");
        return;
      }
      const { data: courseData } = await supabase.from("courses").select("*");
      if (active) {
        setCourses((courseData || []) as Course[]);
        setLoading(false);
      }
    });
    return () => {
      active = false;
      unsub();
    };
  }, [router]);

  useEffect(() => {
    if (!courseId) {
      setBranches([]);
      setBranchId("");
      return;
    }
    const course = courses.find((c) => c.id === courseId);
    if (!course?.hasBranches) {
      setBranches([]);
      setBranchId("");
      return;
    }
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("branches")
        .select("*")
        .eq("courseId", courseId);
      if (active) {
        setBranches((data || []) as Branch[]);
        setBranchId("");
      }
    })();
    return () => {
      active = false;
    };
  }, [courseId, courses]);

  useEffect(() => {
    if (!courseId || !semesterId) {
      setSubjects([]);
      setSubject("");
      return;
    }
    const course = courses.find((c) => c.id === courseId);
    const branch = course?.hasBranches ? branchId : null;
    if (course?.hasBranches && !branchId) {
      setSubjects([]);
      setSubject("");
      return;
    }
    let active = true;
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
      if (active) {
        const subs = (data || []) as SubjectItem[];
        setSubjects(subs);
        setSubject(subs.length > 0 ? subs[0].id : "");
      }
    })();
    return () => {
      active = false;
    };
  }, [courseId, branchId, semesterId, courses]);

  const selectedCourse = courses.find((c) => c.id === courseId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !courseId || !semesterId || !subject) {
      setError("Please fill in all required academic curriculum fields.");
      return;
    }
    if (type === "pyqs" && !year) {
      setError("Please select an exam year for PYQs.");
      return;
    }
    if (!file) {
      setError("Please select a file to upload.");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess(false);
    setUploadProgress(0);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Not authenticated");

      const result = await uploadFile(file, (pct) => setUploadProgress(pct));
      const fileId = result.fileId;
      const fileUrl = result.publicUrl ?? "";

      const res = await fetch("/api/resources/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type,
          title: title.trim(),
          description: description.trim(),
          courseId,
          branchId: branchId || "",
          semesterId: Number(semesterId),
          subjectId: subject,
          unit: unit || "",
          years: year ? [Number(year)] : [],
          tags,
          fileUrl,
          fileId,
        }),
      });

      if (!res.ok) {
        let errorMessage = "Failed to create resource";
        try {
          const err = await res.json();
          errorMessage = err.error || errorMessage;
        } catch {
          const text = await res.text();
          if (text) errorMessage = text;
        }
        throw new Error(errorMessage);
      }

      setSuccess(true);
      setTitle("");
      setDescription("");
      setTags("");
      setUnit("");
      setYear("");
      setFile(null);
      setUploadProgress(null);
    } catch (err) {
      setError((err as { message?: string })?.message || "Upload failed.");
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="flex flex-col items-center gap-3 animate-pulse">
          <Stickie mood="think" size={80} />
          <p className="font-display font-extrabold text-sm text-ink-3">
            Loading upload forms...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <LargeTitleHeader
        title="Upload Material"
        subtitle="Faculty & Administrator direct publication to students"
        parentHref="/dashboard"
      />

      {success && (
        <div className="p-5 rounded-[22px] border-2 border-fern/30 bg-fern-tint text-center flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-fern text-white flex items-center justify-center">
            <CheckCircle size={24} weight="fill" />
          </div>
          <div>
            <h3 className="font-display font-black text-base text-ink">
              Material published directly!
            </h3>
            <p className="text-xs font-semibold text-ink-2 mt-0.5">
              It is immediately available to enrolled students under the subject.
            </p>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Button
              variant="secondary"
              size="md"
              onClick={() => setSuccess(false)}
            >
              Upload more
            </Button>
            <Link href="/dashboard">
              <Button variant="primary" size="md">
                Go to dashboard
              </Button>
            </Link>
          </div>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="p-4 rounded-[16px] bg-crimson-tint border-2 border-crimson/20 text-crimson-deep text-xs font-semibold"
        >
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="p-6 rounded-[24px] border-2 border-line bg-surface shadow-[0_4px_0_var(--line-strong)] space-y-5"
      >
        <div>
          <label className="block text-[13px] font-display font-extrabold text-ink mb-1.5">
            Resource Type *
          </label>
          <SegmentedControl
            options={[
              { value: "notes", label: "Notes" },
              { value: "pyqs", label: "PYQs" },
              { value: "assignments", label: "Assignment" },
              { value: "lab_manuals", label: "Lab Manual" },
            ]}
            value={type}
            onChange={(val) => setType(val as ResourceType)}
          />
        </div>

        {/* Academic Cascading Pickers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Course / Program *"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            required
            options={[
              { value: "", label: "Select course..." },
              ...courses.map((c) => ({
                value: c.id,
                label: `${c.name} (${c.code})`,
              })),
            ]}
          />

          {selectedCourse?.hasBranches ? (
            <Select
              label="Branch *"
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              required
              options={[
                { value: "", label: "Select branch..." },
                ...branches.map((b) => ({
                  value: b.id,
                  label: `${b.name} (${b.code})`,
                })),
              ]}
            />
          ) : (
            <div className="hidden sm:block" />
          )}

          <Select
            label="Semester *"
            value={semesterId}
            onChange={(e) => setSemesterId(e.target.value)}
            required
            disabled={!courseId}
            options={[
              { value: "", label: "Select semester..." },
              ...(selectedCourse?.semesters || [1, 2, 3, 4, 5, 6, 7, 8]).map(
                (s) => ({
                  value: String(s),
                  label: `Semester ${s}`,
                })
              ),
            ]}
          />

          <Select
            label="Subject *"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            disabled={subjects.length === 0}
            options={[
              {
                value: "",
                label:
                  subjects.length === 0
                    ? "Select course & semester first"
                    : "Select subject...",
              },
              ...subjects.map((s) => ({
                value: s.id,
                label: `${s.name} (${s.code})`,
              })),
            ]}
          />
        </div>

        {/* Unit or Year selector */}
        {type === "notes" && (
          <Select
            label="Syllabus Unit"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            options={[
              { value: "", label: "General / Entire Course" },
              { value: "1", label: "Unit 1" },
              { value: "2", label: "Unit 2" },
              { value: "3", label: "Unit 3" },
              { value: "4", label: "Unit 4" },
              { value: "5", label: "Unit 5" },
            ]}
          />
        )}

        {type === "pyqs" && (
          <Select
            label="Exam Year *"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            required
            options={[
              { value: "", label: "Select year..." },
              ...yearOptions.map((y) => ({
                value: String(y),
                label: `Year ${y}`,
              })),
            ]}
          />
        )}

        <TextField
          label="Document Title *"
          placeholder="e.g. Experiment 4 - Dijkstra Algorithm Implementation"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <Textarea
          label="Description (Optional)"
          placeholder="Brief notes, submission deadline, or evaluation criteria..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />

        <TextField
          label="Tags (Optional)"
          placeholder="e.g. lab, solution, algorithms"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          helperText="Comma separated keywords"
        />

        <div className="pt-1">
          <FilePicker
            file={file}
            onFileSelect={setFile}
            progress={uploadProgress}
            label="Document File (Max 20 MB) *"
            disabled={submitting}
          />
        </div>

        <div className="pt-3">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={submitting}
          >
            Publish to students
          </Button>
        </div>
      </form>
    </div>
  );
}
