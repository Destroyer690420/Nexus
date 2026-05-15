"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@/components/ui";
import { onAuthChange, getUserData } from "@/lib/supabase-auth";
import { supabase } from "@/lib/supabase";
import type { UserData } from "@/types";

export default function CreateAnnouncementPage() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [targetRole, setTargetRole] = useState<"all" | "student" | "faculty">("all");
  const [pinned, setPinned] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const unsub = onAuthChange(async (user) => {
      if (!user) { router.replace("/auth"); return; }
      const data = await getUserData(user.id);
      if (!data || (data.role !== "admin" && data.role !== "faculty")) {
        router.replace("/dashboard");
        return;
      }
      setUserData(data);
      setLoading(false);
    });
    return unsub;
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) {
      setError("Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    setError("");
    setSuccess("");

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
          title,
          content,
          targetRole,
          pinned,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create announcement");
      }

      setSuccess("Announcement created!");
      setTitle("");
      setContent("");
      setTargetRole("all");
      setPinned(false);
    } catch (err) {
      setError((err as { message?: string })?.message || "Failed to create announcement.");
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
        New Announcement
      </h1>
      <p className="text-sm text-text-secondary mb-8">
        Post an announcement visible to targeted users.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Input label="Title *" value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Mid-term Schedule Update" required />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-text-primary">Content *</label>
          <textarea value={content} onChange={(e) => setContent(e.target.value)}
            placeholder="Write your announcement..."
            rows={6}
            className="rounded-md border border-border bg-white px-3 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-accent focus:ring-1 focus:ring-accent resize-none" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-text-primary">Target Audience</label>
            <select value={targetRole} onChange={(e) => setTargetRole(e.target.value as "all" | "student" | "faculty")}
              className="rounded-md border border-border bg-white px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent">
              <option value="all">Everyone</option>
              <option value="student">Students only</option>
              <option value="faculty">Faculty only</option>
            </select>
          </div>

          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)}
                className="rounded border-border text-accent focus:ring-accent" />
              <span className="text-sm text-text-secondary">Pin to top</span>
            </label>
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {success && <p className="text-sm text-success">{success}</p>}

        <Button type="submit" loading={submitting} className="w-full h-11">
          Post Announcement
        </Button>
      </form>
    </div>
  );
}
