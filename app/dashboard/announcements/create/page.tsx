"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check } from "@phosphor-icons/react";
import {
  LargeTitleHeader,
  TextField,
  Textarea,
  SegmentedControl,
  Switch,
  Button,
  Stickie,
} from "@/components/ui";
import { onAuthChange, getUserData } from "@/lib/supabase-auth";
import { supabase } from "@/lib/supabase";

export default function CreateAnnouncementPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [targetRole, setTargetRole] = useState<"all" | "student" | "faculty">("all");
  const [pinned, setPinned] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let active = true;
    const unsub = onAuthChange(async (user) => {
      if (!user) {
        router.replace("/auth");
        return;
      }
      const data = await getUserData(user.id);
      if (!data || (data.role !== "admin" && data.role !== "faculty")) {
        router.replace("/dashboard");
        return;
      }
      if (active) setLoading(false);
    });
    return () => {
      active = false;
      unsub();
    };
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError("Please fill in both title and content.");
      return;
    }
    setSubmitting(true);
    setError("");
    setSuccess(false);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Not authenticated");

      const res = await fetch("/api/announcements/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          targetRole,
          pinned,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create announcement");
      }

      setSuccess(true);
      setTitle("");
      setContent("");
      setTargetRole("all");
      setPinned(false);
    } catch (err) {
      setError(
        (err as { message?: string })?.message || "Failed to create announcement."
      );
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="flex flex-col items-center gap-3 animate-pulse">
          <Stickie mood="think" size={80} />
          <p className="font-display font-extrabold text-sm text-ink-3">
            Checking permissions...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <LargeTitleHeader
        title="Post Notice"
        subtitle="Broadcast an official announcement to campus students and faculty"
        parentHref="/dashboard/announcements"
      />

      {success && (
        <div className="p-5 rounded-[22px] border-2 border-fern/30 bg-fern-tint text-center flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-fern text-white flex items-center justify-center">
            <Check size={22} weight="bold" />
          </div>
          <div>
            <h3 className="font-display font-black text-base text-ink">
              Announcement broadcast successfully!
            </h3>
            <p className="text-xs font-semibold text-ink-2 mt-0.5">
              It is now live on student and faculty feeds.
            </p>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Button
              variant="secondary"
              size="md"
              onClick={() => setSuccess(false)}
            >
              Post another notice
            </Button>
            <Link href="/dashboard/announcements">
              <Button variant="primary" size="md">
                View all announcements
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
        <TextField
          label="Notice Title"
          placeholder="e.g. End Semester Exam Guidelines 2026"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <Textarea
          label="Detailed Content"
          placeholder="Enter complete notice information, deadlines, and instructions..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={5}
          required
        />

        <div>
          <label className="block text-[13px] font-display font-extrabold text-ink mb-1.5">
            Target Audience
          </label>
          <SegmentedControl
            options={[
              { value: "all", label: "Everyone" },
              { value: "student", label: "Students only" },
              { value: "faculty", label: "Faculty only" },
            ]}
            value={targetRole}
            onChange={(val) =>
              setTargetRole(val as "all" | "student" | "faculty")
            }
          />
        </div>

        <div className="pt-2">
          <Switch
            checked={pinned}
            onChange={setPinned}
            label="Pin notice to the top"
            description="Pinned notices appear prominently at the top of the campus feed."
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
            Publish announcement
          </Button>
        </div>
      </form>
    </div>
  );
}
