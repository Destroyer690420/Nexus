"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { onAuthChange, getUserData } from "@/lib/supabase-auth";
import type { UserData } from "@/types";

interface Resource {
  id: string;
  title: string;
  description: string;
  subjectId: string;
  unit: number | null;
  fileUrl: string;
  tags: string[];
  createdBy: string;
  createdAt: number;
}

interface StudentProfile {
  courseId: string;
  branchId: string | null;
  semesterId: number;
}

export default function NotesPage() {
  const router = useRouter();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsub = onAuthChange(async (user) => {
      if (!user) { router.replace("/auth"); return; }
      const data = await getUserData(user.id);
      if (!data) { router.replace("/auth"); return; }

      if (data.role !== "student") {
        router.replace("/dashboard");
        return;
      }

      const { data: profile } = await supabase
        .from("student_profiles")
        .select("*")
        .eq("uid", user.id)
        .single();

      if (!profile) { router.replace("/onboarding"); return; }

      const p = profile as unknown as StudentProfile;
      let query = supabase
        .from("resources")
        .select("*")
        .eq("type", "notes")
        .eq("courseId", p.courseId)
        .eq("semesterId", p.semesterId)
        .order("createdAt", { ascending: false });

      if (p.branchId) {
        query = query.eq("branchId", p.branchId);
      }

      const { data: resourceData, error: fetchError } = await query;
      if (fetchError) {
        setError(fetchError.message);
      } else {
        setResources((resourceData || []) as unknown as Resource[]);
      }
      setLoading(false);
    });
    return unsub;
  }, [router]);

  const grouped = resources.reduce<Record<string, Resource[]>>((acc, r) => {
    const key = r.subjectId || "Uncategorized";
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-6 w-6 border-2 border-text-tertiary border-t-accent rounded-full" />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  const subjectCount = Object.keys(grouped).length;

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight text-text-primary mb-1">
        Notes
      </h1>
      <p className="text-sm text-text-secondary mb-8">
        {resources.length} note{resources.length !== 1 ? "s" : ""} available
        {subjectCount > 0 && ` across ${subjectCount} subject${subjectCount !== 1 ? "s" : ""}`}.
      </p>

      {resources.length === 0 ? (
        <Card>
          <p className="text-sm text-text-secondary">
            No notes available for your current course and semester yet.
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-8">
          {Object.entries(grouped).map(([subject, items]) => {
            const unitGroups = items.reduce<Record<string, Resource[]>>((acc, r) => {
              const key = r.unit ? `Unit ${r.unit}` : "General";
              if (!acc[key]) acc[key] = [];
              acc[key].push(r);
              return acc;
            }, {});

            return (
              <section key={subject}>
                <h2 className="text-base font-medium text-text-primary mb-3">
                  {subject}
                </h2>
                <div className="flex flex-col gap-2">
                  {Object.entries(unitGroups).map(([unitLabel, unitItems]) => (
                    <div key={unitLabel}>
                      <p className="text-xs text-text-tertiary mb-2 font-medium uppercase tracking-wide">
                        {unitLabel}
                      </p>
                      <div className="flex flex-col gap-2">
                        {unitItems.map((r) => (
                          <Card key={r.id} className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-text-primary">
                                  {r.title}
                                </p>
                                {r.description && (
                                  <p className="text-xs text-text-secondary mt-1 line-clamp-2">
                                    {r.description}
                                  </p>
                                )}
                                {r.tags && r.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 mt-2">
                                    {r.tags.map((tag) => (
                                      <span key={tag} className="rounded bg-surface px-2 py-0.5 text-xs text-text-tertiary">
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                              {r.fileUrl && (
                                <a
                                  href={r.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-shrink-0 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent-light transition-colors duration-150"
                                >
                                  Open
                                </a>
                              )}
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
