"use client";

import { useState, useEffect } from "react";
import {
  Check,
  X,
  Eye,
  File as FileGeneric,
  ArrowSquareOut,
} from "@phosphor-icons/react";
import {
  Button,
  Chip,
  Sheet,
  TextField,
  Stickie,
} from "@/components/ui";
import {
  getPendingContributions,
  approveContribution,
  rejectContribution,
} from "@/lib/queries";
import { getCurrentUser } from "@/lib/supabase-auth";
import { useFileLink } from "@/lib/file-client";
import type { Contribution } from "@/types";

function ContributionFilePreview({ item }: { item: Contribution }) {
  const fileRef = item.fileId || item.fileUrl;
  const { url, loading, error } = useFileLink(fileRef, "inline");

  if (!fileRef) {
    return (
      <div className="rounded-[16px] border-2 border-line p-5 mb-4 text-center bg-surface-sunken">
        <p className="text-xs font-semibold text-ink-3">No file attached</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-[16px] border-2 border-line p-8 mb-4 text-center flex items-center justify-center gap-2 bg-surface-sunken">
        <div className="w-5 h-5 rounded-full border-2 border-line border-t-berry animate-spin" />
        <span className="text-xs font-semibold text-ink-2">Loading preview...</span>
      </div>
    );
  }

  if (error || !url) {
    return (
      <div className="rounded-[16px] border-2 border-crimson/20 bg-crimson-tint p-4 mb-4 text-center">
        <p className="text-xs font-semibold text-crimson-deep">{error || "Failed to load file preview"}</p>
      </div>
    );
  }

  const isPdf = url.toLowerCase().includes(".pdf") || item.title.toLowerCase().endsWith(".pdf");
  const isImage = url.match(/\.(png|jpg|jpeg|gif|webp|svg)/i) || item.title.match(/\.(png|jpg|jpeg|gif|webp)$/i);

  return (
    <div className="rounded-[18px] border-2 border-line overflow-hidden mb-4 bg-surface-sunken">
      {isPdf ? (
        <iframe src={url} className="w-full h-[360px]" title="File preview" />
      ) : isImage ? (
        <div className="flex items-center justify-center p-4">
          <img
            src={url}
            alt={item.title}
            className="max-w-full max-h-[360px] object-contain rounded-[12px]"
          />
        </div>
      ) : (
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2.5">
            <FileGeneric size={24} weight="bold" className="text-ink-2" />
            <span className="text-xs font-bold text-ink">Download to preview file</span>
          </div>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-bold text-berry hover:underline"
          >
            <span>Open externally</span>
            <ArrowSquareOut size={16} weight="bold" />
          </a>
        </div>
      )}
    </div>
  );
}

export function QueueTab() {
  const [items, setItems] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionUid, setActionUid] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<Contribution | null>(null);

  // Reject sheet
  const [rejectItem, setRejectItem] = useState<Contribution | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejecting, setRejecting] = useState(false);

  useEffect(() => {
    let active = true;
    getPendingContributions()
      .then((data) => {
        if (active) setItems(data);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
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

  const handleConfirmReject = async () => {
    if (!rejectItem) return;
    setRejecting(true);
    try {
      await rejectContribution(rejectItem.id, rejectReason.trim() || undefined);
      setItems((prev) => prev.filter((i) => i.id !== rejectItem.id));
      setRejectItem(null);
      setRejectReason("");
      setPreviewItem(null);
    } catch {
      alert("Failed to reject contribution.");
    }
    setRejecting(false);
  };

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center gap-3">
        <Stickie mood="think" size={80} />
        <p className="font-display font-extrabold text-sm text-ink-3">
          Loading contribution queue...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-ink-3 uppercase tracking-wider">
          {items.length} pending contribution{items.length !== 1 ? "s" : ""}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="p-8 rounded-[24px] border-2 border-line bg-surface text-center flex flex-col items-center gap-4">
          <Stickie mood="cheer" size={110} />
          <div className="space-y-1">
            <h3 className="font-display font-black text-lg text-ink">
              Queue is clear!
            </h3>
            <p className="text-xs font-semibold text-ink-3 max-w-xs mx-auto">
              All student contributions have been reviewed and processed.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-[22px] border-2 border-line bg-surface shadow-[0_3px_0_var(--line-strong)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <Chip variant="neutral" className="uppercase text-[10px] font-black">
                    {item.type}
                  </Chip>
                  {item.unit && (
                    <Chip variant="berry" className="text-[10px] font-bold">
                      Unit {item.unit}
                    </Chip>
                  )}
                  {item.year && (
                    <Chip variant="sun" className="text-[10px] font-bold">
                      Year {item.year}
                    </Chip>
                  )}
                  <span className="text-xs font-semibold text-ink-3">
                    Submitted {new Date(item.createdAt).toLocaleDateString()}
                    {item.contributorName && ` by ${item.contributorName}`}
                  </span>
                </div>

                <h4 className="font-display font-black text-base text-ink truncate">
                  {item.title}
                </h4>

                {item.description && (
                  <p className="mt-1 text-xs text-ink-2 line-clamp-1">
                    {item.description}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPreviewItem(item)}
                >
                  <Eye size={16} weight="bold" />
                  Preview
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleApprove(item.id)}
                  loading={actionUid === item.id}
                >
                  <Check size={16} weight="bold" />
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setRejectItem(item)}
                  loading={actionUid === item.id}
                >
                  <X size={16} weight="bold" />
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Sheet */}
      {previewItem && (
        <Sheet
          open={Boolean(previewItem)}
          onClose={() => setPreviewItem(null)}
          title="Review Contribution"
        >
          <div className="space-y-4 py-2">
            <ContributionFilePreview item={previewItem} />

            <div className="space-y-1">
              <h3 className="font-display font-black text-lg text-ink">
                {previewItem.title}
              </h3>
              {previewItem.description && (
                <p className="text-xs text-ink-2 leading-relaxed">
                  {previewItem.description}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs p-3 rounded-[14px] bg-surface-sunken border border-line">
              <div>
                <span className="text-ink-3 block">Type:</span>
                <span className="font-bold text-ink uppercase">{previewItem.type}</span>
              </div>
              <div>
                <span className="text-ink-3 block">Curriculum:</span>
                <span className="font-bold text-ink">Sem {previewItem.semesterId}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="destructive"
                size="md"
                fullWidth
                onClick={() => {
                  setRejectItem(previewItem);
                  setPreviewItem(null);
                }}
              >
                Reject with note
              </Button>
              <Button
                variant="primary"
                size="md"
                fullWidth
                onClick={() => handleApprove(previewItem.id)}
                loading={actionUid === previewItem.id}
              >
                Approve to library
              </Button>
            </div>
          </div>
        </Sheet>
      )}

      {/* Reject Reason Sheet */}
      {rejectItem && (
        <Sheet
          open={Boolean(rejectItem)}
          onClose={() => {
            setRejectItem(null);
            setRejectReason("");
          }}
          title="Reject Contribution"
        >
          <div className="space-y-4 py-2">
            <p className="text-xs font-semibold text-ink-2">
              Explain why this contribution was rejected. The student will see this note in their contribution history.
            </p>

            <TextField
              label="Rejection Note (Optional)"
              placeholder="e.g. Scans are blurry; please re-upload clear photos."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />

            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="ghost"
                size="md"
                fullWidth
                onClick={() => {
                  setRejectItem(null);
                  setRejectReason("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="md"
                fullWidth
                onClick={handleConfirmReject}
                loading={rejecting}
              >
                Confirm rejection
              </Button>
            </div>
          </div>
        </Sheet>
      )}
    </div>
  );
}
