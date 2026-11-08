"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export interface TabBarItem {
  href: string;
  label: string;
  icon: (active: boolean) => React.ReactNode;
  badge?: number;
}

export interface TabBarProps {
  items: TabBarItem[];
  className?: string;
}

export function TabBar({ items, className = "" }: TabBarProps) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Bottom Navigation"
      className={`fixed bottom-0 left-0 right-0 z-40 md:hidden glass-bar border-t border-line pb-[env(safe-area-inset-bottom)] ${className}`}
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {items.slice(0, 5).map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center py-1 transition-transform duration-[90ms] active:scale-95 ${
                isActive ? "text-berry-deep" : "text-ink-2 hover:text-ink"
              }`}
            >
              <div className="relative text-2xl">
                {item.icon(isActive)}
                {typeof item.badge === "number" && item.badge > 0 && (
                  <span className="absolute -top-1 -right-2 min-w-[18px] h-[18px] px-1 bg-berry text-berry-on text-[10px] font-bold rounded-full flex items-center justify-center font-mono">
                    {item.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[11px] font-display font-extrabold mt-0.5 tracking-tight ${
                  isActive ? "text-berry-deep font-black" : "text-ink-2"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
