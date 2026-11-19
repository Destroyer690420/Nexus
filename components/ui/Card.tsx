"use client";

import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "flat" | "tappable" | "tinted" | "hero";
  tint?: "berry" | "sun" | "tangerine" | "fern";
  interactive?: boolean;
}

export function Card({
  children,
  variant = "flat",
  tint = "berry",
  interactive = false,
  className = "",
  onClick,
  ...props
}: CardProps) {
  const isClickable = Boolean(onClick) || interactive || variant === "tappable";

  const tintStyles = {
    berry: "bg-berry-tint border-berry-deep/20",
    sun: "bg-sun-tint border-sun-deep/20",
    tangerine: "bg-tangerine-tint border-tangerine-deep/20",
    fern: "bg-fern-tint border-fern-deep/20",
  }[tint];

  const variantClasses = {
    flat: "bg-surface border-2 border-line rounded-[20px]",
    tappable:
      "bg-surface border-2 border-line rounded-[20px] shadow-[0_4px_0_var(--line-strong)] active:shadow-[0_1px_0_var(--line-strong)] active:translate-y-[3px] transition-[transform,box-shadow] duration-[90ms] cursor-pointer",
    tinted: `${tintStyles} border-2 rounded-[20px]`,
    hero: "bg-surface border-2 border-line rounded-[24px] p-6 sm:p-8",
  }[variant];

  return (
    <div
      {...props}
      onClick={onClick}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.(e as unknown as React.MouseEvent<HTMLDivElement>);
              }
            }
          : undefined
      }
      className={`relative overflow-hidden p-4 sm:p-5 ${variantClasses} ${className}`}
    >
      {children}
    </div>
  );
}
