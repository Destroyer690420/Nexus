"use client";

import { useState, useEffect } from "react";
import { Button, Card } from "@/components/ui";
import { getAllResources, deleteResource } from "@/lib/queries";
import type { Resource, ResourceType } from "@/types";

const resourceLabels: Record<ResourceType, string> = {
  notes: "Notes",
  pyqs: "PYQs",
  assignments: "Assignments",
  labManuals: "Lab Manuals",
  others: "Others",
};

export function ResourcesTab() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<ResourceType | "all">("all");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deletingType, setDeletingType] = useState<ResourceType | null>(null);

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
    if (!deleteConfirm || !deletingType) return;
    try {
      await deleteResource(deletingType, deleteConfirm);
      setDeleteConfirm(null);
      setDeletingType(null);
      await loadResources();
    } catch {
      alert("Failed to delete resource.");
    }
  };

  const filtered =
    filterType === "all"
      ? resources
      : resources.filter((r) => r.type === filterType);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-6 w-6 border-2 border-text-tertiary border-t-accent rounded-full" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setFilterType("all")}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
            filterType === "all"
              ? "bg-accent text-white"
              : "bg-surface text-text-secondary hover:text-text-primary"
          }`}
        >
          All
        </button>
        {(Object.keys(resourceLabels) as ResourceType[]).map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
              filterType === type
                ? "bg-accent text-white"
                : "bg-surface text-text-secondary hover:text-text-primary"
            }`}
          >
            {resourceLabels[type]}
          </button>
        ))}
      </div>

      <p className="text-sm text-text-secondary mb-4">
        {filtered.length} resource{filtered.length !== 1 ? "s" : ""}.
      </p>

      {filtered.length === 0 ? (
        <Card>
          <p className="text-sm text-text-secondary">
            No resources found.
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((r) => (
            <Card
              key={`${r.type}-${r.id}`}
              className="p-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="rounded bg-accent-light px-2 py-0.5 text-xs font-medium text-accent uppercase flex-shrink-0">
                  {r.type}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {r.title}
                  </p>
                  <p className="text-xs text-text-tertiary">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                onClick={() => {
                  setDeleteConfirm(r.id);
                  setDeletingType(r.type);
                }}
              >
                Delete
              </Button>
            </Card>
          ))}
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setDeleteConfirm(null)}
          />
          <div className="relative z-10 w-full max-w-md rounded-lg border border-border bg-surface p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-text-primary mb-4">
              Delete Resource
            </h2>
            <div className="flex flex-col gap-4">
              <p className="text-sm text-text-secondary">
                Are you sure you want to delete this resource? This cannot be
                undone.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  className="flex-1"
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
