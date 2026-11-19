"use client";

import React from "react";
import { Stickie, StickieMood } from "./Stickie";

export interface EmptyStateProps {
  title: string;
  description?: string;
  mood?: StickieMood;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  mood = "sleepy",
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-[24px] border-2 border-line bg-surface ${className}`}
    >
      <Stickie mood={mood} size={110} className="mb-4" />
      <h3 className="font-display font-black text-xl sm:text-2xl text-ink">
        {title}
      </h3>
      {description && (
        <p className="mt-2 text-[15px] text-ink-2 max-w-sm leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export interface StatTileProps {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
  color?: "berry" | "sun" | "tangerine" | "fern";
  className?: string;
}

export function StatTile({
  label,
  value,
  icon,
  color = "berry",
  className = "",
}: StatTileProps) {
  const colorStyles = {
    berry: "text-berry bg-berry-tint",
    sun: "text-sun-deep bg-sun-tint",
    tangerine: "text-tangerine-deep bg-tangerine-tint",
    fern: "text-fern-deep bg-fern-tint",
  }[color];

  return (
    <div
      className={`p-5 rounded-[20px] border-2 border-line bg-surface shadow-[0_3px_0_var(--line-strong)] ${className}`}
    >
      <div className="flex items-center justify-between gap-3 mb-2">
        <span className="text-[13px] font-display font-bold text-ink-2">
          {label}
        </span>
        {icon && (
          <div
            className={`w-8 h-8 rounded-[10px] flex items-center justify-center text-lg ${colorStyles}`}
          >
            {icon}
          </div>
        )}
      </div>
      <p className="font-display font-black text-3xl sm:text-4xl text-ink font-mono tracking-tight">
        {value}
      </p>
    </div>
  );
}

export interface StepperProps {
  currentStep: number;
  totalSteps: number;
  stepName?: string;
  className?: string;
}

export function Stepper({
  currentStep,
  totalSteps,
  stepName,
  className = "",
}: StepperProps) {
  const progressPercent = ((currentStep) / totalSteps) * 100;

  return (
    <div className={`w-full space-y-2 select-none ${className}`}>
      <div className="flex items-center justify-between text-[13px] font-display font-black text-ink-2">
        <span>Step {currentStep} of {totalSteps}</span>
        {stepName && <span>{stepName}</span>}
      </div>
      <div className="w-full h-3.5 rounded-full bg-line-strong overflow-hidden p-0.5">
        <div
          style={{ width: `${progressPercent}%` }}
          className="h-full rounded-full bg-berry transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] relative overflow-hidden"
        >
          <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent" />
        </div>
      </div>
    </div>
  );
}
