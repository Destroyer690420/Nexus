"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  PlusCircle,
  WarningCircle,
} from "@phosphor-icons/react";
import {
  LargeTitleHeader,
  SegmentedControl,
  StatusPill,
  Chip,
  Button,
  Stickie,
} from "@/components/ui";
import { onAuthChange, getUserData } from "@/lib/supabase-auth";
import { getMyContributions } from "@/lib/queries";
import type { Contribution } from "@/types";

const typeLabels: Record<string, string> = {
  notes: "Notes",
  pyqs: "PYQs",
  assignments: "Assignments",
  lab_manuals: "Lab Manuals",
  others: "Others",
};

export default function MyContributionsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  useEffect(() => {
    let active = true;
    const unsub = onAuthChange(async (user) => {
      if (!user) {
        router.replace("/auth");
        return;
      }
      const data = await getUserData(user.id);
      if (!data || data.role !== "student") {
        router.replace("/dashboard");
        return;
      }
      const items = await getMyContributions(user.id);
      if (active) {
        setContributions(items);
        setLoading(false);
      }
    });
    return () => {
      active = false;
      unsub();
    };
  }, [router]);

  const filteredContributions = useMemo(() => {
    if (filter === "all") return contributions;
    return contributions.filter((c) => c.status === filter);
  }, [contributions, filter]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="flex flex-col items-center gap-3 animate-pulse">
          <Stickie mood="think" size={80} />
          <p className="font-display font-extrabold text-sm text-ink-3">
            Loading your contributions...
          </p>
        </div>
      </div>
    );
  }

  const counts = {
    all: contributions.length,
    pending: contributions.filter((c) => c.status === "pending").length,
    approved: contributions.filter((c) => c.status === "approved").length,
    rejected: contributions.filter((c) => c.status === "rejected").length,
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <LargeTitleHeader
        title="My Contributions"
        subtitle="Track verification and approval status of study materials you shared"
        parentHref="/dashboard"
        action={
          <Link href="/dashboard/contribute">
            <Button variant="primary" size="md">
              <PlusCircle size={18} weight="bold" />
              Contribute
            </Button>
          </Link>
        }
      />

      {/* Filter Tabs */}
      {contributions.length > 0 && (
        <div className="max-w-md">
          <SegmentedControl
            options={[
              { value: "all", label: `All (${counts.all})` },
              { value: "pending", label: `Pending (${counts.pending})` },
              { value: "approved", label: `Approved (${counts.approved})` },
              { value: "rejected", label: `Rejected (${counts.rejected})` },
            ]}
            value={filter}
            onChange={(val) => setFilter(val as typeof filter)}
          />
        </div>
      )}

      {filteredContributions.length === 0 ? (
        <div className="p-8 rounded-[24px] border-2 border-line bg-surface text-center flex flex-col items-center gap-4">
          <Stickie mood="think" size={110} />
          <div className="space-y-1">
            <h3 className="font-display font-black text-lg text-ink">
              {filter === "all"
                ? "No contributions yet"
                : `No ${filter} contributions`}
            </h3>
            <p className="text-xs font-semibold text-ink-3 max-w-xs mx-auto">
              {filter === "all"
                ? "You haven't contributed any study materials yet. Help your peers by uploading notes or PYQs."
                : `You don't have any contributions marked as ${filter}.`}
            </p>
          </div>
          <Link href="/dashboard/contribute">
            <Button variant="primary" size="md">
              <PlusCircle size={18} weight="bold" />
              Upload your first note
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredContributions.map((c) => {
            const statusType: "pending" | "approved" | "rejected" =
              c.status === "approved"
                ? "approved"
                : c.status === "rejected"
                ? "rejected"
                : "pending";

            return (
              <div
                key={c.id}
                className="p-5 rounded-[22px] border-2 border-line bg-surface shadow-[0_3px_0_var(--line-strong)]"
              >
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <Chip variant="neutral" className="uppercase text-[10px] font-black">
                        {typeLabels[c.type] || c.type}
                      </Chip>
                      {c.unit && (
                        <Chip variant="berry" className="text-[10px] font-bold">
                          Unit {c.unit}
                        </Chip>
                      )}
                      <span className="text-xs font-semibold text-ink-3">
                        Submitted {new Date(c.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="font-display font-black text-base text-ink">
                      {c.title}
                    </h3>

                    {c.description && (
                      <p className="mt-1 text-xs text-ink-2 line-clamp-2 leading-relaxed">
                        {c.description}
                      </p>
                    )}

                    {/* Rejection notice */}
                    {c.status === "rejected" && c.rejectReason && (
                      <div className="mt-3 p-3 rounded-[14px] bg-crimson-tint border border-crimson/20 text-crimson-deep text-xs font-semibold flex items-start gap-2">
                        <WarningCircle size={16} weight="bold" className="shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">Staff review note:</span> {c.rejectReason}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 self-start sm:self-center">
                    <StatusPill status={statusType} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
