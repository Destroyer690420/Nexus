"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CaretLeft } from "@phosphor-icons/react";

export interface LargeTitleHeaderProps {
  title: string;
  subtitle?: string;
  parentName?: string;
  onBack?: () => void;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export function LargeTitleHeader({
  title,
  subtitle,
  parentName,
  onBack,
  action,
  icon,
  className = "",
}: LargeTitleHeaderProps) {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleBackClick = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <div className={`relative mb-6 ${className}`}>
      {/* Collapsed Top Bar (Translucent glass bar on scroll) */}
      <div
        className={`fixed top-0 left-0 right-0 z-30 h-14 px-4 glass-bar flex items-center justify-between transition-opacity duration-200 ${
          scrolled ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex items-center gap-1 min-w-0">
          {parentName && (
            <button
              type="button"
              onClick={handleBackClick}
              className="inline-flex items-center gap-0.5 text-berry font-display font-extrabold text-[15px] cursor-pointer hover:opacity-80 flex-shrink-0"
            >
              <CaretLeft size={20} weight="bold" />
              <span className="truncate max-w-[120px]">{parentName}</span>
            </button>
          )}
          <h2 className="text-[17px] font-display font-black text-ink truncate px-2">
            {title}
          </h2>
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>

      {/* Expanded iOS-style Header */}
      <div>
        {parentName && (
          <div className="mb-2">
            <button
              type="button"
              onClick={handleBackClick}
              className="inline-flex items-center gap-1 text-berry font-display font-extrabold text-[15px] cursor-pointer hover:opacity-80 active:translate-x-[-2px] transition-transform"
            >
              <CaretLeft size={20} weight="bold" />
              <span>{parentName}</span>
            </button>
          </div>
        )}

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              {icon && (
                <div className="w-10 h-10 rounded-[12px] bg-berry-tint text-berry-deep flex items-center justify-center flex-shrink-0 text-xl">
                  {icon}
                </div>
              )}
              <h1 className="font-display font-black text-3xl sm:text-4xl text-ink tracking-tight break-words">
                {title}
              </h1>
            </div>
            {subtitle && (
              <p className="mt-1.5 text-[15px] sm:text-[16px] text-ink-2 leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="flex-shrink-0 pt-1">{action}</div>}
        </div>
      </div>
    </div>
  );
}
