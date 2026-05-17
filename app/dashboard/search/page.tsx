"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, PageHeader, EmptyState, Badge } from "@/components/ui";

interface SearchResult {
  resources: { id: string; title: string; type: string; subjectId?: string }[];
  assignments: { id: string; title: string; subjectId?: string }[];
  subjects: { id: string; name: string; code: string }[];
  announcements: { id: string; title: string }[];
}

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!query) { setLoading(false); return; }
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data);
      } catch { setResults(null); }
      setLoading(false);
    })();
  }, [query]);

  if (loading) return <div className="flex items-center justify-center py-12"><div className="animate-spin h-6 w-6 border-2 border-text-tertiary border-t-accent rounded-full" /></div>;

  const total = results ? results.resources.length + results.assignments.length + results.subjects.length + results.announcements.length : 0;

  return (
    <div className="max-w-3xl">
      <PageHeader title={`Results for "${query}"`} subtitle={`${total} result${total !== 1 ? "s" : ""} found.`}
        icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>} />

      {total === 0 ? (
        <EmptyState title="No results" description="Try searching with different keywords." />
      ) : (
        <div className="flex flex-col gap-6">
          {results!.resources.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-accent" />Resources</h3>
              <div className="flex flex-col gap-2">
                {results!.resources.map((r) => (
                  <Card key={r.id} className="p-4" interactive onClick={() => router.push(`/dashboard/${r.type === "lab_manuals" ? "lab-manuals" : r.type}`)}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="accent">{r.type}</Badge>
                      {r.subjectId && <span className="text-xs text-text-tertiary">{r.subjectId}</span>}
                    </div>
                    <p className="text-sm font-medium text-text-primary mt-1">{r.title}</p>
                  </Card>
                ))}
              </div>
            </section>
          )}
          {results!.assignments.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-accent" />Assignments</h3>
              <div className="flex flex-col gap-2">
                {results!.assignments.map((a) => (
                  <Card key={a.id} className="p-4" interactive onClick={() => router.push("/dashboard/assignments")}>
                    <p className="text-sm font-medium text-text-primary">{a.title}</p>
                  </Card>
                ))}
              </div>
            </section>
          )}
          {results!.subjects.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-accent" />Subjects</h3>
              <div className="flex flex-col gap-2">
                {results!.subjects.map((s) => (
                  <Card key={s.id} className="p-4">
                    <p className="text-sm font-medium text-text-primary">{s.name} <span className="text-text-tertiary">({s.code})</span></p>
                  </Card>
                ))}
              </div>
            </section>
          )}
          {results!.announcements.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-accent" />Announcements</h3>
              <div className="flex flex-col gap-2">
                {results!.announcements.map((a) => (
                  <Card key={a.id} className="p-4" interactive onClick={() => router.push("/dashboard/announcements")}>
                    <p className="text-sm font-medium text-text-primary">{a.title}</p>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-12"><div className="animate-spin h-6 w-6 border-2 border-text-tertiary border-t-accent rounded-full" /></div>}>
      <SearchContent />
    </Suspense>
  );
}
