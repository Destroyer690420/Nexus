"use client";

import React from "react";

export interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular" | "card";
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className = "",
  variant = "rectangular",
  width,
  height,
}: SkeletonProps) {
  const variantStyles = {
    text: "h-4 w-full rounded-[8px]",
    circular: "rounded-full aspect-square",
    rectangular: "rounded-[14px]",
    card: "rounded-[20px] border-2 border-line h-32 w-full",
  }[variant];

  return (
    <div
      style={{ width, height }}
      aria-hidden="true"
      className={`bg-line-strong/40 animate-pulse ${variantStyles} ${className}`}
    />
  );
}

export interface BannerProps {
  children: React.ReactNode;
  variant?: "notice" | "pinned" | "warning";
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function Banner({
  children,
  variant = "notice",
  icon,
  action,
  className = "",
}: BannerProps) {
  const variantClasses = {
    notice: "bg-berry-tint text-berry-deep border-berry-deep/20",
    pinned: "bg-sun-tint text-sun-deep border-sun-deep/30",
    warning: "bg-tangerine-tint text-tangerine-deep border-tangerine-deep/30",
  }[variant];

  return (
    <div
      className={`flex items-start justify-between gap-3 p-4 rounded-[18px] border-2 ${variantClasses} ${className}`}
    >
      <div className="flex items-start gap-3 min-w-0">
        {icon && <span className="text-xl flex-shrink-0 mt-0.5">{icon}</span>}
        <div className="text-[14px] leading-relaxed font-semibold">
          {children}
        </div>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
