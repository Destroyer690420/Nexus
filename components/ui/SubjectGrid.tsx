"use client";

import { useRouter } from "next/navigation";

interface SubjectGridProps {
  subjects: { id: string; name: string; code: string }[];
  basePath: string; // e.g., "/dashboard/notes"
}

const SUBJECT_COLORS = [
  { bg: "rgba(79, 110, 247, 0.08)", border: "rgba(79, 110, 247, 0.18)", text: "#4f6ef7", icon: "#4f6ef7" },
  { bg: "rgba(16, 185, 129, 0.08)", border: "rgba(16, 185, 129, 0.18)", text: "#10b981", icon: "#10b981" },
  { bg: "rgba(245, 158, 11, 0.08)", border: "rgba(245, 158, 11, 0.18)", text: "#f59e0b", icon: "#f59e0b" },
  { bg: "rgba(239, 68, 68, 0.08)", border: "rgba(239, 68, 68, 0.18)", text: "#ef4444", icon: "#ef4444" },
  { bg: "rgba(139, 92, 246, 0.08)", border: "rgba(139, 92, 246, 0.18)", text: "#8b5cf6", icon: "#8b5cf6" },
  { bg: "rgba(236, 72, 153, 0.08)", border: "rgba(236, 72, 153, 0.18)", text: "#ec4899", icon: "#ec4899" },
  { bg: "rgba(6, 182, 212, 0.08)", border: "rgba(6, 182, 212, 0.18)", text: "#06b6d4", icon: "#06b6d4" },
  { bg: "rgba(249, 115, 22, 0.08)", border: "rgba(249, 115, 22, 0.18)", text: "#f97316", icon: "#f97316" },
];

export function SubjectGrid({ subjects, basePath }: SubjectGridProps) {
  const router = useRouter();

  if (subjects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
        <div className="h-16 w-16 rounded-full bg-surface-hover flex items-center justify-center mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-tertiary">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
          </svg>
        </div>
        <p className="text-sm font-medium text-text-secondary">No subjects found</p>
        <p className="text-xs text-text-tertiary mt-1">No subjects are available for your current course and semester.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      {subjects.map((subject, index) => {
        const color = SUBJECT_COLORS[index % SUBJECT_COLORS.length];
        return (
          <button
            key={subject.id}
            onClick={() => router.push(`${basePath}/${encodeURIComponent(subject.id)}`)}
            className="group relative flex flex-col items-center justify-center p-5 sm:p-6 rounded-[var(--radius-lg)] border transition-all duration-250 ease-out cursor-pointer hover:-translate-y-1 hover:shadow-lg active:translate-y-0 active:shadow-sm animate-scale-in"
            style={{
              backgroundColor: color.bg,
              borderColor: color.border,
              animationDelay: `${index * 0.04}s`,
            }}
          >
            <div
              className="h-10 w-10 sm:h-12 sm:w-12 rounded-[var(--radius-md)] flex items-center justify-center mb-3 transition-transform duration-200 group-hover:scale-110"
              style={{ backgroundColor: `${color.icon}15` }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color.icon} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
              </svg>
            </div>
            <p className="text-sm font-semibold text-text-primary text-center leading-tight">{subject.name}</p>
            <p className="text-[10px] font-medium mt-1 uppercase tracking-wider" style={{ color: color.text }}>{subject.code}</p>
          </button>
        );
      })}
    </div>
  );
}
