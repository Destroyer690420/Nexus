"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Lock,
  PencilSimple,
  Check,
  X,
  SignOut,
} from "@phosphor-icons/react";
import {
  LargeTitleHeader,
  Button,
  Chip,
  Sheet,
  ConfirmSheet,
  SegmentedControl,
  Select,
  Stickie,
  Avatar,
} from "@/components/ui";
import { supabase } from "@/lib/supabase";
import {
  onAuthChange,
  getUserData,
  updateUserProfile,
  logout,
} from "@/lib/supabase-auth";
import { getAllCourses, getBranches } from "@/lib/queries";
import type { UserData, StudentProfile, Course, Branch } from "@/types";

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [courseName, setCourseName] = useState("");
  const [branchName, setBranchName] = useState("");
  const [loading, setLoading] = useState(true);

  // Name editing
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [savingName, setSavingName] = useState(false);

  // Avatar upload
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Academic modals
  const [showCourseSheet, setShowCourseSheet] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [savingCourse, setSavingCourse] = useState(false);

  // Theme preference
  const [themePref, setThemePref] = useState<"system" | "light" | "dark">("system");

  // Sign out confirmation
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    // Read theme preference
    const savedTheme = (localStorage.getItem("theme-preference") || "system") as "system" | "light" | "dark";
    setThemePref(savedTheme);

    let active = true;
    const unsub = onAuthChange(async (user) => {
      if (!user) {
        router.replace("/auth");
        return;
      }
      const data = await getUserData(user.id);
      if (!data || !active) return;
      setUserData(data);
      setNameInput(data.name || "");

      if (data.role === "student") {
        const { data: profileRow } = await supabase
          .from("student_profiles")
          .select("*")
          .eq("uid", user.id)
          .single();
        if (profileRow && active) {
          const p = profileRow as unknown as StudentProfile;
          setProfile(p);
          const { data: course } = await supabase
            .from("courses")
            .select("*")
            .eq("id", p.courseId)
            .single();
          if (course && active) {
            setCourseName(course.name as string);
          }
          if (p.branchId) {
            const { data: branch } = await supabase
              .from("branches")
              .select("*")
              .eq("id", p.branchId)
              .single();
            if (branch && active) setBranchName(branch.name as string);
          }
        }
      }
      if (active) setLoading(false);
    });

    return () => {
      active = false;
      unsub();
    };
  }, [router]);

  // Handle Theme Change
  const handleThemeChange = (theme: "system" | "light" | "dark") => {
    setThemePref(theme);
    localStorage.setItem("theme-preference", theme);
    const root = document.documentElement;
    if (theme === "system") {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (isDark) root.classList.add("dark");
      else root.classList.remove("dark");
    } else if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  };

  // Name editing
  const handleSaveName = async () => {
    if (!userData || !nameInput.trim()) return;
    setSavingName(true);
    setError("");
    try {
      await updateUserProfile(userData.uid, { name: nameInput.trim() });
      setUserData({ ...userData, name: nameInput.trim() });
      setEditingName(false);
      setSuccessMsg("Name updated successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setError((err as { message?: string })?.message || "Failed to update name.");
    }
    setSavingName(false);
  };

  // Resize image client-side to 256x256 before uploading
  const resizeImageTo256 = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const canvas = document.createElement("canvas");
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context not available"));
          return;
        }
        const min = Math.min(img.width, img.height);
        const sx = (img.width - min) / 2;
        const sy = (img.height - min) / 2;
        ctx.drawImage(img, sx, sy, min, min, 0, 0, 256, 256);
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Image compression failed"));
          },
          "image/jpeg",
          0.85
        );
      };
      img.onerror = reject;
      img.src = url;
    });
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userData) return;

    setUploadingAvatar(true);
    setError("");
    try {
      const resizedBlob = await resizeImageTo256(file);
      const fileName = `${userData.uid}/avatar.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, resizedBlob, {
          upsert: true,
          contentType: "image/jpeg",
        });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      await updateUserProfile(userData.uid, { avatarUrl });
      setUserData({ ...userData, avatarUrl });
      setSuccessMsg("Profile photo updated!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setError((err as { message?: string })?.message || "Failed to upload avatar.");
    }
    setUploadingAvatar(false);
  };

  // Academic Sheet
  const handleOpenCourseSheet = async () => {
    const allCourses = await getAllCourses();
    setCourses(allCourses);
    setSelectedCourse(profile?.courseId || "");
    setSelectedBranch(profile?.branchId || "");
    setSelectedSemester(String(profile?.semesterId || "1"));
    if (profile?.courseId) {
      const b = await getBranches(profile.courseId);
      setBranches(b);
    }
    setShowCourseSheet(true);
  };

  const handleCourseChange = async (newCourseId: string) => {
    setSelectedCourse(newCourseId);
    setSelectedBranch("");
    const course = courses.find((c) => c.id === newCourseId);
    if (course?.hasBranches) {
      const b = await getBranches(newCourseId);
      setBranches(b);
    } else {
      setBranches([]);
    }
  };

  const handleSaveAcademicChanges = async () => {
    if (!selectedCourse || !selectedSemester || !profile) return;
    setSavingCourse(true);
    setError("");
    try {
      const selectedCourseData = courses.find((c) => c.id === selectedCourse);
      const hasBranches = Boolean(selectedCourseData?.hasBranches);

      const updates = {
        courseId: selectedCourse,
        branchId: hasBranches && selectedBranch ? selectedBranch : null,
        semesterId: Number(selectedSemester),
      };

      const { error: updateError } = await supabase
        .from("student_profiles")
        .update(updates)
        .eq("uid", profile.uid);
      if (updateError) throw updateError;

      setProfile({
        ...profile,
        ...updates,
      });

      if (selectedCourseData) setCourseName(selectedCourseData.name);
      if (selectedBranch) {
        const b = branches.find((item) => item.id === selectedBranch);
        setBranchName(b?.name || "");
      } else {
        setBranchName("");
      }

      setShowCourseSheet(false);
      setSuccessMsg("Academic curriculum updated!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setError((err as { message?: string })?.message || "Failed to update academic profile.");
    }
    setSavingCourse(false);
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    await logout();
    router.replace("/auth");
  };

  if (loading || !userData) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="flex flex-col items-center gap-3 animate-pulse">
          <Stickie mood="think" size={80} />
          <p className="font-display font-extrabold text-sm text-ink-3">
            Loading profile...
          </p>
        </div>
      </div>
    );
  }

  const roleLabel =
    userData.role === "admin"
      ? "Administrator"
      : userData.role === "faculty"
        ? "Faculty Member"
        : "Student";

  const roleBadgeVariant: "neutral" | "tangerine" | "berry" =
    userData.role === "admin"
      ? "berry"
      : userData.role === "faculty"
        ? "tangerine"
        : "neutral";

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <LargeTitleHeader
        title="Profile & Settings"
        subtitle="Manage your identity, academic details, and preferences"
        parentHref="/dashboard"
      />

      {successMsg && (
        <div className="p-3.5 rounded-[16px] bg-fern-tint border-2 border-fern/30 text-fern-deep text-xs font-semibold flex items-center gap-2">
          <Check size={18} weight="bold" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="p-3.5 rounded-[16px] bg-crimson-tint border-2 border-crimson/20 text-crimson-deep text-xs font-semibold"
        >
          {error}
        </div>
      )}

      {/* ── AVATAR & NAME CARD ── */}
      <div className="p-6 rounded-[24px] border-2 border-line bg-surface shadow-[0_4px_0_var(--line-strong)] flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
        {/* Squircle Avatar with 28% radius and camera edit trigger */}
        <div className="relative group shrink-0">
          <Avatar
            name={userData.name || "Campus User"}
            src={userData.avatarUrl}
            size="xl"
            editable
            onEdit={() => fileInputRef.current?.click()}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
            className="hidden"
            aria-label="Upload profile photo"
          />
          {uploadingAvatar && (
            <p className="text-[11px] font-bold text-berry mt-1 animate-pulse">
              Uploading...
            </p>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          {/* Inline Name Editor */}
          {editingName ? (
            <div className="flex items-center gap-2 max-w-sm">
              <input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="text-base font-display font-black text-ink bg-surface-sunken border-2 border-line rounded-[12px] px-3 py-1.5 outline-none focus:border-berry w-full"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveName();
                  if (e.key === "Escape") setEditingName(false);
                }}
              />
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveName}
                loading={savingName}
              >
                <Check size={16} weight="bold" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditingName(false);
                  setNameInput(userData.name || "");
                }}
              >
                <X size={16} weight="bold" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h2 className="font-display font-black text-xl text-ink truncate">
                {userData.name || "Campus Student"}
              </h2>
              <button
                type="button"
                onClick={() => setEditingName(true)}
                className="w-7 h-7 rounded-[8px] flex items-center justify-center text-ink-3 hover:text-berry hover:bg-berry-tint transition-colors"
                title="Edit name"
                aria-label="Edit name"
              >
                <PencilSimple size={15} weight="bold" />
              </button>
            </div>
          )}

          {/* Readonly Email with Lock */}
          <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-semibold text-ink-3">
            <Lock size={14} weight="bold" />
            <span className="truncate">{userData.email}</span>
          </div>

          <div className="pt-1 flex items-center justify-center sm:justify-start gap-2">
            <Chip variant={roleBadgeVariant} className="text-xs font-black uppercase">
              {roleLabel}
            </Chip>
            <span className="text-[11px] font-semibold text-ink-3">
              Joined {new Date(userData.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* ── ACADEMIC ENROLLMENT (STUDENTS ONLY) ── */}
      {userData.role === "student" && profile && (
        <div className="p-6 rounded-[24px] border-2 border-line bg-surface shadow-[0_4px_0_var(--line-strong)] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-black text-sm uppercase tracking-wider text-ink">
              Academic Curriculum
            </h3>
            <Button
              variant="tonal"
              size="sm"
              onClick={handleOpenCourseSheet}
            >
              Change
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-[16px] bg-surface-sunken border border-line">
              <span className="text-[10px] font-black uppercase text-ink-3 block">
                Degree Program
              </span>
              <p className="font-display font-black text-sm text-ink truncate mt-0.5">
                {courseName || "B.Tech"}
              </p>
            </div>

            <div className="p-3.5 rounded-[16px] bg-surface-sunken border border-line">
              <span className="text-[10px] font-black uppercase text-ink-3 block">
                Department / Branch
              </span>
              <p className="font-display font-black text-sm text-ink truncate mt-0.5">
                {branchName || "General / Common"}
              </p>
            </div>

            <div className="p-3.5 rounded-[16px] bg-surface-sunken border border-line">
              <span className="text-[10px] font-black uppercase text-ink-3 block">
                Current Semester
              </span>
              <p className="font-display font-black text-sm text-ink mt-0.5">
                Semester {profile.semesterId}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── APPEARANCE PREFERENCE ── */}
      <div className="p-6 rounded-[24px] border-2 border-line bg-surface shadow-[0_4px_0_var(--line-strong)] space-y-3">
        <div>
          <h3 className="font-display font-black text-base text-ink">
            Appearance
          </h3>
          <p className="text-xs font-semibold text-ink-3 mt-0.5">
            Choose your preferred color theme for Nexus.
          </p>
        </div>

        <SegmentedControl
          options={[
            { value: "system", label: "System" },
            { value: "light", label: "Light" },
            { value: "dark", label: "Dark" },
          ]}
          value={themePref}
          onChange={(val) => handleThemeChange(val as "system" | "light" | "dark")}
        />
      </div>

      {/* ── SIGN OUT ── */}
      <div className="p-6 rounded-[24px] border-2 border-line bg-surface shadow-[0_4px_0_var(--line-strong)] flex items-center justify-between">
        <div>
          <h3 className="font-display font-black text-base text-ink">
            Account Session
          </h3>
          <p className="text-xs font-semibold text-ink-3 mt-0.5">
            Sign out of your account on this device.
          </p>
        </div>
        <Button
          variant="destructive"
          size="md"
          onClick={() => setShowSignOutConfirm(true)}
        >
          <SignOut size={18} weight="bold" />
          Sign out
        </Button>
      </div>

      {/* Course Change Sheet */}
      <Sheet
        open={showCourseSheet}
        onClose={() => setShowCourseSheet(false)}
        title="Update Academic Curriculum"
      >
        <div className="space-y-4 py-2">
          <Select
            label="Degree Program"
            value={selectedCourse}
            onChange={(e) => handleCourseChange(e.target.value)}
            options={courses.map((c) => ({
              value: c.id,
              label: `${c.name} (${c.code})`,
            }))}
          />

          {branches.length > 0 && (
            <Select
              label="Branch / Department"
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              options={[
                { value: "", label: "General" },
                ...branches.map((b) => ({
                  value: b.id,
                  label: `${b.name} (${b.code})`,
                })),
              ]}
            />
          )}

          <Select
            label="Current Semester"
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            options={[1, 2, 3, 4, 5, 6, 7, 8].map((s) => ({
              value: String(s),
              label: `Semester ${s}`,
            }))}
          />

          <div className="pt-2">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleSaveAcademicChanges}
              loading={savingCourse}
            >
              Save curriculum changes
            </Button>
          </div>
        </div>
      </Sheet>

      {/* Sign Out Confirmation Sheet */}
      <ConfirmSheet
        open={showSignOutConfirm}
        onClose={() => setShowSignOutConfirm(false)}
        onConfirm={handleSignOut}
        title="Sign Out"
        description="Are you sure you want to sign out of Nexus? You can sign back in anytime."
        confirmLabel="Sign out"
        destructive
        loading={signingOut}
      />
    </div>
  );
}
