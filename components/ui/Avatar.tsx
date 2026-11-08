"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Camera } from "@phosphor-icons/react";

export interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: "sm" | "md" | "lg" | "xl";
  editable?: boolean;
  onEdit?: () => void;
  className?: string;
}

export function Avatar({
  src,
  name = "User",
  size = "md",
  editable = false,
  onEdit,
  className = "",
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);

  const sizePixels = {
    sm: 36,
    md: 44,
    lg: 64,
    xl: 96,
  }[size];

  const sizeClasses = {
    sm: "w-9 h-9 text-[13px]",
    md: "w-11 h-11 text-[15px]",
    lg: "w-16 h-16 text-[22px]",
    xl: "w-24 h-24 text-[32px]",
  }[size];

  const initials = (name || "U")
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const showImage = src && !imageError;

  return (
    <div
      className={`relative inline-block flex-shrink-0 select-none ${className}`}
    >
      <div
        role="img"
        aria-label={`${name}'s avatar`}
        className={`relative overflow-hidden rounded-[28%] border-2 border-line bg-berry-tint text-berry-deep font-display font-black flex items-center justify-center shadow-[0_2px_0_var(--line-strong)] ${sizeClasses}`}
      >
        {showImage ? (
          <Image
            src={src}
            alt={name}
            width={sizePixels}
            height={sizePixels}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
            unoptimized
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>

      {editable && (
        <button
          type="button"
          onClick={onEdit}
          aria-label="Change photo"
          className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-berry text-berry-on border-2 border-surface flex items-center justify-center shadow-[0_2px_0_var(--berry-ledge)] hover:scale-105 active:scale-95 transition-transform cursor-pointer"
        >
          <Camera size={16} weight="bold" />
        </button>
      )}
    </div>
  );
}
