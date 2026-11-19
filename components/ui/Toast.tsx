"use client";

import React, { useEffect } from "react";
import { CheckCircle, WarningCircle, Info, X } from "@phosphor-icons/react";

export interface ToastProps {
  open: boolean;
  onClose: () => void;
  message: string;
  type?: "success" | "error" | "info";
  durationMs?: number;
}

export function Toast({
  open,
  onClose,
  message,
  type = "success",
  durationMs = 3500,
}: ToastProps) {
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(onClose, durationMs);
    return () => clearTimeout(timer);
  }, [open, onClose, durationMs]);

  if (!open) return null;

  const config = {
    success: {
      classes: "bg-surface text-ink border-2 border-line shadow-[0_4px_0_var(--line-strong)]",
      icon: <CheckCircle size={20} weight="fill" className="text-fern" />,
    },
    error: {
      classes: "bg-crimson text-crimson-on shadow-[0_4px_0_var(--crimson-ledge)]",
      icon: <WarningCircle size={20} weight="fill" />,
    },
    info: {
      classes: "bg-surface text-ink border-2 border-line shadow-[0_4px_0_var(--line-strong)]",
      icon: <Info size={20} weight="fill" className="text-berry" />,
    },
  }[type];

  return (
    <div
      role="alert"
      className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[90%] pointer-events-auto"
    >
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-[16px] font-display font-extrabold text-[14px] transition-all duration-200 animate-slide-up ${config.classes}`}
      >
        <span className="flex-shrink-0 text-xl">{config.icon}</span>
        <span className="flex-1 leading-snug">{message}</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss toast"
          className="p-1 hover:opacity-70 cursor-pointer"
        >
          <X size={16} weight="bold" />
        </button>
      </div>
    </div>
  );
}

