"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, Modal, Input } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { onAuthChange, getUserData } from "@/lib/supabase-auth";
import type { UserData } from "@/types";

interface StudentProfile {
  uid: string;
  courseId: string;
  branchId: string | null;
  semesterId: number;
  createdAt: number;
}

export default function ProfilePage() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [courseName, setCourseName] = useState("");
  const [branchName, setBranchName] = useState("");
  const [courseSemesters, setCourseSemesters] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSemesterModal, setShowSemesterModal] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsub = onAuthChange(async (user) => {
      if (!user) {
        router.replace("/auth");
        return;
      }
      const data = await getUserData(user.id);
      if (!data) {
        router.replace("/auth");
        return;
      }
      setUserData(data);

      if (data.role === "student") {
        const { data: profileRow } = await supabase
          .from("student_profiles")
          .select("*")
          .eq("uid", user.id)
          .single();

        if (profileRow) {
          const p = profileRow as unknown as StudentProfile;
          setProfile(p);

          const { data: course } = await supabase
            .from("courses")
            .select("*")
            .eq("id", p.courseId)
            .single();
          if (course) {
            setCourseName(course.name as string);
            setCourseSemesters(course.semesters as number[]);
          }

          if (p.branchId) {
            const { data: branch } = await supabase
              .from("branches")
              .select("*")
              .eq("id", p.branchId)
              .single();
            if (branch) setBranchName(branch.name as string);
          }
        }
      }
      setLoading(false);
    });
    return unsub;
  }, [router]);

  const handleSemesterChange = async () => {
    if (!selectedSemester || !profile) return;
    setSaving(true);
    setError("");
    try {
      const { error: updateError } = await supabase
        .from("student_profiles")
        .update({ semesterId: Number(selectedSemester) })
        .eq("uid", profile.uid);

      if (updateError) throw updateError;
      setProfile({ ...profile, semesterId: Number(selectedSemester) });
      setShowSemesterModal(false);
    } catch (err) {
      setError((err as { message?: string })?.message || "Failed to update semester.");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-6 w-6 border-2 border-text-tertiary border-t-accent rounded-full" />
      </div>
    );
  }

  if (!userData) return null;

  const roleLabel =
    userData.role === "admin"
      ? "Admin"
      : userData.role === "faculty"
        ? "Faculty"
        : "Student";

  return (
    <div className="max-w-2xl flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
          Profile
        </h1>
      </div>

      <Card className="divide-y divide-border">
        <div className="pb-4">
          <p className="text-xs text-text-tertiary uppercase tracking-wide font-medium">
            Account
          </p>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-sm text-text-primary">{userData.email}</p>
            <span className="rounded bg-accent-light px-2.5 py-0.5 text-xs font-medium text-accent">
              {roleLabel}
            </span>
          </div>
          <p className="mt-1 text-xs text-text-tertiary">
            Joined {new Date(userData.createdAt).toLocaleDateString()}
          </p>
        </div>

        {userData.role === "student" && profile && (
          <div className="pt-4">
            <p className="text-xs text-text-tertiary uppercase tracking-wide font-medium">
              Enrollment
            </p>
            <div className="mt-3 space-y-2.5">
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Course</span>
                <span className="text-text-primary font-medium">
                  {courseName}
                </span>
              </div>
              {branchName && (
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Branch</span>
                  <span className="text-text-primary font-medium">
                    {branchName}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">Current Semester</span>
                <div className="flex items-center gap-2">
                  <span className="text-text-primary font-medium">
                    Semester {profile.semesterId}
                  </span>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setSelectedSemester(String(profile.semesterId));
                      setShowSemesterModal(true);
                    }}
                  >
                    Change
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {userData.role === "faculty" && (
          <div className="pt-4">
            <p className="text-xs text-text-tertiary uppercase tracking-wide font-medium">
              Status
            </p>
            <div className="mt-3 flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${
                  userData.approved ? "bg-success" : "bg-warning"
                }`}
              />
              <span className="text-sm text-text-primary">
                {userData.approved ? "Approved" : "Pending Approval"}
              </span>
            </div>
          </div>
        )}

        {userData.role === "admin" && (
          <div className="pt-4">
            <p className="text-xs text-text-tertiary uppercase tracking-wide font-medium">
              Access
            </p>
            <p className="mt-1 text-sm text-text-primary">
              Full administrative access
            </p>
          </div>
        )}
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Modal
        isOpen={showSemesterModal}
        onClose={() => setShowSemesterModal(false)}
        title="Change Semester"
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary">
              Select your current semester
            </label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="rounded-md border border-border bg-white px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            >
              <option value="" disabled>
                Choose semester
              </option>
              {courseSemesters.map((s) => (
                <option key={s} value={String(s)}>
                  Semester {s}
                </option>
              ))}
            </select>
          </div>
          <Button onClick={handleSemesterChange} loading={saving} className="w-full">
            Save
          </Button>
        </div>
      </Modal>
    </div>
  );
}
