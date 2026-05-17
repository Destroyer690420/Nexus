"use client";

import { type ButtonHTMLAttributes, forwardRef } from "react";
import { LoadingSpinner } from "./LoadingSpinner";

type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-white hover:bg-accent-hover active:scale-[0.97] shadow-sm shadow-accent/20 hover:shadow-md hover:shadow-accent/25",
  secondary:
    "bg-surface text-text-primary border border-border hover:bg-surface-hover active:scale-[0.97] shadow-sm",
  ghost:
    "bg-transparent text-text-secondary hover:bg-surface-hover hover:text-text-primary active:scale-[0.97]",
  destructive:
    "bg-destructive text-white hover:opacity-90 active:scale-[0.97] shadow-sm shadow-destructive/20",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", loading = false, disabled, children, className = "", ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] px-4 py-2.5 text-sm font-medium transition-all duration-200 ease-out disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 cursor-pointer ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {loading && <LoadingSpinner size="sm" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
