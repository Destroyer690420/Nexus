"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui";

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams.get("q") || "";
  const [results, setResults] = useState<{
    resources: { id: string; title: string; type: string; description?: string }[];
    assignments: { id: string; title: string; description?: string; dueDate?: number }[];
    subjects: { id: string; name: string; code: string }[];
    announcements: { id: string; title: string; content: string }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!q) { setLoading(false); return; }
    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(q)}`)
      .then((res) => res.json())
      .then((data) => { setResults(data); setLoading(false); })
      .catch(() => { setLoading(false); });
  }, [q]);

  if (!q) {
    return (
      <div className="max-w-3xl">
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary mb-1">Search</h1>
        <p className="text-sm text-text-secondary">Enter a search term to find resources, assignments, and more.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-6 w-6 border-2 border-text-tertiary border-t-accent rounded-full" />
      </div>
    );
  }

  const total = results
    ? results.resources.length + results.assignments.length + results.subjects.length + results.announcements.length
    : 0;

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight text-text-primary mb-1">
        Search Results
      </h1>
      <p className="text-sm text-text-secondary mb-8">
        {total} result{total !== 1 ? "s" : ""} for &ldquo;{q}&rdquo;
      </p>

      {total === 0 ? (
        <Card><p className="text-sm text-text-secondary">No results found. Try a different search term.</p></Card>
      ) : (
        <div className="flex flex-col gap-6">
          {results!.resources.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-text-tertiary uppercase mb-2">Resources ({results!.resources.length})</h2>
              <div className="flex flex-col gap-2">
                {results!.resources.map((r) => (
                  <Card key={r.id} className="p-3">
                    <p className="text-sm font-medium text-text-primary">{r.title}</p>
                    {r.description && <p className="text-xs text-text-secondary mt-1 line-clamp-1">{r.description}</p>}
                    <p className="text-xs text-text-tertiary mt-1 capitalize">{r.type.replace("_", " ")}</p>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {results!.assignments.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-text-tertiary uppercase mb-2">Assignments ({results!.assignments.length})</h2>
              <div className="flex flex-col gap-2">
                {results!.assignments.map((a) => (
                  <Card key={a.id} className="p-3">
                    <p className="text-sm font-medium text-text-primary">{a.title}</p>
                    {a.description && <p className="text-xs text-text-secondary mt-1 line-clamp-1">{a.description}</p>}
                    {a.dueDate && <p className="text-xs text-text-tertiary mt-1">Due: {new Date(a.dueDate).toLocaleDateString()}</p>}
                  </Card>
                ))}
              </div>
            </div>
          )}

          {results!.subjects.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-text-tertiary uppercase mb-2">Subjects ({results!.subjects.length})</h2>
              <div className="flex flex-col gap-2">
                {results!.subjects.map((s) => (
                  <Card key={s.id} className="p-3">
                    <p className="text-sm font-medium text-text-primary">{s.name}</p>
                    <p className="text-xs text-text-tertiary mt-1">{s.code}</p>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {results!.announcements.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-text-tertiary uppercase mb-2">Announcements ({results!.announcements.length})</h2>
              <div className="flex flex-col gap-2">
                {results!.announcements.map((a) => (
                  <Card key={a.id} className="p-3">
                    <p className="text-sm font-medium text-text-primary">{a.title}</p>
                    <p className="text-xs text-text-secondary mt-1 line-clamp-2">{a.content}</p>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchContent />
    </Suspense>
  );
}
