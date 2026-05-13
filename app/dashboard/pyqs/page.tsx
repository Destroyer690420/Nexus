"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { onAuthChange, getUserData } from "@/lib/supabase-auth";

interface Resource {
  id: string;
  title: string;
  description: string;
  subjectId: string;
  unit: number | null;
  fileUrl: string;
  tags: string[];
  createdAt: number;
}

export default function PYQsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthChange(async (user) => {
      if (!user) { router.replace("/auth"); return; }
      const data = await getUserData(user.id);
      if (!data || data.role !== "student") { router.replace("/dashboard"); return; }

      const { data: profile } = await supabase
        .from("student_profiles").select("*").eq("uid", user.id).single();
      if (!profile) { router.replace("/onboarding"); return; }

      let query = supabase
        .from("resources").select("*")
        .eq("type", "pyqs")
        .eq("courseId", (profile as { courseId: string }).courseId)
        .eq("semesterId", (profile as { semesterId: number }).semesterId)
        .order("createdAt", { ascending: false });

      const p = profile as { branchId: string | null };
      if (p.branchId) query = query.eq("branchId", p.branchId);

      const { data: resourceData } = await query;
      setItems((resourceData || []) as Resource[]);
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
      <h1 className="text-2xl font-semibold tracking-tight text-text-primary mb-1">
        Previous Year Questions
      </h1>
      <p className="text-sm text-text-secondary mb-8">
        {items.length} PYQ{items.length !== 1 ? "s" : ""} available.
      </p>

      {items.length === 0 ? (
        <Card><p className="text-sm text-text-secondary">No PYQs available for your current course and semester yet.</p></Card>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((r) => (
            <Card key={r.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {r.subjectId && (
                      <span className="rounded bg-accent-light px-2 py-0.5 text-xs font-medium text-accent">{r.subjectId}</span>
                    )}
                    {r.unit && <span className="text-xs text-text-tertiary">Unit {r.unit}</span>}
                  </div>
                  <p className="text-sm font-medium text-text-primary mt-1">{r.title}</p>
                  {r.description && <p className="text-xs text-text-secondary mt-1">{r.description}</p>}
                  {r.tags && r.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {r.tags.map((tag) => (
                        <span key={tag} className="rounded bg-surface px-2 py-0.5 text-xs text-text-tertiary">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
                {r.fileUrl && (
                  <a href={r.fileUrl} target="_blank" rel="noopener noreferrer"
                    className="flex-shrink-0 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent-light transition-colors duration-150">
                    Open
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
