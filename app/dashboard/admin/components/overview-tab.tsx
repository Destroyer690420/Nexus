"use client";

import { useState, useEffect } from "react";
import {
  Users,
  ChalkboardTeacher,
  Tray,
  Files,
} from "@phosphor-icons/react";
import { StatTile, Stickie } from "@/components/ui";
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
    let active = true;
    getAdminStats()
      .then((s) => {
        if (active) setStats(s);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center gap-3">
        <Stickie mood="think" size={80} />
        <p className="font-display font-extrabold text-sm text-ink-3">
          Loading campus metrics...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <StatTile
          label="Total Users"
          value={stats.totalUsers}
          color="berry"
          icon={<Users size={22} weight="bold" />}
        />
        <StatTile
          label="Pending Faculty"
          value={stats.pendingFaculty}
          color="tangerine"
          icon={<ChalkboardTeacher size={22} weight="bold" />}
        />
        <StatTile
          label="Queue Items"
          value={stats.pendingContributions}
          color="sun"
          icon={<Tray size={22} weight="bold" />}
        />
        <StatTile
          label="Active Resources"
          value={stats.totalResources}
          color="fern"
          icon={<Files size={22} weight="bold" />}
        />
      </div>

      <div className="p-6 rounded-[22px] border-2 border-line bg-surface shadow-[0_3px_0_var(--line-strong)] space-y-2">
        <h3 className="font-display font-black text-base text-ink">
          System Health & Status
        </h3>
        <p className="text-xs font-semibold text-ink-2 leading-relaxed max-w-xl">
          Storage gateway is active on Cloudflare Pages. Telegram MTProto file storage is operational with verified zero-cost streaming, 20 MB client limit, and token signing.
        </p>
      </div>
    </div>
  );
}
