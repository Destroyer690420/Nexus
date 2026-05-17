"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { onAuthChange, getCurrentUser } from "@/lib/supabase-auth";

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

export default function OnboardingPage() {
  const router = useRouter();

  const [courses, setCourses] = useState<Course[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthChange(async (user) => {
      if (!user) {
        router.replace("/auth");
        return;
      }
      const { data } = await supabase.from("courses").select("*");
      setCourses((data || []) as Course[]);
      setDataLoading(false);
    });
    return unsub;
  }, [router]);

  useEffect(() => {
    if (!selectedCourse) {
      setBranches([]);
      setSelectedBranch("");
      return;
    }
    const course = courses.find((c) => c.id === selectedCourse);
    if (!course?.hasBranches) {
      setBranches([]);
      setSelectedBranch("");
      return;
    }
    const fetchBranches = async () => {
      const { data } = await supabase
        .from("branches")
        .select("*")
        .eq("courseId", selectedCourse);
      setBranches((data || []) as Branch[]);
      setSelectedBranch("");
    };
    fetchBranches();
  }, [selectedCourse, courses]);

  const selectedCourseData = courses.find((c) => c.id === selectedCourse);

  const handleSubmit = async () => {
    if (!selectedCourse || !selectedSemester) return;
    if (selectedCourseData?.hasBranches && !selectedBranch) return;

    setLoading(true);
    setError("");
    try {
      const user = await getCurrentUser();
      if (!user) {
        router.replace("/auth");
        return;
      }
      const { error: dbError } = await supabase
        .from("student_profiles")
        .upsert({
          uid: user.id,
          courseId: selectedCourse,
          branchId: selectedCourseData?.hasBranches ? selectedBranch : null,
          semesterId: Number(selectedSemester),
          createdAt: Date.now(),
        });
      if (dbError) throw dbError;
      router.replace("/dashboard");
    } catch (err) {
      setError(
        (err as { message?: string })?.message || "Something went wrong."
      );
      setLoading(false);
    }
  };

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-6 w-6 border-2 border-text-tertiary border-t-accent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
          Set up your profile
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Tell us about your course to personalize your feed
        </p>
      </div>

      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-primary">
            Course
          </label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="rounded-md border border-border bg-input-bg px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all duration-150"
          >
            <option value="" disabled>
              Select your course
            </option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.code})
              </option>
            ))}
          </select>
        </div>

        {selectedCourseData?.hasBranches && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary">
              Branch / Specialization
            </label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="rounded-md border border-border bg-input-bg px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all duration-150"
            >
              <option value="" disabled>
                Select your branch
              </option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {selectedCourse && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary">
              Current Semester
            </label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="rounded-md border border-border bg-input-bg px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all duration-150"
            >
              <option value="" disabled>
                Select your semester
              </option>
              {selectedCourseData?.semesters.map((s) => (
                <option key={s} value={String(s)}>
                  Semester {s}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button
        onClick={handleSubmit}
        loading={loading}
        disabled={!selectedCourse || !selectedSemester}
        className="w-full h-11"
      >
        Complete setup
      </Button>
    </div>
  );
}
