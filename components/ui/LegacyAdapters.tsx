"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LargeTitleHeader, LargeTitleHeaderProps } from "./LargeTitleHeader";
import { TextField, TextFieldProps } from "./TextField";
import { Sheet } from "./Sheet";
import { Chip } from "./StatusPill";
import { FileCard } from "./FileCard";
import { GroupedList, ListRow } from "./GroupedList";
import { SearchField } from "./SearchField";
import type { Resource } from "@/types";

// Legacy Badge adapter
export interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "accent" | "secondary" | "outline" | "success" | "warning" | "destructive";
  className?: string;
}

export function Badge({ children, variant = "default", className = "" }: BadgeProps) {
  const variantMap: Record<string, "neutral" | "berry" | "sun" | "tangerine" | "fern"> = {
    default: "neutral",
    accent: "berry",
    secondary: "neutral",
    outline: "neutral",
    success: "fern",
    warning: "sun",
    destructive: "berry",
  };
  return <Chip variant={variantMap[variant] || "neutral"} className={className}>{children}</Chip>;
}

// Legacy Input adapter
export function Input(props: TextFieldProps) {
  return <TextField {...props} />;
}

// Legacy Modal adapter
export function Modal({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <Sheet open={isOpen} onClose={onClose} title={title}>
      {children}
    </Sheet>
  );
}

// Legacy SearchBar adapter
export function SearchBar() {
  const router = useRouter();
  const [val, setVal] = React.useState("");
  return (
    <SearchField
      placeholder="Search materials..."
      value={val}
      onChange={setVal}
      onClear={() => setVal("")}
      onSubmit={() => {
        if (val.trim()) {
          router.push(`/dashboard/search?q=${encodeURIComponent(val.trim())}`);
        }
      }}
    />
  );
}

// Legacy PageHeader adapter
export function PageHeader(props: LargeTitleHeaderProps) {
  return <LargeTitleHeader {...props} />;
}

// Legacy PDFGrid adapter
export function PDFGrid({ resources, emptyMessage }: { resources: Resource[]; emptyMessage?: string }) {
  if (resources.length === 0) {
    return (
      <div className="p-8 text-center text-ink-3">
        {emptyMessage || "No files found"}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
      {resources.map((r) => (
        <FileCard
          key={r.id}
          id={r.id}
          title={r.title}
          fileRef={r.fileId || r.fileUrl || ""}
          description={r.description}
          unit={r.unit}
          year={r.year}
          tags={r.tags}
        />
      ))}
    </div>
  );
}

// Legacy SubjectGrid adapter
export function SubjectGrid({
  subjects,
  basePath,
}: {
  subjects: { id: string; name: string; code: string }[];
  basePath: string;
}) {
  const colors = ["bg-berry-tint text-berry", "bg-sun-tint text-sun-deep", "bg-tangerine-tint text-tangerine-deep", "bg-fern-tint text-fern-deep"];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
      {subjects.map((sub, idx) => {
        const color = colors[idx % colors.length];
        return (
          <Link
            key={sub.id}
            href={`${basePath}/${encodeURIComponent(sub.id)}`}
            className="p-4 rounded-[20px] border-2 border-line bg-surface shadow-[0_3px_0_var(--line-strong)] active:shadow-[0_1px_0_var(--line-strong)] active:translate-y-[2px] transition-all flex items-center gap-3.5 group cursor-pointer"
          >
            <div className={`w-11 h-11 rounded-[14px] flex items-center justify-center font-display font-black text-lg ${color}`}>
              {sub.code.slice(0, 2) || sub.name.slice(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-display font-extrabold text-[15px] text-ink truncate group-hover:text-berry transition-colors">
                {sub.name}
              </h4>
              <p className="text-[12px] font-bold text-ink-3 uppercase mt-0.5">
                {sub.code}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

// Legacy DrillDownList adapter
export function DrillDownList({
  items,
  emptyMessage,
}: {
  items: { label: string; href: string; subtitle?: string }[];
  emptyMessage?: string;
}) {
  if (items.length === 0) {
    return <p className="text-ink-3 text-center py-6">{emptyMessage || "No items"}</p>;
  }

  return (
    <GroupedList>
      {items.map((item, idx) => (
        <Link key={idx} href={item.href} className="block">
          <ListRow
            title={item.label}
            subtitle={item.subtitle}
            chevron
          />
        </Link>
      ))}
    </GroupedList>
  );
}
