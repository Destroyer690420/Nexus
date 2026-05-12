"use client";

import { type InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-text-primary"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`rounded-md border border-border bg-white px-3 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary transition-all duration-150 ease-out outline-none focus:border-accent focus:ring-1 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed ${error ? "border-destructive focus:border-destructive focus:ring-destructive" : ""} ${className}`}
          {...props}
        />
        {error && (
          <span className="text-xs text-destructive">{error}</span>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
