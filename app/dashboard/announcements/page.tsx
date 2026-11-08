"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  PushPin,
  Trash,
  PlusCircle,
} from "@phosphor-icons/react";
import {
  LargeTitleHeader,
  Button,
  Chip,
  Stickie,
  ConfirmSheet,
} from "@/components/ui";
import { onAuthChange, getUserData } from "@/lib/supabase-auth";
import { getAnnouncements, deleteAnnouncement } from "@/lib/queries";
import type { UserData, Announcement } from "@/types";

export default function AnnouncementsPage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [targetDeleteId, setTargetDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let active = true;
    const unsub = onAuthChange(async (user) => {
      if (!user) return;
      const data = await getUserData(user.id);
      if (!data || !active) return;
      setUserData(data);
      const items = await getAnnouncements();
      if (active) {
        setAnnouncements(items);
        setLoading(false);
      }
    });
    return () => {
      active = false;
      unsub();
    };
  }, []);

  const canManage =
    userData && (userData.role === "admin" || userData.role === "faculty");

  // Partition into pinned and regular
  const { pinned, regular } = useMemo(() => {
    const p: Announcement[] = [];
    const r: Announcement[] = [];
    announcements.forEach((a) => {
      if (a.pinned) p.push(a);
      else r.push(a);
    });
    return { pinned: p, regular: r };
  }, [announcements]);

  const handleConfirmDelete = async () => {
    if (!targetDeleteId) return;
    setDeleting(true);
    try {
      await deleteAnnouncement(targetDeleteId);
      setAnnouncements((prev) => prev.filter((a) => a.id !== targetDeleteId));
      setTargetDeleteId(null);
    } catch (err) {
      alert((err as { message?: string })?.message || "Failed to delete.");
    }
    setDeleting(false);
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="flex flex-col items-center gap-3 animate-pulse">
          <Stickie mood="think" size={80} />
          <p className="font-display font-extrabold text-sm text-ink-3">
            Loading announcements...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <LargeTitleHeader
        title="Announcements"
        subtitle="Official campus notices, exam schedules, and department updates"
        parentHref="/dashboard"
        action={
          canManage ? (
            <Link href="/dashboard/announcements/create">
              <Button variant="primary" size="md">
                <PlusCircle size={18} weight="bold" />
                Post notice
              </Button>
            </Link>
          ) : undefined
        }
      />

      {announcements.length === 0 ? (
        <div className="p-8 rounded-[24px] border-2 border-line bg-surface text-center flex flex-col items-center gap-4">
          <Stickie mood="think" size={110} />
          <div className="space-y-1">
            <h3 className="font-display font-black text-lg text-ink">
              No notices right now
            </h3>
            <p className="text-xs font-semibold text-ink-3 max-w-xs mx-auto">
              Campus updates and official department broadcasts will appear here.
            </p>
          </div>
          {canManage && (
            <Link href="/dashboard/announcements/create">
              <Button variant="primary" size="md">
                <PlusCircle size={18} weight="bold" />
                Post first announcement
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Pinned Announcements */}
          {pinned.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-display font-black text-xs uppercase tracking-wider text-berry flex items-center gap-1.5 px-1">
                <PushPin size={14} weight="fill" />
                <span>Pinned Notices</span>
              </h2>

              <div className="space-y-3">
                {pinned.map((a) => (
                  <div
                    key={a.id}
                    className="p-5 rounded-[22px] border-2 border-berry/40 bg-berry-tint/30 shadow-[0_3px_0_var(--color-berry-deep)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <Chip variant="berry" className="text-[10px] font-black uppercase py-0.5">
                            Pinned
                          </Chip>
                          {a.targetRole && a.targetRole !== "all" && (
                            <Chip variant="neutral" className="text-[10px] uppercase font-bold">
                              For {a.targetRole}s
                            </Chip>
                          )}
                          <span className="text-xs font-semibold text-ink-3">
                            {new Date(a.createdAt).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        <h3 className="font-display font-black text-base text-ink">
                          {a.title}
                        </h3>
                        <p className="mt-2 text-xs md:text-sm text-ink-2 whitespace-pre-wrap leading-relaxed">
                          {a.content}
                        </p>
                      </div>

                      {canManage && (
                        <button
                          type="button"
                          onClick={() => setTargetDeleteId(a.id)}
                          className="w-8 h-8 rounded-[10px] flex items-center justify-center text-ink-3 hover:text-crimson hover:bg-crimson-tint transition-colors shrink-0"
                          title="Delete notice"
                          aria-label="Delete notice"
                        >
                          <Trash size={16} weight="bold" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Regular Announcements */}
          {regular.length > 0 && (
            <div className="space-y-3">
              {pinned.length > 0 && (
                <h2 className="font-display font-black text-xs uppercase tracking-wider text-ink-3 px-1">
                  Recent Broadcasts
                </h2>
              )}

              <div className="space-y-3">
                {regular.map((a) => (
                  <div
                    key={a.id}
                    className="p-5 rounded-[22px] border-2 border-line bg-surface shadow-[0_3px_0_var(--line-strong)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <Chip variant="neutral" className="text-[10px] uppercase font-bold">
                            {a.targetRole === "all" ? "Campus Wide" : `For ${a.targetRole}s`}
                          </Chip>
                          <span className="text-xs font-semibold text-ink-3">
                            {new Date(a.createdAt).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        <h3 className="font-display font-black text-base text-ink">
                          {a.title}
                        </h3>
                        <p className="mt-2 text-xs md:text-sm text-ink-2 whitespace-pre-wrap leading-relaxed">
                          {a.content}
                        </p>
                      </div>

                      {canManage && (
                        <button
                          type="button"
                          onClick={() => setTargetDeleteId(a.id)}
                          className="w-8 h-8 rounded-[10px] flex items-center justify-center text-ink-3 hover:text-crimson hover:bg-crimson-tint transition-colors shrink-0"
                          title="Delete notice"
                          aria-label="Delete notice"
                        >
                          <Trash size={16} weight="bold" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Sheet */}
      <ConfirmSheet
        open={Boolean(targetDeleteId)}
        onClose={() => setTargetDeleteId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Announcement"
        description="Are you sure you want to remove this announcement? It will be removed for all campus students and faculty."
        confirmLabel="Delete notice"
        loading={deleting}
      />
    </div>
  );
}
