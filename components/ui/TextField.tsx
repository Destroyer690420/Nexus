"use client";

import React, { useId } from "react";

export interface TextFieldProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  trailing?: React.ReactNode;
}

export function TextField({
  label,
  error,
  helperText,
  trailing,
  className = "",
  id,
  ...props
}: TextFieldProps) {
  const generatedId = useId();
  const inputId = id || generatedId;

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-[14px] font-display font-extrabold text-ink"
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        <input
          {...props}
          id={inputId}
          aria-invalid={Boolean(error)}
          className={`w-full h-12 px-4 rounded-[14px] border-2 bg-surface text-ink text-[16px] placeholder:text-ink-3 outline-none transition-all ${
            error
              ? "border-crimson focus:border-crimson focus:ring-2 focus:ring-crimson/20"
              : "border-line focus:border-berry focus:ring-2 focus:ring-berry/20"
          } ${trailing ? "pr-12" : ""} ${className}`}
        />
        {trailing && (
          <div className="absolute right-3.5 flex items-center text-ink-3">
            {trailing}
          </div>
        )}
      </div>
      {error && (
        <p className="text-[13px] font-semibold text-crimson mt-0.5">{error}</p>
      )}
      {!error && helperText && (
        <p className="text-[13px] text-ink-3 mt-0.5">{helperText}</p>
      )}
    </div>
  );
}

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function Textarea({
  label,
  error,
  helperText,
  className = "",
  id,
  rows = 3,
  ...props
}: TextareaProps) {
  const generatedId = useId();
  const textareaId = id || generatedId;

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={textareaId}
          className="text-[14px] font-display font-extrabold text-ink"
        >
          {label}
        </label>
      )}
      <textarea
        {...props}
        id={textareaId}
        rows={rows}
        aria-invalid={Boolean(error)}
        className={`w-full p-3.5 rounded-[14px] border-2 bg-surface text-ink text-[16px] placeholder:text-ink-3 outline-none transition-all resize-y ${
          error
            ? "border-crimson focus:border-crimson focus:ring-2 focus:ring-crimson/20"
            : "border-line focus:border-berry focus:ring-2 focus:ring-berry/20"
        } ${className}`}
      />
      {error && (
        <p className="text-[13px] font-semibold text-crimson mt-0.5">{error}</p>
      )}
      {!error && helperText && (
        <p className="text-[13px] text-ink-3 mt-0.5">{helperText}</p>
      )}
    </div>
  );
}

