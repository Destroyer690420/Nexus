"use client";

import React, { useId } from "react";
import { CaretDown } from "@phosphor-icons/react";

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options?: SelectOption[];
}

export function Select({
  label,
  error,
  options,
  children,
  className = "",
  id,
  ...props
}: SelectProps) {
  const generatedId = useId();
  const selectId = id || generatedId;

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={selectId}
          className="text-[14px] font-display font-extrabold text-ink"
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        <select
          {...props}
          id={selectId}
          aria-invalid={Boolean(error)}
          className={`w-full h-12 pl-4 pr-10 rounded-[14px] border-2 bg-surface text-ink text-[16px] outline-none appearance-none transition-all cursor-pointer ${
            error
              ? "border-crimson focus:border-crimson focus:ring-2 focus:ring-crimson/20"
              : "border-line focus:border-berry focus:ring-2 focus:ring-berry/20"
          } ${className}`}
        >
          {options
            ? options.map((opt) => (
                <option key={String(opt.value)} value={opt.value}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        <div className="absolute right-3.5 pointer-events-none text-ink-3">
          <CaretDown size={18} weight="bold" />
        </div>
      </div>
      {error && (
        <p className="text-[13px] font-semibold text-crimson mt-0.5">{error}</p>
      )}
    </div>
  );
}

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  id?: string;
}

export function Switch({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  id,
}: SwitchProps) {
  const generatedId = useId();
  const switchId = id || generatedId;

  return (
    <div className="flex items-center justify-between gap-4 py-1">
      {(label || description) && (
        <div className="flex-1">
          {label && (
            <label
              htmlFor={switchId}
              className="text-[15px] font-display font-extrabold text-ink block cursor-pointer"
            >
              {label}
            </label>
          )}
          {description && (
            <p className="text-[13px] text-ink-2 mt-0.5 leading-snug">
              {description}
            </p>
          )}
        </div>
      )}
      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-berry focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
          checked ? "bg-fern" : "bg-line-strong"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
            checked ? "translate-x-6" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
