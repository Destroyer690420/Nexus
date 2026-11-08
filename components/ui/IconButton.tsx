"use client";

import React from "react";

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "ghost" | "secondary" | "primary" | "tonal";
  size?: "sm" | "md" | "lg";
  ariaLabel: string;
}

export function IconButton({
  children,
  variant = "ghost",
  size = "md",
  ariaLabel,
  className = "",
  disabled,
  ...props
}: IconButtonProps) {
  const sizeClasses = {
    sm: "w-10 h-10 min-w-[40px] rounded-[12px] text-base",
    md: "w-11 h-11 min-w-[44px] rounded-[14px] text-lg",
    lg: "w-13 h-13 min-w-[52px] rounded-[16px] text-xl",
  }[size];

  const variantClasses = {
    ghost:
      "bg-transparent text-ink-2 hover:bg-surface-2 hover:text-ink active:scale-95 border-0 shadow-none",
    secondary:
      "bg-surface text-ink border-2 border-line shadow-[0_3px_0_var(--line-strong)] active:shadow-[0_1px_0_var(--line-strong)] active:translate-y-[2px]",
    primary:
      "bg-berry text-berry-on shadow-[0_3px_0_var(--berry-ledge)] active:shadow-[0_1px_0_var(--berry-ledge)] active:translate-y-[2px]",
    tonal:
      "bg-berry-tint text-berry-deep shadow-[0_3px_0_var(--line-strong)] active:shadow-[0_1px_0_var(--line-strong)] active:translate-y-[2px]",
  }[variant];

  return (
    <button
      {...props}
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      className={`inline-flex items-center justify-center select-none cursor-pointer transition-[transform,box-shadow,background-color] duration-[90ms] disabled:opacity-40 disabled:cursor-not-allowed ${sizeClasses} ${variantClasses} ${className}`}
    >
      {children}
    </button>
  );
}

