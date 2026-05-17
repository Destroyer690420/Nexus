"use client";

import { useRouter } from "next/navigation";

interface ListItem {
  label: string;
  href: string;
  subtitle?: string;
}

interface DrillDownListProps {
  items: ListItem[];
  emptyMessage?: string;
}

export function DrillDownList({ items, emptyMessage }: DrillDownListProps) {
  const router = useRouter();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
        <div className="h-16 w-16 rounded-full bg-surface-hover flex items-center justify-center mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-tertiary">
            <path d="M3 12h18"/>
          </svg>
        </div>
        <p className="text-sm font-medium text-text-secondary">{emptyMessage || "Nothing here yet"}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map((item, index) => (
        <button
          key={item.href}
          onClick={() => router.push(item.href)}
          className="group w-full flex items-center justify-between px-4 py-3.5 sm:py-4 rounded-[var(--radius-lg)] border border-border bg-surface hover:border-accent/30 hover:bg-surface-hover hover:shadow-sm transition-all duration-200 cursor-pointer animate-slide-up"
          style={{ animationDelay: `${index * 0.04}s` }}
        >
          <div className="flex flex-col items-start">
            <span className="text-sm font-semibold text-text-primary">{item.label}</span>
            {item.subtitle && (
              <span className="text-[10px] text-text-tertiary mt-0.5">{item.subtitle}</span>
            )}
          </div>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-text-tertiary group-hover:text-accent group-hover:translate-x-0.5 transition-all duration-200 flex-shrink-0"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>
      ))}
    </div>
  );
}
