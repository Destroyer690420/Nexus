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
    <div ref={ref} className="relative w-full">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
            onKeyDown={handleKeyDown}
            onFocus={() => results && setIsOpen(true)}
            placeholder="Search..."
            className="w-full rounded-[var(--radius-md)] border border-border bg-input-bg pl-9 pr-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-200"
          />
        </div>
      </form>

      {isOpen && (query.length >= 2) && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-[var(--radius-lg)] border border-border bg-surface shadow-xl z-50 max-h-80 overflow-y-auto animate-slide-down">
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <div className="animate-spin h-5 w-5 border-2 border-text-tertiary border-t-accent rounded-full" />
            </div>
          ) : totalResults === 0 ? (
            <div className="py-6 px-4 text-center">
              <svg className="mx-auto mb-2 text-text-tertiary" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              <p className="text-sm text-text-tertiary">No results found</p>
            </div>
          ) : (
            <div className="py-2">
              {results!.resources.length > 0 && (
                <div className="px-3 pb-2">
                  <p className="text-xs font-medium text-text-tertiary uppercase mb-1 px-2">Resources</p>
                  {results!.resources.slice(0, 5).map((r) => (
                    <button
                      key={r.id}
                      onClick={() => { setIsOpen(false); router.push(`/dashboard/${r.type === "lab_manuals" ? "lab-manuals" : r.type}`); }}
                      className="w-full text-left py-2 text-sm text-text-primary hover:bg-surface-hover rounded-[var(--radius-sm)] px-2 transition-colors duration-150"
                    >
                      {r.title}
                    </button>
                  ))}
                </div>
              )}
              {results!.assignments.length > 0 && (
                <div className="px-3 pb-2">
                  <p className="text-xs font-medium text-text-tertiary uppercase mb-1 px-2">Assignments</p>
                  {results!.assignments.slice(0, 5).map((a) => (
                    <button
                      key={a.id}
                      onClick={() => { setIsOpen(false); router.push("/dashboard/assignments"); }}
                      className="w-full text-left py-2 text-sm text-text-primary hover:bg-surface-hover rounded-[var(--radius-sm)] px-2 transition-colors duration-150"
                    >
                      {a.title}
                    </button>
                  ))}
                </div>
              )}
              {results!.subjects.length > 0 && (
                <div className="px-3 pb-2">
                  <p className="text-xs font-medium text-text-tertiary uppercase mb-1 px-2">Subjects</p>
                  {results!.subjects.slice(0, 5).map((s) => (
                    <div key={s.id} className="py-2 text-sm text-text-primary px-2">
                      {s.name} <span className="text-text-tertiary">({s.code})</span>
                    </div>
                  ))}
                </div>
              )}
              {results!.announcements.length > 0 && (
                <div className="px-3 pb-2">
                  <p className="text-xs font-medium text-text-tertiary uppercase mb-1 px-2">Announcements</p>
                  {results!.announcements.slice(0, 3).map((a) => (
                    <button
                      key={a.id}
                      onClick={() => { setIsOpen(false); router.push("/dashboard/announcements"); }}
                      className="w-full text-left py-2 text-sm text-text-primary hover:bg-surface-hover rounded-[var(--radius-sm)] px-2 transition-colors duration-150"
                    >
                      {a.title}
                    </button>
                  ))}
                </div>
              )}
              <div className="px-3 pt-2 border-t border-border-light">
                <button
                  onClick={() => { setIsOpen(false); router.push(`/dashboard/search?q=${encodeURIComponent(query.trim())}`); }}
                  className="w-full text-left py-2 text-sm text-accent hover:bg-accent-light rounded-[var(--radius-sm)] px-2 font-medium transition-colors duration-150"
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
