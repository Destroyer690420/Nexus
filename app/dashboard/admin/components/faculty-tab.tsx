"use client";

import { useState, useEffect } from "react";
import { Check, X, ChalkboardTeacher } from "@phosphor-icons/react";
import { Button, Chip, Stickie } from "@/components/ui";
import { getSessionToken } from "@/lib/supabase-auth";
import { getPendingFaculty } from "@/lib/queries";
import type { UserData } from "@/types";

export function FacultyTab() {
  const [pending, setPending] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingUid, setApprovingUid] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getPendingFaculty()
      .then((data) => {
        if (active) setPending(data);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleAction = async (uid: string, approved: boolean) => {
    setApprovingUid(uid);
    try {
      const token = await getSessionToken();
      if (!token) return;
      const res = await fetch("/api/admin/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ uid, approved }),
      });
      if (!res.ok) throw new Error("Failed to process approval");
      setPending((prev) => prev.filter((f) => f.uid !== uid));
    } catch {
      alert("Operation failed.");
    }
    setApprovingUid(null);
  };

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center gap-3">
        <Stickie mood="think" size={80} />
        <p className="font-display font-extrabold text-sm text-ink-3">
          Loading faculty applications...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-ink-3 uppercase tracking-wider">
          {pending.length} faculty applicant{pending.length !== 1 ? "s" : ""} awaiting review
        </p>
      </div>

      {pending.length === 0 ? (
        <div className="p-8 rounded-[24px] border-2 border-line bg-surface text-center flex flex-col items-center gap-4">
          <Stickie mood="cheer" size={110} />
          <div className="space-y-1">
            <h3 className="font-display font-black text-lg text-ink">
              All caught up!
            </h3>
            <p className="text-xs font-semibold text-ink-3 max-w-xs mx-auto">
              No faculty accounts are waiting for administrative review.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map((f) => (
            <div
              key={f.uid}
              className="p-5 rounded-[22px] border-2 border-line bg-surface shadow-[0_3px_0_var(--line-strong)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-[14px] bg-tangerine-tint text-tangerine-deep flex items-center justify-center shrink-0">
                  <ChalkboardTeacher size={24} weight="bold" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h4 className="font-display font-black text-base text-ink truncate">
                      {f.name || f.email.split("@")[0]}
                    </h4>
                    <Chip variant="tangerine" className="text-[10px] font-bold uppercase">
                      Pending
                    </Chip>
                  </div>
                  <p className="text-xs font-semibold text-ink-3 truncate">
                    {f.email} • Applied {new Date(f.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => handleAction(f.uid, true)}
                  loading={approvingUid === f.uid}
                >
                  <Check size={16} weight="bold" />
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  size="md"
                  onClick={() => handleAction(f.uid, false)}
                  loading={approvingUid === f.uid}
                >
                  <X size={16} weight="bold" />
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
