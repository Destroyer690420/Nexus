"use client";

import { useState, useEffect } from "react";
import { Button, Card } from "@/components/ui";
import {
  getPendingContributions,
  approveContribution,
  rejectContribution,
} from "@/lib/queries";
import { getCurrentUser } from "@/lib/supabase-auth";
import type { Contribution } from "@/types";

export function QueueTab() {
  const [items, setItems] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionUid, setActionUid] = useState<string | null>(null);

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
    </div>
  );
}
