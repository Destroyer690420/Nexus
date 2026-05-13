"use client";

import { useState, useEffect } from "react";
import { getAdminStats } from "@/lib/queries";

export function OverviewTab() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingFaculty: 0,
    pendingContributions: 0,
    totalResources: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminStats()
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-6 w-6 border-2 border-text-tertiary border-t-accent rounded-full" />
      </div>
    );
  }

  const cards = [
    { label: "Total Users", value: stats.totalUsers, color: "text-accent" },
    { label: "Pending Faculty", value: stats.pendingFaculty, color: "text-warning" },
    { label: "Pending Contributions", value: stats.pendingContributions, color: "text-accent" },
    { label: "Total Resources", value: stats.totalResources, color: "text-success" },
  ];

  return (
    <div>
      <p className="text-sm text-text-secondary mb-6">
        Overview of your Academia OS instance.
      </p>
      <div className="grid grid-cols-2 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-lg border border-border bg-white p-5"
          >
            <p className="text-sm text-text-secondary">{card.label}</p>
            <p className={`text-3xl font-semibold mt-1 ${card.color}`}>
              {card.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
