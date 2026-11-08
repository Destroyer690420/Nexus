"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle } from "@phosphor-icons/react";
import {
  LargeTitleHeader,
  SegmentedControl,
  TextField,
  Textarea,
  Select,
  FilePicker,
  Button,
  Chip,
  Stickie,
} from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { onAuthChange, getUserData } from "@/lib/supabase-auth";
import { uploadFile } from "@/lib/upload";
import type { ResourceType, StudentProfile } from "@/types";

interface SubjectItem {
  id: string;
  name: string;
  code: string;
}

export default function ContributePage() {
  const router = useRouter();
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [courseInfo, setCourseInfo] = useState<{
    courseName: string;
    courseCode: string;
    branchName: string | null;
    semester: number;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<ResourceType>("notes");
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [subject, setSubject] = useState("");
  const [unit, setUnit] = useState("");
  const [year, setYear] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [duplicateNotice, setDuplicateNotice] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 8 }, (_, i) => currentYear - i);

  useEffect(() => {
    let active = true;
    const unsub = onAuthChange(async (user) => {
      if (!user) {
        router.replace("/auth");
        return;
      }
      const data = await getUserData(user.id);
      if (!data || data.role !== "student") {
        router.replace("/dashboard");
        return;
      }

      const { data: profile } = await supabase
        .from("student_profiles")
        .select("*")
        .eq("uid", user.id)
        .single();

      if (!profile) {
        router.replace("/onboarding");
        return;
      }
      const p = profile as unknown as StudentProfile;
      if (!active) return;
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

      if (courseData && active) {
        setCourseInfo({
          courseName: courseData.name,
          courseCode: courseData.code,
          branchName,
          semester: p.semesterId,
        });
      }

      if (active) setLoading(false);
    });
    return () => {
      active = false;
      unsub();
    };
  }, [router]);

  useEffect(() => {
    if (!studentProfile) return;
    let active = true;
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
      if (active) {
        const subs = (data || []) as SubjectItem[];
        setSubjects(subs);
        if (subs.length > 0 && !subject) {
          setSubject(subs[0].id);
        }
      }
    };
    loadSubjects();
    return () => {
      active = false;
    };
  }, [studentProfile, subject]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setDuplicateNotice(false);

    if (!title.trim()) {
      setError("Please enter a title for your document.");
      return;
    }
    if (!subject) {
      setError("Please choose a subject.");
      return;
    }
    if (type === "notes" && !unit) {
      setError("Please select a syllabus unit.");
      return;
    }
    if (type === "pyqs" && !year) {
      setError("Please choose the exam year for this question paper.");
      return;
    }
    if (!file) {
      setError("Please select a file to upload (max 20 MB).");
      return;
    }

    setSubmitting(true);
    setUploadProgress(0);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Not authenticated");

      const result = await uploadFile(file, (pct) => setUploadProgress(pct));
      const fileId = result.fileId;
      const fileUrl = result.publicUrl ?? "";

      const res = await fetch("/api/contributions/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type,
          title: title.trim(),
          description: description.trim(),
          courseId: studentProfile!.courseId,
          branchId: studentProfile!.branchId || "",
          semesterId: studentProfile!.semesterId,
          subjectId: subject,
          unit: unit || "",
          years: year ? [Number(year)] : [],
          tags,
          fileUrl,
          fileId,
        }),
      });

      if (!res.ok) {
        let errorMessage = "Upload failed";
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
      const msg = (err as { message?: string })?.message || "Upload failed.";
      if (msg.toLowerCase().includes("duplicate") || msg.toLowerCase().includes("already exists")) {
        setDuplicateNotice(true);
      }
      setError(msg);
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="flex flex-col items-center gap-3 animate-pulse">
          <Stickie mood="think" size={80} />
          <p className="font-display font-extrabold text-sm text-ink-3">
            Preparing contribution form...
          </p>
        </div>
      </div>
    );
  }

  // Celebratory Success State
  if (success) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-center flex flex-col items-center gap-5">
        <Stickie mood="cheer" size={130} />
        <div className="space-y-1.5">
          <h1 className="font-display font-black text-2xl md:text-3xl text-ink">
            Thank you for contributing! 🎉
          </h1>
          <p className="text-sm font-semibold text-ink-2 max-w-sm mx-auto">
            Your study material has been submitted to the campus approval queue. Once verified by staff, all students can access it.
          </p>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center gap-3 w-full max-w-xs">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={() => setSuccess(false)}
          >
            Upload another file
          </Button>
          <Link href="/dashboard/my-contributions" className="w-full">
            <Button variant="secondary" size="lg" fullWidth>
              My contributions
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <LargeTitleHeader
          title="Contribute Study Material"
          subtitle="Share notes, PYQs, and lab manuals with classmates"
          parentHref="/dashboard"
          className="mb-0"
        />
      </div>

      {/* Navigation pill between New and My contributions */}
      <div className="flex items-center justify-between bg-surface-sunken p-1.5 rounded-[16px] border border-line">
        <span className="px-4 py-1.5 rounded-[12px] bg-berry text-white font-display font-black text-xs shadow-sm">
          New Contribution
        </span>
        <Link
          href="/dashboard/my-contributions"
          className="px-4 py-1.5 rounded-[12px] text-ink-2 hover:text-ink font-display font-extrabold text-xs transition-colors"
        >
          My Contributions →
        </Link>
      </div>

      {courseInfo && (
        <div className="p-4 rounded-[20px] border-2 border-line bg-surface shadow-[0_2px_0_var(--line-strong)] flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase text-ink-3 tracking-wider">
              Target Curriculum
            </p>
            <p className="font-display font-black text-sm text-ink truncate mt-0.5">
              {courseInfo.courseName} ({courseInfo.courseCode})
              {courseInfo.branchName ? ` • ${courseInfo.branchName}` : ""}
              {` • Sem ${courseInfo.semester}`}
            </p>
          </div>
          <Chip variant="neutral" className="text-[11px] font-bold">
            Semester {courseInfo.semester}
          </Chip>
        </div>
      )}

      {duplicateNotice && (
        <div className="p-4 rounded-[18px] bg-sun-tint border-2 border-sun/30 text-sun-deep text-xs font-semibold flex items-start gap-2.5">
          <CheckCircle size={18} weight="fill" className="shrink-0 mt-0.5" />
          <span>
            This file already exists in the campus library! Your contribution has been linked to the existing record.
          </span>
        </div>
      )}

      {error && !duplicateNotice && (
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
        {/* Step 1: Type SegmentedControl (NO Assignments) */}
        <div>
          <label className="block text-[13px] font-display font-extrabold text-ink mb-1.5">
            Resource Type *
          </label>
          <SegmentedControl
            options={[
              { value: "notes", label: "Notes" },
              { value: "pyqs", label: "PYQs" },
              { value: "lab_manuals", label: "Lab Manual" },
            ]}
            value={type}
            onChange={(val) => setType(val as ResourceType)}
          />
        </div>

        {/* Step 2: Subject & Unit/Year */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Subject *"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            options={subjects.map((s) => ({
              value: s.id,
              label: `${s.name} (${s.code})`,
            }))}
          />

          {type === "notes" && (
            <Select
              label="Syllabus Unit *"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              required
              options={[
                { value: "1", label: "Unit 1" },
                { value: "2", label: "Unit 2" },
                { value: "3", label: "Unit 3" },
                { value: "4", label: "Unit 4" },
                { value: "5", label: "Unit 5" },
                { value: "0", label: "General / Entire Syllabus" },
              ]}
            />
          )}

          {type === "pyqs" && (
            <Select
              label="Exam Year *"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              required
              options={yearOptions.map((y) => ({
                value: String(y),
                label: `Year ${y}`,
              }))}
            />
          )}
        </div>

        {/* Step 3: Title & Description */}
        <TextField
          label="Document Title *"
          placeholder="e.g. Unit 3 Complete Handwritten Notes"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <Textarea
          label="Optional Description"
          placeholder="Add details, author, teacher name, or special instructions..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />

        <TextField
          label="Tags (Optional)"
          placeholder="e.g. handwritten, midsem, formula-sheet"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          helperText="Comma separated keywords"
        />

        {/* Step 4: File Dropzone */}
        <div className="pt-1">
          <FilePicker
            file={file}
            onFileSelect={setFile}
            progress={uploadProgress}
            label="Select Document *"
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
            Submit for review
          </Button>
        </div>
      </form>
    </div>
  );
}
