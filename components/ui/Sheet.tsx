"use client";

import React, { useEffect, useRef } from "react";
import { X } from "@phosphor-icons/react";
import { Button } from "./Button";

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  className = "",
}: SheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  // Handle Escape key and scroll lock
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex flex-col justify-end md:justify-center md:items-center"
    >
      {/* Backdrop overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-ink/40 backdrop-blur-sm transition-opacity duration-200"
      />

      {/* Sheet Content: bottom sheet on phone, modal dialog on desktop */}
      <div
        ref={sheetRef}
        className={`relative z-10 w-full md:max-w-lg max-h-[85vh] overflow-y-auto bg-surface border-t-2 md:border-2 border-line rounded-t-[28px] md:rounded-[24px] shadow-[0_20px_60px_-12px_rgba(42,24,48,0.28)] p-6 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] overscroll-contain ${className}`}
      >
        {/* Grabber bar on mobile */}
        <div className="md:hidden flex justify-center pb-3">
          <div className="w-12 h-1.5 rounded-full bg-line-strong" />
        </div>

        {/* Header */}
        {(title || description) && (
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              {title && (
                <h3 className="font-display font-black text-xl sm:text-2xl text-ink">
                  {title}
                </h3>
              )}
              {description && (
                <p className="text-[14px] text-ink-2 mt-1 leading-relaxed">
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="w-8 h-8 rounded-full flex items-center justify-center text-ink-3 hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
            >
              <X size={20} weight="bold" />
            </button>
          </div>
        )}

        {children}
      </div>
    </div>
  );
}

export interface ConfirmSheetProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
}

export function ConfirmSheet({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  loading = false,
}: ConfirmSheetProps) {
  return (
    <Sheet open={open} onClose={onClose} title={title} description={description}>
      <div className="flex flex-col sm:flex-row gap-3 mt-6">
        <Button
          variant="secondary"
          onClick={onClose}
          disabled={loading}
          fullWidth
        >
          {cancelLabel}
        </Button>
        <Button
          variant={destructive ? "destructive" : "primary"}
          onClick={onConfirm}
          loading={loading}
          fullWidth
        >
          {confirmLabel}
        </Button>
      </div>
    </Sheet>
  );
}
