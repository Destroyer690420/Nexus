"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export interface SidebarItem {
  href: string;
  label: string;
  icon: (active: boolean) => React.ReactNode;
  badge?: number;
}

export interface SidebarProps {
  items: SidebarItem[];
  userRole?: string;
  className?: string;
}

export function Sidebar({ items, userRole, className = "" }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      aria-label="Desktop Navigation"
      className={`hidden md:flex flex-col w-64 flex-shrink-0 min-h-screen border-r-2 border-line bg-surface/85 backdrop-blur-[20px] p-4 select-none ${className}`}
    >
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-3 py-3 mb-4">
        <div className="w-10 h-10 rounded-[12px] bg-berry text-berry-on flex items-center justify-center font-display font-black text-xl shadow-[0_3px_0_var(--berry-ledge)]">
          N
        </div>
        <div>
          <span className="font-display font-black text-xl text-ink tracking-tight block">
            Nexus
          </span>
          {userRole && (
            <span className="text-[11px] font-bold text-ink-3 uppercase tracking-wider block">
              {userRole}
            </span>
          )}
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 space-y-1.5 overflow-y-auto">
        {items.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-[16px] font-display font-extrabold text-[15px] transition-all duration-150 ${
                isActive
                  ? "bg-berry-tint text-berry-deep shadow-[0_2px_0_var(--line-strong)]"
                  : "text-ink-2 hover:bg-surface-2 hover:text-ink"
              }`}
            >
              <span className="text-xl flex-shrink-0">
                {item.icon(isActive)}
              </span>
              <span className="truncate">{item.label}</span>
              {typeof item.badge === "number" && item.badge > 0 && (
                <span className="ml-auto min-w-[20px] h-5 px-1.5 bg-berry text-berry-on text-[11px] font-bold rounded-full flex items-center justify-center font-mono">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

