"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, PageHeader, EmptyState, Badge, Button } from "@/components/ui";
import { onAuthChange, getUserData } from "@/lib/supabase-auth";
import { getMyContributions } from "@/lib/queries";
import type { UserData, Contribution } from "@/types";

const typeLabels: Record<string, string> = { notes: "Notes", pyqs: "PYQs", assignments: "Assignments", lab_manuals: "Lab Manuals", others: "Others" };

export default function MyContributionsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [contributions, setContributions] = useState<Contribution[]>([]);

  useEffect(() => {
    const unsub = onAuthChange(async (user) => {
      if (!user) { router.replace("/auth"); return; }
      const data = await getUserData(user.id);
      if (!data || data.role !== "student") { router.replace("/dashboard"); return; }
      const items = await getMyContributions(user.id);
      setContributions(items); setLoading(false);
    });
    return unsub;
  }, [router]);

  if (loading) return <div className="flex items-center justify-center py-12"><div className="animate-spin h-6 w-6 border-2 border-text-tertiary border-t-accent rounded-full" /></div>;

  return (
    <div className="max-w-3xl">
      <PageHeader title="My Contributions" subtitle="Track the status of resources you have contributed."
        icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>} />
      {contributions.length === 0 ? (
        <EmptyState title="No contributions yet" description="You haven't contributed anything yet."
          action={<Button variant="primary" onClick={() => router.push("/dashboard/contribute")}>Contribute</Button>} />
      ) : (
        <div className="flex flex-col gap-3">
          {contributions.map((c) => (
            <Card key={c.id} className="p-5">
              <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="accent">{typeLabels[c.type] || c.type}</Badge>
                    <p className="text-sm font-semibold text-text-primary truncate">{c.title}</p>
                  </div>
                  <p className="text-xs text-text-tertiary mt-1.5">Submitted {new Date(c.createdAt).toLocaleDateString()}</p>
                  {c.description && <p className="text-xs text-text-secondary mt-1 line-clamp-2">{c.description}</p>}
                </div>
                <div className="flex-shrink-0">
                  <Badge variant={c.status === "approved" ? "success" : c.status === "rejected" ? "destructive" : "warning"}>
                    {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                  </Badge>
                  {c.status === "rejected" && c.rejectReason && <p className="text-xs text-destructive mt-2 max-w-[200px]">Reason: {c.rejectReason}</p>}
                  {c.status === "approved" && c.approvedAt && <p className="text-xs text-success mt-2">Approved {new Date(c.approvedAt).toLocaleDateString()}</p>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
