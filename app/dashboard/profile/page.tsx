"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, Modal, PageHeader, Badge, Input } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { onAuthChange, getUserData, updateUserProfile } from "@/lib/supabase-auth";
import { getAllCourses, getBranches } from "@/lib/queries";
import type { UserData, StudentProfile, Course, Branch } from "@/types";

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [courseName, setCourseName] = useState("");
  const [branchName, setBranchName] = useState("");
  const [courseSemesters, setCourseSemesters] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit states
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [savingName, setSavingName] = useState(false);

  // Avatar
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Semester modal
  const [showSemesterModal, setShowSemesterModal] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState("");
  const [savingSemester, setSavingSemester] = useState(false);

  // Course change modal
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedCourseSemesters, setSelectedCourseSemesters] = useState<number[]>([]);
  const [selectedNewSemester, setSelectedNewSemester] = useState("");
  const [savingCourse, setSavingCourse] = useState(false);
  const [showBranches, setShowBranches] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    const unsub = onAuthChange(async (user) => {
      if (!user) { router.replace("/auth"); return; }
      const data = await getUserData(user.id);
      if (!data) { router.replace("/auth"); return; }
      setUserData(data);
      setNameInput(data.name || "");

      if (data.role === "student") {
        const { data: profileRow } = await supabase.from("student_profiles").select("*").eq("uid", user.id).single();
        if (profileRow) {
          const p = profileRow as unknown as StudentProfile;
          setProfile(p);
          const { data: course } = await supabase.from("courses").select("*").eq("id", p.courseId).single();
          if (course) {
            setCourseName(course.name as string);
            setCourseSemesters(course.semesters as number[]);
          }
          if (p.branchId) {
            const { data: branch } = await supabase.from("branches").select("*").eq("id", p.branchId).single();
            if (branch) setBranchName(branch.name as string);
          }
        }
      }
      setLoading(false);
    });
    return unsub;
  }, [router]);

  // Name editing
  const handleSaveName = async () => {
    if (!userData || !nameInput.trim()) return;
    setSavingName(true);
    setError("");
    try {
      await updateUserProfile(userData.uid, { name: nameInput.trim() });
      setUserData({ ...userData, name: nameInput.trim() });
      setEditingName(false);
    } catch (err) {
      setError((err as { message?: string })?.message || "Failed to update name.");
    }
    setSavingName(false);
  };

  // Avatar upload
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userData) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError("Image must be under 2MB.");
      return;
    }

    setUploadingAvatar(true);
    setError("");
    try {
      const ext = file.name.split(".").pop();
      const fileName = `${userData.uid}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      await updateUserProfile(userData.uid, { avatarUrl });
      setUserData({ ...userData, avatarUrl });
    } catch (err) {
      setError((err as { message?: string })?.message || "Failed to upload avatar.");
    }
    setUploadingAvatar(false);
  };

  // Semester change
  const handleSemesterChange = async () => {
    if (!selectedSemester || !profile) return;
    setSavingSemester(true);
    setError("");
    try {
      const { error: updateError } = await supabase.from("student_profiles").update({ semesterId: Number(selectedSemester) }).eq("uid", profile.uid);
      if (updateError) throw updateError;
      setProfile({ ...profile, semesterId: Number(selectedSemester) });
      setShowSemesterModal(false);
    } catch (err) {
      setError((err as { message?: string })?.message || "Failed to update semester.");
    }
    setSavingSemester(false);
  };

  // Course change
  const handleOpenCourseModal = async () => {
    const allCourses = await getAllCourses();
    setCourses(allCourses);
    setSelectedCourse(profile?.courseId || "");
    setSelectedBranch(profile?.branchId || "");
    setShowCourseModal(true);
  };

  const handleCourseSelect = async (courseId: string) => {
    setSelectedCourse(courseId);
    setSelectedBranch("");
    setSelectedNewSemester("");
    const course = courses.find((c) => c.id === courseId);
    if (course) {
      setSelectedCourseSemesters(course.semesters);
      if (course.hasBranches) {
        const b = await getBranches(courseId);
        setBranches(b);
        setShowBranches(true);
      } else {
        setBranches([]);
        setShowBranches(false);
      }
    }
  };

  const handleSaveCourseChange = async () => {
    if (!selectedCourse || !selectedNewSemester || !profile) return;
    setSavingCourse(true);
    setError("");
    try {
      const updates: Record<string, unknown> = {
        courseId: selectedCourse,
        branchId: showBranches && selectedBranch ? selectedBranch : null,
        semesterId: Number(selectedNewSemester),
      };
      const { error: updateError } = await supabase.from("student_profiles").update(updates).eq("uid", profile.uid);
      if (updateError) throw updateError;

      setProfile({
        ...profile,
        courseId: selectedCourse,
        branchId: showBranches && selectedBranch ? selectedBranch : null,
        semesterId: Number(selectedNewSemester),
      });

      // Refresh course name
      const course = courses.find((c) => c.id === selectedCourse);
      if (course) {
        setCourseName(course.name);
        setCourseSemesters(course.semesters);
      }
      if (selectedBranch) {
        const b = branches.find((br) => br.id === selectedBranch);
        if (b) setBranchName(b.name);
      } else {
        setBranchName("");
      }

      setShowCourseModal(false);
    } catch (err) {
      setError((err as { message?: string })?.message || "Failed to update course.");
    }
    setSavingCourse(false);
  };

  if (loading) return <div className="flex items-center justify-center py-12"><div className="animate-spin h-6 w-6 border-2 border-text-tertiary border-t-accent rounded-full" /></div>;
  if (!userData) return null;

  const roleLabel = userData.role === "admin" ? "Admin" : userData.role === "faculty" ? "Faculty" : "Student";
  const initials = userData.name ? userData.name.charAt(0).toUpperCase() : userData.email.charAt(0).toUpperCase();

  return (
    <div className="max-w-2xl flex flex-col gap-6">
      <PageHeader title="Profile" icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>} />

      {/* Avatar + Name Header */}
      <div className="flex items-center gap-4 p-5 rounded-[var(--radius-lg)] border border-border bg-surface animate-slide-up">
        {/* Avatar */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="relative h-16 w-16 rounded-full flex-shrink-0 overflow-hidden group cursor-pointer"
          title="Change profile picture"
        >
          {userData.avatarUrl ? (
            <img src={userData.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-accent flex items-center justify-center shadow-lg shadow-accent/20">
              <span className="text-white text-xl font-bold">{initials}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {uploadingAvatar ? (
              <div className="animate-spin h-4 w-4 border-2 border-white/50 border-t-white rounded-full" />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
        </button>

        {/* Name + Email */}
        <div className="min-w-0 flex-1">
          {editingName ? (
            <div className="flex items-center gap-2">
              <input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="text-base font-semibold text-text-primary bg-input-bg border border-border rounded-[var(--radius-md)] px-2.5 py-1 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 w-full"
                autoFocus
                onKeyDown={(e) => { if (e.key === "Enter") handleSaveName(); if (e.key === "Escape") setEditingName(false); }}
              />
              <Button variant="primary" onClick={handleSaveName} loading={savingName} className="text-xs h-8 px-3">Save</Button>
              <Button variant="ghost" onClick={() => { setEditingName(false); setNameInput(userData.name || ""); }} className="text-xs h-8 px-2">Cancel</Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <p className="text-base font-semibold text-text-primary truncate">{userData.name || userData.email}</p>
              <button
                onClick={() => setEditingName(true)}
                className="p-1 rounded-[var(--radius-sm)] text-text-tertiary hover:text-accent hover:bg-accent-light/50 transition-all duration-200 cursor-pointer flex-shrink-0"
                title="Edit name"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
              </button>
            </div>
          )}
          <p className="text-xs text-text-secondary mt-0.5 truncate">{userData.email}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <Badge variant="accent">{roleLabel}</Badge>
            <span className="text-xs text-text-tertiary">Joined {new Date(userData.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Enrollment (Students only) */}
      {userData.role === "student" && profile && (
        <Card className="animate-slide-up" style={{ animationDelay: "0.05s" }}>
          <p className="text-xs text-text-tertiary uppercase tracking-wider font-semibold mb-4">Enrollment</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">Course</span>
              <div className="flex items-center gap-2">
                <span className="text-text-primary font-medium">{courseName}</span>
                <Button variant="ghost" onClick={handleOpenCourseModal} className="text-xs h-7 px-2">Change</Button>
              </div>
            </div>
            {branchName && (
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Branch</span>
                <span className="text-text-primary font-medium">{branchName}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">Current Semester</span>
              <div className="flex items-center gap-2">
                <span className="text-text-primary font-medium">Semester {profile.semesterId}</span>
                <Button variant="ghost" onClick={() => { setSelectedSemester(String(profile.semesterId)); setShowSemesterModal(true); }} className="text-xs h-7 px-2">Change</Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Faculty Status */}
      {userData.role === "faculty" && (
        <Card className="animate-slide-up" style={{ animationDelay: "0.05s" }}>
          <p className="text-xs text-text-tertiary uppercase tracking-wider font-semibold mb-3">Status</p>
          <div className="flex items-center gap-2">
            <div className={`h-2.5 w-2.5 rounded-full ${userData.approved ? "bg-success" : "bg-warning"}`} />
            <span className="text-sm text-text-primary font-medium">{userData.approved ? "Approved" : "Pending Approval"}</span>
          </div>
        </Card>
      )}

      {/* Admin Access */}
      {userData.role === "admin" && (
        <Card className="animate-slide-up" style={{ animationDelay: "0.05s" }}>
          <p className="text-xs text-text-tertiary uppercase tracking-wider font-semibold mb-3">Access</p>
          <p className="text-sm text-text-primary">Full administrative access</p>
        </Card>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Semester Modal */}
      <Modal isOpen={showSemesterModal} onClose={() => setShowSemesterModal(false)} title="Change Semester">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary">Select your current semester</label>
            <select value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value)}
              className="rounded-[var(--radius-md)] border border-border bg-input-bg px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/20">
              <option value="" disabled>Choose semester</option>
              {courseSemesters.map((s) => <option key={s} value={String(s)}>Semester {s}</option>)}
            </select>
          </div>
          <p className="text-xs text-text-tertiary">Changing your semester will update all content shown across the app.</p>
          <Button onClick={handleSemesterChange} loading={savingSemester} className="w-full">Save</Button>
        </div>
      </Modal>

      {/* Course Change Modal */}
      <Modal isOpen={showCourseModal} onClose={() => setShowCourseModal(false)} title="Change Course">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary">Course</label>
            <select value={selectedCourse} onChange={(e) => handleCourseSelect(e.target.value)}
              className="rounded-[var(--radius-md)] border border-border bg-input-bg px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/20">
              <option value="" disabled>Choose course</option>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
            </select>
          </div>
          {showBranches && branches.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-primary">Branch</label>
              <select value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)}
                className="rounded-[var(--radius-md)] border border-border bg-input-bg px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/20">
                <option value="" disabled>Choose branch</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name} ({b.code})</option>)}
              </select>
            </div>
          )}
          {selectedCourse && selectedCourseSemesters.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-text-primary">Semester</label>
              <select value={selectedNewSemester} onChange={(e) => setSelectedNewSemester(e.target.value)}
                className="rounded-[var(--radius-md)] border border-border bg-input-bg px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/20">
                <option value="" disabled>Choose semester</option>
                {selectedCourseSemesters.map((s) => <option key={s} value={String(s)}>Semester {s}</option>)}
              </select>
            </div>
          )}
          <p className="text-xs text-text-tertiary">Changing your course will update all content shown across the app.</p>
          <Button onClick={handleSaveCourseChange} loading={savingCourse} disabled={!selectedCourse || !selectedNewSemester} className="w-full">Save Changes</Button>
        </div>
      </Modal>
    </div>
  );
}
