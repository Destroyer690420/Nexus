"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

interface SearchResult {
  resources: { id: string; title: string; type: string }[];
  assignments: { id: string; title: string }[];
  subjects: { id: string; name: string; code: string }[];
  announcements: { id: string; title: string }[];
}

export function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchResults = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data);
    } catch {
      setResults(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchResults(query);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, fetchResults]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const totalResults = results
    ? results.resources.length + results.assignments.length + results.subjects.length + results.announcements.length
    : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length >= 2) {
      setIsOpen(false);
      router.push(`/dashboard/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && query.trim().length >= 2) {
      setIsOpen(false);
      router.push(`/dashboard/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div ref={ref} className="relative w-full max-w-md">
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
          onKeyDown={handleKeyDown}
          onFocus={() => results && setIsOpen(true)}
          placeholder="Search resources, assignments, subjects..."
          className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-accent focus:ring-1 focus:ring-accent"
        />
      </form>

      {isOpen && (query.length >= 2) && (
        <div className="absolute top-full left-0 right-0 mt-1 rounded-lg border border-border bg-surface shadow-lg z-50 max-h-80 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <div className="animate-spin h-5 w-5 border-2 border-text-tertiary border-t-accent rounded-full" />
            </div>
          ) : totalResults === 0 ? (
            <p className="text-sm text-text-tertiary py-4 px-4 text-center">No results found</p>
          ) : (
            <div className="py-2">
              {results!.resources.length > 0 && (
                <div className="px-4 pb-2">
                  <p className="text-xs font-medium text-text-tertiary uppercase mb-1">Resources</p>
                  {results!.resources.slice(0, 5).map((r) => (
                    <button
                      key={r.id}
                      onClick={() => { setIsOpen(false); router.push(`/dashboard/${r.type === "lab_manuals" ? "lab-manuals" : r.type}`); }}
                      className="w-full text-left py-1.5 text-sm text-text-primary hover:bg-surface rounded px-2"
                    >
                      {r.title}
                    </button>
                  ))}
                </div>
              )}
              {results!.assignments.length > 0 && (
                <div className="px-4 pb-2">
                  <p className="text-xs font-medium text-text-tertiary uppercase mb-1">Assignments</p>
                  {results!.assignments.slice(0, 5).map((a) => (
                    <button
                      key={a.id}
                      onClick={() => { setIsOpen(false); router.push("/dashboard/assignments"); }}
                      className="w-full text-left py-1.5 text-sm text-text-primary hover:bg-surface rounded px-2"
                    >
                      {a.title}
                    </button>
                  ))}
                </div>
              )}
              {results!.subjects.length > 0 && (
                <div className="px-4 pb-2">
                  <p className="text-xs font-medium text-text-tertiary uppercase mb-1">Subjects</p>
                  {results!.subjects.slice(0, 5).map((s) => (
                    <div key={s.id} className="py-1.5 text-sm text-text-primary px-2">
                      {s.name} <span className="text-text-tertiary">({s.code})</span>
                    </div>
                  ))}
                </div>
              )}
              {results!.announcements.length > 0 && (
                <div className="px-4 pb-2">
                  <p className="text-xs font-medium text-text-tertiary uppercase mb-1">Announcements</p>
                  {results!.announcements.slice(0, 3).map((a) => (
                    <button
                      key={a.id}
                      onClick={() => { setIsOpen(false); router.push("/dashboard/announcements"); }}
                      className="w-full text-left py-1.5 text-sm text-text-primary hover:bg-surface rounded px-2"
                    >
                      {a.title}
                    </button>
                  ))}
                </div>
              )}
              <div className="px-4 pt-2 border-t border-border-light">
                <button
                  onClick={() => { setIsOpen(false); router.push(`/dashboard/search?q=${encodeURIComponent(query.trim())}`); }}
                  className="w-full text-left py-1.5 text-sm text-accent hover:underline"
                >
                  View all results &rarr;
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
