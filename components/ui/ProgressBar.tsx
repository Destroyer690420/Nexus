"use client";

import React from "react";

export interface ProgressBarProps {
  progress: number; // 0 to 100
  className?: string;
  ariaLabel?: string;
}

export function ProgressBar({
  progress,
  className = "",
  ariaLabel = "Progress",
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, progress));

  return (
    <div
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={`relative w-full h-4 rounded-full bg-line-strong overflow-hidden p-0.5 ${className}`}
    >
      <div
        style={{ width: `${clamped}%` }}
        className="h-full rounded-full bg-berry transition-all duration-200 ease-out relative overflow-hidden"
      >
        {/* Subtle highlight inside progress bar */}
        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent" />
      </div>
    </div>
  );
}

