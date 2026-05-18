"use client";

import { useState, useEffect } from "react";
import { Button, Card, Badge } from "@/components/ui";
import {
  getPendingContributions,
  approveContribution,
  rejectContribution,
} from "@/lib/queries";
import { getCurrentUser } from "@/lib/supabase-auth";
import type { Contribution } from "@/types";

function PreviewModal({
  item,
  onClose,
  onApprove,
  onReject,
  actionUid,
}: {
  item: Contribution;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  actionUid: string | null;
}) {
  const isPdf = item.fileUrl?.toLowerCase().endsWith(".pdf");
  const isImage = item.fileUrl?.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="absolute inset-0 bg-overlay animate-fade-in" onClick={onClose} />
      <div className="relative z-10 w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-[var(--radius-lg)] border border-border bg-surface p-6 shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-text-primary">
            Preview Contribution
          </h2>
          <button
            onClick={onClose}
            className="flex items-center justify-center h-8 w-8 rounded-full text-text-tertiary hover:text-text-primary hover:bg-surface-hover transition-all duration-200 cursor-pointer"
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* File Preview */}
        {item.fileUrl ? (
          <div className="rounded-[var(--radius-md)] border border-border overflow-hidden mb-5 bg-surface-hover">
            {isPdf ? (
              <iframe
                src={item.fileUrl}
                className="w-full h-[400px]"
                title="File preview"
              />
            ) : isImage ? (
              <div className="flex items-center justify-center p-4">
                <img
                  src={item.fileUrl}
                  alt={item.title}
                  className="max-w-full max-h-[400px] object-contain rounded-[var(--radius-md)]"
                />
              </div>
            ) : (
              <div className="flex items-center gap-3 p-5">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-tertiary">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/>
                  <path d="M14 2v6h6"/>
                </svg>
                <a href={item.fileUrl} target="_blank" rel="noopener noreferrer"
                  className="text-sm text-accent hover:underline underline-offset-2">
                  Open file in new tab
                </a>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-[var(--radius-md)] border border-border p-5 mb-5 text-center">
            <p className="text-sm text-text-tertiary">No file attached</p>
          </div>
        )}

        {/* Metadata */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-2">
            <Badge variant="accent">{item.type}</Badge>
            {item.tags?.map((t) => (
              <Badge key={t} variant="default">{t}</Badge>
            ))}
          </div>
          <p className="text-lg font-semibold text-text-primary">{item.title}</p>
          {item.description && (
            <p className="text-sm text-text-secondary">{item.description}</p>
          )}
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div>
              <span className="text-text-tertiary">Course: </span>
              <span className="text-text-primary">{item.courseId}</span>
            </div>
            {item.branchId && (
              <div>
                <span className="text-text-tertiary">Branch: </span>
                <span className="text-text-primary">{item.branchId}</span>
              </div>
            )}
            <div>
              <span className="text-text-tertiary">Semester: </span>
              <span className="text-text-primary">{item.semesterId}</span>
            </div>
            {item.subjectId && (
              <div>
                <span className="text-text-tertiary">Subject: </span>
                <span className="text-text-primary">{item.subjectId}</span>
              </div>
            )}
            {item.unit && (
              <div>
                <span className="text-text-tertiary">Unit: </span>
                <span className="text-text-primary">{item.unit}</span>
              </div>
            )}
          </div>
          <p className="text-xs text-text-tertiary">
            Contributed {new Date(item.createdAt).toLocaleDateString()}
            {item.contributorName && ` by ${item.contributorName}`}
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            variant="ghost"
            onClick={() => onReject(item.id)}
            loading={actionUid === item.id}
          >
            Reject
          </Button>
          <Button
            variant="primary"
            onClick={() => onApprove(item.id)}
            loading={actionUid === item.id}
          >
            Approve
          </Button>
        </div>
      </div>
    </div>
  );
}

export function QueueTab() {
  const [items, setItems] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionUid, setActionUid] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<Contribution | null>(null);

  useEffect(() => {
    getPendingContributions()
      .then(setItems)
      .finally(() => setLoading(false));
  }, []);

  const handleApprove = async (id: string) => {
    setActionUid(id);
    try {
      const user = await getCurrentUser();
      if (!user) return;
      await approveContribution(id, user.id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      setPreviewItem(null);
    } catch {
      alert("Failed to approve contribution.");
    }
    setActionUid(null);
  };

  const handleReject = async (id: string) => {
    setActionUid(id);
    try {
      await rejectContribution(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      setPreviewItem(null);
    } catch {
      alert("Failed to reject contribution.");
    }
    setActionUid(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-6 w-6 border-2 border-text-tertiary border-t-accent rounded-full" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-text-secondary">
          {items.length} pending contribution{items.length !== 1 ? "s" : ""}.
        </p>
      </div>

      {items.length === 0 ? (
        <Card>
          <p className="text-sm text-text-secondary">
            No pending contributions. When students upload resources, they will
            appear here for approval.
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <Card key={item.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-accent-light px-2 py-0.5 text-xs font-medium text-accent uppercase">
                      {item.type}
                    </span>
                    <p className="text-sm font-medium text-text-primary truncate">
                      {item.title}
                    </p>
                  </div>
                  <p className="text-xs text-text-tertiary mt-1.5">
                    Contributed{" "}
                    {new Date(item.createdAt).toLocaleDateString()}
                    {item.contributorName && ` by ${item.contributorName}`}
                  </p>
                  {item.description && (
                    <p className="text-xs text-text-secondary mt-1 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 ml-4 flex-shrink-0">
                  <Button
                    variant="ghost"
                    onClick={() => setPreviewItem(item)}
                  >
                    Preview
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => handleApprove(item.id)}
                    loading={actionUid === item.id}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => handleReject(item.id)}
                    loading={actionUid === item.id}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {previewItem && (
        <PreviewModal
          item={previewItem}
          onClose={() => setPreviewItem(null)}
          onApprove={handleApprove}
          onReject={handleReject}
          actionUid={actionUid}
        />
      )}
    </div>
  );
}
