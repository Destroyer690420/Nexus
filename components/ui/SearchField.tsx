"use client";

import React, { useRef } from "react";
import { MagnifyingGlass, XCircle } from "@phosphor-icons/react";

export interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  onClear?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
}

export function SearchField({
  value,
  onChange,
  onSubmit,
  onClear,
  placeholder = "Search resources, subjects...",
  autoFocus = false,
  className = "",
}: SearchFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClear = () => {
    onChange("");
    onClear?.();
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSubmit?.();
    }
  };

  return (
    <div className={`relative flex items-center w-full ${className}`}>
      <div className="absolute left-3.5 text-ink-3 pointer-events-none flex items-center">
        <MagnifyingGlass size={20} weight="bold" />
      </div>
      <input
        ref={inputRef}
        type="search"
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label="Search"
        className="w-full h-12 pl-11 pr-10 rounded-full border-2 border-line bg-surface text-ink text-[16px] placeholder:text-ink-3 outline-none focus:border-berry focus:ring-2 focus:ring-berry/20 transition-all"
      />
      {value.length > 0 && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          className="absolute right-3.5 text-ink-3 hover:text-ink cursor-pointer p-0.5"
        >
          <XCircle size={20} weight="fill" />
        </button>
      )}
    </div>
  );
}
