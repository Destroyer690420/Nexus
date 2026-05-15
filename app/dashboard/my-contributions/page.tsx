"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui";
import { onAuthChange, getUserData } from "@/lib/supabase-auth";
import { getMyContributions } from "@/lib/queries";
import type { UserData, Contribution } from "@/types";

const typeLabels: Record<string, string> = {
  notes: "Notes",
  pyqs: "PYQs",
  assignments: "Assignments",
  labManuals: "Lab Manuals",
  others: "Others",
};

const statusColors: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-green-50 text-green-700 border-green-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
};

export default function MyContributionsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [contributions, setContributions] = useState<Contribution[]>([]);

  useEffect(() => {
    const unsub = onAuthChange(async (user) => {
      if (!user) { router.replace("/auth"); return; }
      const data = await getUserData(user.id);
      if (!data || data.role !== "student") {
        router.replace("/dashboard");
        return;
      }
      const items = await getMyContributions(user.id);
      setContributions(items);
      setLoading(false);
    });
    return unsub;
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-6 w-6 border-2 border-text-tertiary border-t-accent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight text-text-primary mb-1">
        My Contributions
      </h1>
      <p className="text-sm text-text-secondary mb-8">
        Track the status of resources you have contributed.
      </p>

      {contributions.length === 0 ? (
        <Card>
          <p className="text-sm text-text-secondary">
            You haven't contributed anything yet. Head to{" "}
            <button
              onClick={() => router.push("/dashboard/contribute")}
              className="text-accent underline underline-offset-2 hover:text-accent-dark transition-colors"
            >
              Contribute
            </button>{" "}
            to share study materials.
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {contributions.map((c) => (
            <Card key={c.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-accent-light px-2 py-0.5 text-xs font-medium text-accent uppercase">
                      {typeLabels[c.type] || c.type}
                    </span>
                    <p className="text-sm font-medium text-text-primary truncate">
                      {c.title}
                    </p>
                  </div>
                  <p className="text-xs text-text-tertiary mt-1.5">
                    Submitted {new Date(c.createdAt).toLocaleDateString()}
                  </p>
                  {c.description && (
                    <p className="text-xs text-text-secondary mt-1 line-clamp-2">
                      {c.description}
                    </p>
                  )}
                </div>
                <div className="ml-4 flex-shrink-0">
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${
                      statusColors[c.status] || "bg-gray-50 text-gray-700 border-gray-200"
                    }`}
                  >
                    {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                  </span>
                  {c.status === "rejected" && c.rejectReason && (
                    <p className="text-xs text-red-600 mt-2 max-w-[200px]">
                      Reason: {c.rejectReason}
                    </p>
                  )}
                  {c.status === "approved" && c.approvedAt && (
                    <p className="text-xs text-green-600 mt-2">
                      Approved {new Date(c.approvedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
