"use client";

import React from "react";

export interface GroupedListProps {
  children: React.ReactNode;
  header?: string;
  footer?: string;
  className?: string;
}

export function GroupedList({
  children,
  header,
  footer,
  className = "",
}: GroupedListProps) {
  return (
    <div className={`w-full ${className}`}>
      {header && (
        <p className="px-4 pb-2 text-[13px] font-bold text-ink-3 tracking-normal">
          {header}
        </p>
      )}
      <div className="overflow-hidden rounded-[20px] border-2 border-line bg-surface divide-y divide-line">
        {children}
      </div>
      {footer && (
        <p className="px-4 pt-2 text-[12px] text-ink-3">
          {footer}
        </p>
      )}
    </div>
  );
}

export interface ListRowProps {
  icon?: React.ReactNode;
  iconBg?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  trailing?: React.ReactNode;
  chevron?: boolean;
  destructive?: boolean;
  onClick?: () => void;
  className?: string;
}

export function ListRow({
  icon,
  iconBg = "bg-berry-tint text-berry-deep",
  title,
  subtitle,
  trailing,
  chevron = false,
  destructive = false,
  onClick,
  className = "",
}: ListRowProps) {
  const Component = onClick ? "button" : "div";

  return (
    <Component
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`w-full flex items-center gap-3.5 px-4 py-3.5 min-h-[56px] text-left transition-colors duration-150 ${
        onClick
          ? "cursor-pointer hover:bg-surface-2 active:bg-line/40 select-none"
          : ""
      } ${className}`}
    >
      {icon && (
        <div
          className={`flex-shrink-0 w-9 h-9 rounded-[10px] flex items-center justify-center text-lg ${iconBg}`}
        >
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div
          className={`text-[15px] font-semibold truncate ${
            destructive ? "text-crimson" : "text-ink"
          }`}
        >
          {title}
        </div>
        {subtitle && (
          <div className="text-[13px] text-ink-2 truncate mt-0.5">
            {subtitle}
          </div>
        )}
      </div>
      {trailing && (
        <div className="flex-shrink-0 text-[14px] text-ink-2">
          {trailing}
        </div>
      )}
      {chevron && (
        <svg
          className="w-4 h-4 text-ink-3 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 5l7 7-7 7"
          />
        </svg>
      )}
    </Component>
  );
}

