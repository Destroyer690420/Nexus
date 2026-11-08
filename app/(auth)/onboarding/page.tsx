"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check } from "@phosphor-icons/react";
import { Button, ProgressBar, Stickie } from "@/components/ui";
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
  const [selectedSemester, setSelectedSemester] = useState<number | null>(null);

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const checkProfileAndLoad = async () => {
      const user = await getCurrentUser();
      if (!user) {
        router.replace("/auth");
        return;
      }

      // Check if student profile already exists
      const { data: profile } = await supabase
        .from("student_profiles")
        .select("uid")
        .eq("uid", user.id)
        .single();

      if (!active) return;
      if (profile) {
        router.replace("/dashboard");
        return;
      }

      // Load courses
      const { data: coursesData } = await supabase.from("courses").select("*");
      if (!active) return;
      setCourses((coursesData || []) as Course[]);
      setDataLoading(false);
    };

    checkProfileAndLoad();

    const unsub = onAuthChange(async (user) => {
      if (!user) {
        router.replace("/auth");
        return;
      }
      const { data: profile } = await supabase
        .from("student_profiles")
        .select("uid")
        .eq("uid", user.id)
        .single();

      if (!active) return;
      if (profile) {
        router.replace("/dashboard");
      }
    });

    return () => {
      active = false;
      unsub();
    };
  }, [router]);

  // Load branches when course changes
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
  const hasBranches = Boolean(selectedCourseData?.hasBranches);

  const handleCourseSelect = (courseId: string) => {
    setSelectedCourse(courseId);
    setSelectedBranch("");
    setSelectedSemester(null);
    const course = courses.find((c) => c.id === courseId);
    if (course?.hasBranches) {
      setCurrentStep(2);
    } else {
      setCurrentStep(3);
    }
  };

  const handleBranchSelect = (branchId: string) => {
    setSelectedBranch(branchId);
    setCurrentStep(3);
  };

  const handleSubmit = async () => {
    if (!selectedCourse || selectedSemester === null) return;
    if (hasBranches && !selectedBranch) return;

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
          branchId: hasBranches ? selectedBranch : null,
          semesterId: selectedSemester,
          createdAt: Date.now(),
        });
      if (dbError) throw dbError;
      router.replace("/dashboard");
    } catch (err) {
      setError(
        (err as { message?: string })?.message || "Failed to complete setup."
      );
      setLoading(false);
    }
  };

  if (dataLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Stickie mood="think" size={80} />
        <p className="font-display font-extrabold text-sm text-ink-3">
          Setting up your desk...
        </p>
      </div>
    );
  }

  // Calculate progress percent
  const progressPercent =
    currentStep === 1 ? 33 : currentStep === 2 ? 66 : 100;

  return (
    <div className="flex flex-col">
      {/* Top navigation / Step header */}
      <div className="flex items-center justify-between mb-2">
        {currentStep > 1 ? (
          <button
            type="button"
            onClick={() => {
              if (currentStep === 3 && !hasBranches) {
                setCurrentStep(1);
              } else if (currentStep === 3) {
                setCurrentStep(2);
              } else {
                setCurrentStep(1);
              }
            }}
            className="inline-flex items-center gap-1 text-xs font-bold text-ink-2 hover:text-ink transition-colors -ml-1 p-2 rounded-lg"
          >
            <ArrowLeft size={16} weight="bold" />
            <span>Back</span>
          </button>
        ) : (
          <div className="h-8" />
        )}
        <span className="text-[12px] font-display font-extrabold text-ink-3">
          Step {currentStep} of {hasBranches ? 3 : 2}
        </span>
      </div>

      <div className="mb-5">
        <ProgressBar progress={progressPercent} />
      </div>

      {error && (
        <div
          role="alert"
          className="mb-4 p-3 rounded-[16px] bg-crimson-tint border-2 border-crimson/20 text-crimson-deep text-xs font-semibold"
        >
          {error}
        </div>
      )}

      {/* Step 1: Choose Course */}
      {currentStep === 1 && (
        <div>
          <div className="text-center mb-5">
            <h1 className="font-display font-black text-2xl tracking-tight text-ink">
              Choose your program
            </h1>
            <p className="mt-1 text-xs font-semibold text-ink-2">
              Select your academic degree to tailor your study materials.
            </p>
          </div>

          <div className="flex flex-col gap-2.5 max-h-[360px] overflow-y-auto pr-1">
            {courses.map((course) => {
              const isSelected = selectedCourse === course.id;
              return (
                <button
                  key={course.id}
                  type="button"
                  onClick={() => handleCourseSelect(course.id)}
                  className={`w-full p-3.5 rounded-[18px] border-2 text-left transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? "border-berry bg-berry-tint/40 shadow-[0_3px_0_var(--color-berry)]"
                      : "border-line bg-surface hover:border-line-strong shadow-[0_3px_0_var(--line-strong)]"
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <h2 className="font-display font-black text-[15px] text-ink truncate">
                      {course.name}
                    </h2>
                    <p className="text-[11px] font-extrabold text-ink-3 uppercase mt-0.5">
                      {course.code} • {course.semesters.length} Semesters
                    </p>
                  </div>
                  <div className="w-8 h-8 rounded-[10px] bg-surface-sunken flex items-center justify-center shrink-0 text-ink-2">
                    <ArrowRight size={16} weight="bold" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 2: Choose Branch */}
      {currentStep === 2 && hasBranches && (
        <div>
          <div className="text-center mb-5">
            <h1 className="font-display font-black text-2xl tracking-tight text-ink">
              Select your branch
            </h1>
            <p className="mt-1 text-xs font-semibold text-ink-2">
              Which department are you in at {selectedCourseData?.name}?
            </p>
          </div>

          <div className="flex flex-col gap-2.5 max-h-[360px] overflow-y-auto pr-1">
            {branches.map((branch) => {
              const isSelected = selectedBranch === branch.id;
              return (
                <button
                  key={branch.id}
                  type="button"
                  onClick={() => handleBranchSelect(branch.id)}
                  className={`w-full p-3.5 rounded-[18px] border-2 text-left transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? "border-berry bg-berry-tint/40 shadow-[0_3px_0_var(--color-berry)]"
                      : "border-line bg-surface hover:border-line-strong shadow-[0_3px_0_var(--line-strong)]"
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <h2 className="font-display font-black text-[15px] text-ink truncate">
                      {branch.name}
                    </h2>
                    {branch.code && (
                      <p className="text-[11px] font-extrabold text-ink-3 uppercase mt-0.5">
                        {branch.code}
                      </p>
                    )}
                  </div>
                  <div className="w-8 h-8 rounded-[10px] bg-surface-sunken flex items-center justify-center shrink-0 text-ink-2">
                    <ArrowRight size={16} weight="bold" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 3: Choose Semester */}
      {currentStep === 3 && (
        <div>
          <div className="text-center mb-5">
            <h1 className="font-display font-black text-2xl tracking-tight text-ink">
              Current semester
            </h1>
            <p className="mt-1 text-xs font-semibold text-ink-2">
              Which semester are you attending right now?
            </p>
          </div>

          {/* Grid of semesters */}
          <div className="grid grid-cols-4 gap-2.5 mb-6">
            {(selectedCourseData?.semesters || [1, 2, 3, 4, 5, 6, 7, 8]).map((sem) => {
              const isSelected = selectedSemester === sem;
              return (
                <button
                  key={sem}
                  type="button"
                  onClick={() => setSelectedSemester(sem)}
                  className={`h-14 rounded-[16px] border-2 font-display font-black text-lg transition-all cursor-pointer flex flex-col items-center justify-center ${
                    isSelected
                      ? "border-berry bg-berry text-white shadow-[0_3px_0_var(--color-berry-deep)] scale-[1.02]"
                      : "border-line bg-surface text-ink hover:border-line-strong shadow-[0_3px_0_var(--line-strong)]"
                  }`}
                >
                  <span>{sem}</span>
                  <span className="text-[9px] uppercase font-bold tracking-tight opacity-80 -mt-1">
                    Sem
                  </span>
                </button>
              );
            })}
          </div>

          <div className="pt-2">
            <Button
              onClick={handleSubmit}
              disabled={selectedSemester === null}
              loading={loading}
              variant="primary"
              size="lg"
              fullWidth
            >
              <Check size={18} weight="bold" className="shrink-0" />
              Start exploring
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
