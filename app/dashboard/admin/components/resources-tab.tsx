"use client";

import { useState, useEffect, useMemo } from "react";
import { Trash } from "@phosphor-icons/react";
import {
  Chip,
  SearchField,
  ScrollTabs,
  ConfirmSheet,
  Stickie,
} from "@/components/ui";
import { getAllResources, deleteResource } from "@/lib/queries";
import type { Resource, ResourceType } from "@/types";

export function ResourcesTab() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [targetDelete, setTargetDelete] = useState<{ id: string; type: ResourceType } | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadResources().finally(() => setLoading(false));
  }, []);

  const loadResources = async () => {
    const all = await getAllResources();
    const flat: Resource[] = [];
    for (const { type, data } of all) {
      for (const item of data) {
        flat.push({ ...item, type: type as ResourceType });
      }
    }
    flat.sort((a, b) => b.createdAt - a.createdAt);
    setResources(flat);
  };

  const handleDelete = async () => {
    if (!targetDelete) return;
    setDeleting(true);
    try {
      await deleteResource(targetDelete.type, targetDelete.id);
      setTargetDelete(null);
      await loadResources();
    } catch {
      alert("Failed to delete resource.");
    }
    setDeleting(false);
  };

  const filtered = useMemo(() => {
    return resources.filter((r) => {
      const matchType = filterType === "all" || r.type === filterType;
      const matchSearch =
        !search.trim() ||
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        (r.subjectId && r.subjectId.toLowerCase().includes(search.toLowerCase()));
      return matchType && matchSearch;
    });
  }, [resources, filterType, search]);

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center gap-3">
        <Stickie mood="think" size={80} />
        <p className="font-display font-extrabold text-sm text-ink-3">
          Loading library resources...
        </p>
      </div>
    );
  }

  const tabs = [
    { id: "all", label: `All (${resources.length})` },
    { id: "notes", label: "Notes" },
    { id: "pyqs", label: "PYQs" },
    { id: "assignments", label: "Assignments" },
    { id: "lab_manuals", label: "Lab Manuals" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="max-w-xs flex-1">
          <SearchField
            value={search}
            onChange={setSearch}
            placeholder="Search by title or subject ID..."
          />
        </div>
      </div>

      <ScrollTabs
        tabs={tabs}
        activeTab={filterType}
        onChange={setFilterType}
      />

      {filtered.length === 0 ? (
        <div className="p-8 rounded-[24px] border-2 border-line bg-surface text-center flex flex-col items-center gap-4">
          <Stickie mood="think" size={100} />
          <div className="space-y-1">
            <h3 className="font-display font-black text-lg text-ink">
              No matching resources
            </h3>
            <p className="text-xs font-semibold text-ink-3 max-w-xs mx-auto">
              No resources found for the selected filter or search term.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((r) => (
            <div
              key={r.id}
              className="p-4 rounded-[18px] border-2 border-line bg-surface shadow-[0_2px_0_var(--line-strong)] flex items-center justify-between gap-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <Chip variant="neutral" className="uppercase text-[9px] font-black">
                    {r.type}
                  </Chip>
                  {r.unit && (
                    <Chip variant="berry" className="text-[9px] font-bold">
                      Unit {r.unit}
                    </Chip>
                  )}
                  {r.year && (
                    <Chip variant="sun" className="text-[9px] font-bold">
                      {r.year}
                    </Chip>
                  )}
                  <span className="text-[11px] font-semibold text-ink-3">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h4 className="font-display font-bold text-sm text-ink truncate">
                  {r.title}
                </h4>
              </div>

              <button
                type="button"
                onClick={() => setTargetDelete({ id: r.id, type: r.type })}
                className="w-8 h-8 rounded-[8px] flex items-center justify-center text-ink-3 hover:text-crimson hover:bg-crimson-tint transition-colors shrink-0"
                title="Delete resource"
                aria-label="Delete resource"
              >
                <Trash size={16} weight="bold" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Sheet */}
      <ConfirmSheet
        open={Boolean(targetDelete)}
        onClose={() => setTargetDelete(null)}
        onConfirm={handleDelete}
        title="Delete Resource"
        description="Are you sure you want to delete this resource from the catalog? It will no longer be available to students."
        confirmLabel="Delete resource"
        destructive
        loading={deleting}
      />
    </div>
  );
}
