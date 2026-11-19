"use client";

import React from "react";

export interface SegmentOption<T extends string = string> {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
}

export interface SegmentedControlProps<T extends string = string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  size?: "sm" | "md";
}

export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  className = "",
  size = "md",
}: SegmentedControlProps<T>) {
  const containerHeight = size === "sm" ? "h-10 p-1" : "h-12 p-1.5";
  const itemHeight = size === "sm" ? "text-[13px] rounded-[10px]" : "text-[15px] rounded-[12px]";

  return (
    <div
      role="tablist"
      className={`inline-flex w-full items-center justify-between rounded-[16px] bg-bg-grouped border-2 border-line ${containerHeight} ${className}`}
    >
      {options.map((opt) => {
        const isActive = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(opt.value)}
            className={`flex-1 flex items-center justify-center gap-2 h-full font-display font-extrabold cursor-pointer transition-all duration-[120ms] ease-[cubic-bezier(0.32,0.72,0,1)] ${itemHeight} ${
              isActive
                ? "bg-surface text-ink shadow-[0_2px_0_var(--line-strong)]"
                : "text-ink-2 hover:text-ink active:scale-[0.98]"
            }`}
          >
            {opt.icon && <span className="text-base flex-shrink-0">{opt.icon}</span>}
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export interface ScrollTabsProps<T extends string = string> {
  tabs: { id: T; label: string; count?: number }[];
  activeTab: T;
  onChange: (tab: T) => void;
  className?: string;
}

export function ScrollTabs<T extends string = string>({
  tabs,
  activeTab,
  onChange,
  className = "",
}: ScrollTabsProps<T>) {
  return (
    <div
      className={`flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none select-none ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`flex-shrink-0 inline-flex items-center gap-2 h-10 px-4 rounded-[14px] font-display font-extrabold text-[14px] cursor-pointer transition-all duration-[90ms] ${
              isActive
                ? "bg-berry text-berry-on shadow-[0_3px_0_var(--berry-ledge)] active:translate-y-[2px]"
                : "bg-surface text-ink border-2 border-line shadow-[0_2px_0_var(--line-strong)] hover:bg-surface-2"
            }`}
          >
            <span>{tab.label}</span>
            {typeof tab.count === "number" && (
              <span
                className={`text-[12px] px-1.5 py-0.5 rounded-full font-mono ${
                  isActive
                    ? "bg-ink text-surface"
                    : "bg-line text-ink-2"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
