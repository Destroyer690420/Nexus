"use client";

import { Suspense, useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Books,
  FileText,
  Folder,
  Flask,
  Megaphone,
  CaretRight,
} from "@phosphor-icons/react";
import {
  LargeTitleHeader,
  SearchField,
  GroupedList,
  ListRow,
  ScrollTabs,
  Stickie,
  Chip,
} from "@/components/ui";
import { getSessionToken } from "@/lib/supabase-auth";

interface SearchResult {
  resources: { id: string; title: string; type: string; subjectId?: string }[];
  subjects: { id: string; name: string; code: string }[];
  announcements: { id: string; title: string }[];
}

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [searchVal, setSearchVal] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [activeFilter, setActiveFilter] = useState("all");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);

  // Debounce search input by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchVal.trim());
    }, 300);
    return () => clearInterval(timer);
  }, [searchVal]);

  const executeSearch = useCallback(async (q: string) => {
    if (!q) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const token = await getSessionToken();
      if (!token) {
        setResults(null);
        setLoading(false);
        return;
      }
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setResults(null);
        setLoading(false);
        return;
      }
      const data = await res.json();
      setResults(data);
    } catch {
      setResults(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    executeSearch(debouncedQuery);
  }, [debouncedQuery, executeSearch]);

  const filterTabs = [
    { id: "all", label: "All" },
    { id: "notes", label: "Notes" },
    { id: "pyqs", label: "PYQs" },
    { id: "assignments", label: "Assignments" },
    { id: "lab_manuals", label: "Lab Manuals" },
    { id: "subjects", label: "Subjects" },
    { id: "announcements", label: "Notices" },
  ];

  const filteredResources = useMemo(() => {
    if (!results) return [];
    if (activeFilter === "all") return results.resources;
    if (activeFilter === "subjects" || activeFilter === "announcements") return [];
    return results.resources.filter((r) => r.type === activeFilter);
  }, [results, activeFilter]);

  const filteredSubjects = useMemo(() => {
    if (!results) return [];
    if (activeFilter === "all" || activeFilter === "subjects") return results.subjects;
    return [];
  }, [results, activeFilter]);

  const filteredAnnouncements = useMemo(() => {
    if (!results) return [];
    if (activeFilter === "all" || activeFilter === "announcements") return results.announcements;
    return [];
  }, [results, activeFilter]);

  const totalResults =
    (results?.resources.length || 0) +
    (results?.subjects.length || 0) +
    (results?.announcements.length || 0);

  const getResourceTypeIcon = (type: string) => {
    switch (type) {
      case "notes":
        return <Books size={18} weight="bold" className="text-berry" />;
      case "pyqs":
        return <FileText size={18} weight="bold" className="text-sun-deep" />;
      case "assignments":
        return <Folder size={18} weight="bold" className="text-tangerine-deep" />;
      case "lab_manuals":
        return <Flask size={18} weight="bold" className="text-fern-deep" />;
      default:
        return <FileText size={18} weight="bold" className="text-ink-2" />;
    }
  };

  const getResourceTypePath = (type: string, subjectId?: string) => {
    const route = type === "lab_manuals" ? "lab-manuals" : type;
    if (subjectId) {
      return `/dashboard/${route}/${encodeURIComponent(subjectId)}`;
    }
    return `/dashboard/${route}`;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <LargeTitleHeader
        title="Search Campus"
        subtitle={
          debouncedQuery
            ? `${totalResults} result${totalResults !== 1 ? "s" : ""} found for "${debouncedQuery}"`
            : "Search all study materials, subjects, and notices"
        }
        parentHref="/dashboard"
      />

      {/* Pill Search Field */}
      <div className="max-w-xl">
        <SearchField
          value={searchVal}
          onChange={setSearchVal}
          onClear={() => setSearchVal("")}
          placeholder="Search subjects, notes, past papers, notices..."
          autoFocus
        />
      </div>

      {/* Filter Tabs */}
      {results && totalResults > 0 && (
        <ScrollTabs
          tabs={filterTabs}
          activeTab={activeFilter}
          onChange={setActiveFilter}
        />
      )}

      {loading && (
        <div className="py-12 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 rounded-full border-3 border-line border-t-berry animate-spin" />
          <p className="text-xs font-semibold text-ink-3 font-display">
            Searching campus database...
          </p>
        </div>
      )}

      {!loading && !debouncedQuery && (
        <div className="p-8 rounded-[24px] border-2 border-line bg-surface text-center flex flex-col items-center gap-4">
          <Stickie mood="think" size={110} />
          <div className="space-y-1">
            <h3 className="font-display font-black text-lg text-ink">
              Type to search
            </h3>
            <p className="text-xs font-semibold text-ink-3 max-w-xs mx-auto">
              Find notes by subject code, syllabus units, question papers, or campus announcements.
            </p>
          </div>
        </div>
      )}

      {!loading && debouncedQuery && totalResults === 0 && (
        <div className="p-8 rounded-[24px] border-2 border-line bg-surface text-center flex flex-col items-center gap-4">
          <Stickie mood="think" size={110} />
          <div className="space-y-1">
            <h3 className="font-display font-black text-lg text-ink">
              No results found
            </h3>
            <p className="text-xs font-semibold text-ink-3 max-w-xs mx-auto">
              We couldn&apos;t find anything matching &quot;{debouncedQuery}&quot;. Try checking for typos or searching a broader term.
            </p>
          </div>
        </div>
      )}

      {!loading && results && (
        <div className="space-y-6">
          {/* Resources Group */}
          {filteredResources.length > 0 && (
            <div className="space-y-2">
              <h2 className="font-display font-black text-sm uppercase tracking-wider text-ink-3 px-1">
                Study Materials ({filteredResources.length})
              </h2>
              <GroupedList>
                {filteredResources.map((res) => (
                  <button
                    key={res.id}
                    type="button"
                    onClick={() =>
                      router.push(getResourceTypePath(res.type, res.subjectId))
                    }
                    className="w-full text-left"
                  >
                    <ListRow
                      title={res.title}
                      subtitle={
                        res.type === "lab_manuals" ? "Lab Manual" : res.type
                      }
                      icon={
                        <div className="w-9 h-9 rounded-[10px] bg-surface-sunken flex items-center justify-center">
                          {getResourceTypeIcon(res.type)}
                        </div>
                      }
                      trailing={
                        <Chip variant="neutral" className="uppercase text-[10px]">
                          {res.type}
                        </Chip>
                      }
                      chevron
                    />
                  </button>
                ))}
              </GroupedList>
            </div>
          )}

          {/* Subjects Group */}
          {filteredSubjects.length > 0 && (
            <div className="space-y-2">
              <h2 className="font-display font-black text-sm uppercase tracking-wider text-ink-3 px-1">
                Subjects ({filteredSubjects.length})
              </h2>
              <GroupedList>
                {filteredSubjects.map((sub) => (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() =>
                      router.push(`/dashboard/notes/${encodeURIComponent(sub.id)}`)
                    }
                    className="w-full text-left"
                  >
                    <ListRow
                      title={sub.name}
                      subtitle={sub.code}
                      icon={
                        <div className="w-9 h-9 rounded-[10px] bg-berry-tint text-berry flex items-center justify-center font-display font-black text-xs">
                          {sub.code.slice(0, 3)}
                        </div>
                      }
                      chevron
                    />
                  </button>
                ))}
              </GroupedList>
            </div>
          )}

          {/* Announcements Group */}
          {filteredAnnouncements.length > 0 && (
            <div className="space-y-2">
              <h2 className="font-display font-black text-sm uppercase tracking-wider text-ink-3 px-1">
                Campus Notices ({filteredAnnouncements.length})
              </h2>
              <GroupedList>
                {filteredAnnouncements.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => router.push("/dashboard/announcements")}
                    className="w-full text-left"
                  >
                    <ListRow
                      title={a.title}
                      subtitle="Campus Announcement"
                      icon={
                        <div className="w-9 h-9 rounded-[10px] bg-sun-tint text-sun-deep flex items-center justify-center">
                          <Megaphone size={18} weight="bold" />
                        </div>
                      }
                      trailing={<CaretRight size={16} weight="bold" className="text-ink-3" />}
                    />
                  </button>
                ))}
              </GroupedList>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
          <div className="flex flex-col items-center gap-3 animate-pulse">
            <Stickie mood="think" size={80} />
            <p className="font-display font-extrabold text-sm text-ink-3">
              Preparing search...
            </p>
          </div>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
