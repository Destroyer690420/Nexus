"use client";

import type { Resource } from "@/types";

interface PDFGridProps {
  resources: Resource[];
  emptyMessage?: string;
}

export function PDFGrid({ resources, emptyMessage }: PDFGridProps) {
  if (resources.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
        <div className="h-16 w-16 rounded-full bg-surface-hover flex items-center justify-center mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-tertiary">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/>
            <path d="M14 2v6h6"/>
          </svg>
        </div>
        <p className="text-sm font-medium text-text-secondary">{emptyMessage || "No files found"}</p>
        <p className="text-xs text-text-tertiary mt-1">Check back later for new uploads.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      {resources.map((resource, index) => (
        <div
          key={resource.id}
          className="group relative flex flex-col rounded-[var(--radius-lg)] border border-border bg-surface p-4 transition-all duration-200 hover:border-accent/30 hover:shadow-md hover:-translate-y-0.5 animate-scale-in"
          style={{ animationDelay: `${index * 0.04}s` }}
        >
          {/* PDF Icon */}
          <div className="h-10 w-10 rounded-[var(--radius-md)] bg-destructive/10 flex items-center justify-center mb-3 flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-destructive">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/>
              <path d="M14 2v6h6"/>
            </svg>
          </div>

          {/* Title */}
          <p className="text-xs sm:text-sm font-medium text-text-primary line-clamp-2 leading-tight mb-2 flex-1">
            {resource.title}
          </p>

          {/* Description */}
          {resource.description && (
            <p className="text-[10px] text-text-tertiary line-clamp-1 mb-3">{resource.description}</p>
          )}

          {/* Actions */}
          <div className="flex gap-2 mt-auto">
            {resource.fileUrl && (
              <>
                <a
                  href={resource.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-1 rounded-[var(--radius-md)] bg-accent/10 px-2 py-1.5 text-[10px] sm:text-xs font-medium text-accent hover:bg-accent/20 transition-all duration-200"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    <polyline points="15 3 21 3 21 9"/>
                    <line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                  View
                </a>
                <a
                  href={resource.fileUrl}
                  download
                  className="inline-flex items-center justify-center rounded-[var(--radius-md)] border border-border px-2 py-1.5 text-[10px] sm:text-xs font-medium text-text-secondary hover:bg-surface-hover transition-all duration-200"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                </a>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
