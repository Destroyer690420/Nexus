"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, PageHeader, EmptyState, Badge } from "@/components/ui";
import { onAuthChange, getUserData } from "@/lib/supabase-auth";
import { getAnnouncements, deleteAnnouncement } from "@/lib/queries";
import type { UserData, Announcement } from "@/types";

export default function AnnouncementsPage() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthChange(async (user) => {
      if (!user) { router.replace("/auth"); return; }
      const data = await getUserData(user.id);
      if (!data) { router.replace("/auth"); return; }
      setUserData(data);
      const items = await getAnnouncements();
      setAnnouncements(items);
      setLoading(false);
    });
    return unsub;
  }, [router]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this announcement? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await deleteAnnouncement(id);
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      alert((err as { message?: string })?.message || "Failed to delete.");
    }
    setDeletingId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-6 w-6 border-2 border-text-tertiary border-t-accent rounded-full" />
      </div>
    );
  }

  const canManage = userData && (userData.role === "admin" || userData.role === "faculty");

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Announcements"
        subtitle="Important updates and notices."
        icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 11 18-5v12L3 13v-2z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>}
        action={
          canManage ? (
            <Button variant="primary" onClick={() => router.push("/dashboard/announcements/create")}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
              New
            </Button>
          ) : undefined
        }
      />

      {announcements.length === 0 ? (
        <EmptyState title="No announcements" description="No announcements have been posted yet." />
      ) : (
        <div className="flex flex-col gap-3">
          {announcements.map((a) => (
            <Card key={a.id} className="p-5">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {a.pinned && (
                      <Badge variant="warning" className="flex-shrink-0">Pinned</Badge>
                    )}
                    <p className="text-sm font-semibold text-text-primary">{a.title}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-text-tertiary">
                      {new Date(a.createdAt).toLocaleDateString()}
                    </p>
                    {a.targetRole !== "all" && (
                      <Badge variant="outline">
                        For: {a.targetRole.charAt(0).toUpperCase() + a.targetRole.slice(1)}s
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-text-secondary mt-2.5 whitespace-pre-wrap leading-relaxed">{a.content}</p>
                </div>
                {canManage && (
                  <button
                    onClick={() => handleDelete(a.id)}
                    disabled={deletingId === a.id}
                    className="flex-shrink-0 p-1.5 rounded-[var(--radius-sm)] text-text-tertiary hover:text-destructive hover:bg-destructive/10 transition-all duration-200 cursor-pointer disabled:opacity-50"
                    title="Delete announcement"
                  >
                    {deletingId === a.id ? (
                      <div className="animate-spin h-3.5 w-3.5 border-2 border-text-tertiary border-t-destructive rounded-full" />
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    )}
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
