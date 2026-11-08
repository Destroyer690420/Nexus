"use client";

import React from "react";
import { CheckCircle, Clock, XCircle } from "@phosphor-icons/react";

export type StatusType = "pending" | "approved" | "rejected";

export interface StatusPillProps {
  status: StatusType;
  label?: string;
  className?: string;
}

export function StatusPill({
  status,
  label,
  className = "",
}: StatusPillProps) {
  const config = {
    pending: {
      text: label || "Pending",
      icon: <Clock size={14} weight="bold" />,
      classes: "bg-sun-tint text-sun-deep border border-sun-deep/30",
    },
    approved: {
      text: label || "Approved",
      icon: <CheckCircle size={14} weight="bold" />,
      classes: "bg-fern-tint text-fern-deep border border-fern-deep/30",
    },
    rejected: {
      text: label || "Rejected",
      icon: <XCircle size={14} weight="bold" />,
      classes: "bg-crimson-tint text-crimson-deep border border-crimson-deep/30",
    },
  }[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-display font-extrabold select-none ${config.classes} ${className}`}
    >
      <span className="flex-shrink-0">{config.icon}</span>
      <span>{config.text}</span>
    </span>
  );
}

export interface ChipProps {
  children: React.ReactNode;
  variant?: "neutral" | "berry" | "sun" | "tangerine" | "fern" | "outline";
  onRemove?: () => void;
  onClick?: () => void;
  active?: boolean;
  className?: string;
}

export function Chip({
  children,
  variant = "neutral",
  onRemove,
  onClick,
  active = false,
  className = "",
}: ChipProps) {
  const variantStyles = {
    neutral: active
      ? "bg-berry text-berry-on border-0"
      : "bg-bg-grouped text-ink border-2 border-line hover:bg-surface",
    berry: "bg-berry-tint text-berry-deep border border-berry-deep/20",
    sun: "bg-sun-tint text-sun-deep border border-sun-deep/20",
    tangerine: "bg-tangerine-tint text-tangerine-deep border border-tangerine-deep/20",
    fern: "bg-fern-tint text-fern-deep border border-fern-deep/20",
    outline: "bg-surface text-ink border-2 border-line",
  }[variant];

  const Component = onClick ? "button" : "span";

  return (
    <Component
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-display font-bold select-none ${
        onClick ? "cursor-pointer active:scale-95 transition-transform" : ""
      } ${variantStyles} ${className}`}
    >
      <span>{children}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="hover:opacity-70 p-0.5"
          aria-label="Remove tag"
        >
          ✕
        </button>
      )}
    </Component>
  );
}
