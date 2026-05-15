"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Card } from "@/components/ui";
import { onAuthChange, getUserData } from "@/lib/supabase-auth";
import { getAnnouncements } from "@/lib/queries";
import type { UserData, Announcement } from "@/types";

export default function AnnouncementsPage() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-6 w-6 border-2 border-text-tertiary border-t-accent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
          Announcements
        </h1>
        {userData && (userData.role === "admin" || userData.role === "faculty") && (
          <Button variant="primary" onClick={() => router.push("/dashboard/announcements/create")}>
            New Announcement
          </Button>
        )}
      </div>
      <p className="text-sm text-text-secondary mb-8">
        Important updates and notices.
      </p>

      {announcements.length === 0 ? (
        <Card><p className="text-sm text-text-secondary">No announcements yet.</p></Card>
      ) : (
        <div className="flex flex-col gap-3">
          {announcements.map((a) => (
            <Card key={a.id} className="p-4">
              <div className="flex items-start gap-3">
                {a.pinned && (
                  <span className="rounded bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 flex-shrink-0 mt-0.5">
                    Pinned
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text-primary">{a.title}</p>
                  <p className="text-xs text-text-tertiary mt-1">
                    {new Date(a.createdAt).toLocaleDateString()}
                    {a.targetRole !== "all" && (
                      <span className="ml-2">
                        &middot; For: {a.targetRole.charAt(0).toUpperCase() + a.targetRole.slice(1)}s
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-text-secondary mt-2 whitespace-pre-wrap">{a.content}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
