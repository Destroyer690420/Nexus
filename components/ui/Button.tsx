"use client";

import React from "react";

export type ButtonVariant =
  | "primary"     // berry 3D
  | "secondary"   // surface + line ledge 3D
  | "tonal"       // berry tint 3D
  | "ghost"       // flat text button
  | "destructive" // crimson 3D
  | "sun";        // marigold reward button

export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  icon,
  className = "",
  disabled,
  "aria-label": ariaLabelProp,
  ...props
}: ButtonProps) {
  const sizeClasses = {
    sm: "h-10 px-3.5 text-[14px] rounded-[14px]",
    md: "h-12 px-5 text-[16px] rounded-[16px]",
    lg: "h-14 px-6 text-[17px] rounded-[18px]",
  }[size];

  const variantClasses = {
    primary:
      "bg-berry text-berry-on border-0 shadow-[0_4px_0_var(--berry-ledge)] active:shadow-[0_1px_0_var(--berry-ledge)]",
    secondary:
      "bg-surface text-ink border-2 border-line shadow-[0_4px_0_var(--line-strong)] active:shadow-[0_1px_0_var(--line-strong)]",
    tonal:
      "bg-berry-tint text-berry-deep border-0 shadow-[0_4px_0_var(--line-strong)] active:shadow-[0_1px_0_var(--line-strong)]",
    ghost:
      "bg-transparent text-ink-2 hover:bg-surface-2 hover:text-ink active:bg-surface-2 border-0 shadow-none",
    destructive:
      "bg-crimson text-crimson-on border-0 shadow-[0_4px_0_var(--crimson-ledge)] active:shadow-[0_1px_0_var(--crimson-ledge)]",
    sun:
      "bg-sun text-sun-on border-0 shadow-[0_4px_0_var(--sun-ledge)] active:shadow-[0_1px_0_var(--sun-ledge)]",
  }[variant];

  const motionClass =
    variant === "ghost"
      ? "transition-colors duration-150"
      : "transition-[transform,box-shadow] duration-[90ms] ease-[cubic-bezier(0.32,0.72,0,1)] active:translate-y-[3px]";

  const accessibleName =
    ariaLabelProp ||
    (typeof children === "string" ? children : loading ? "Loading" : undefined);

  return (
    <button
      {...props}
      aria-label={accessibleName}
      aria-busy={loading ? "true" : undefined}
      disabled={disabled || loading}
      className={`relative inline-flex items-center justify-center gap-2.5 font-display font-extrabold select-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:translate-y-0 ${
        fullWidth ? "w-full" : ""
      } ${sizeClasses} ${variantClasses} ${motionClass} ${className}`}
    >
      {loading ? (
        <>
          <span className="opacity-0 flex items-center gap-2" aria-hidden="true">
            {icon}
            {children}
          </span>
          <span className="sr-only">
            {typeof children === "string" ? children : "Loading"}
          </span>
          <span className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
            <svg
              className="animate-spin h-5 w-5 text-current"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
          </span>
        </>
      ) : (
        <>
          {icon && <span className="flex-shrink-0">{icon}</span>}
          <span>{children}</span>
        </>
      )}
    </button>
  );
}
