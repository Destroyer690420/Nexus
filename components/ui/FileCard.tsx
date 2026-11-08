"use client";

import React, { useState } from "react";
import {
  FilePdf,
  FileImage,
  FileDoc,
  FilePpt,
  FileXls,
  FileZip,
  File as FileGeneric,
  ArrowSquareOut,
  DownloadSimple,
} from "@phosphor-icons/react";
import { openFile } from "@/lib/file-client";
import { Chip } from "./StatusPill";

export interface FileCardProps {
  id?: string;
  title: string;
  fileRef: string; // fileId or fileUrl
  description?: string;
  sizeBytes?: number;
  mime?: string;
  tags?: string[];
  unit?: number;
  year?: number;
  className?: string;
}

export function FileCard({
  title,
  fileRef,
  description,
  sizeBytes,
  mime,
  tags = [],
  unit,
  year,
  className = "",
}: FileCardProps) {
  const [opening, setOpening] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const formatSize = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileType = () => {
    const lower = (title + " " + (mime || "") + " " + fileRef).toLowerCase();
    if (lower.includes(".pdf") || lower.includes("application/pdf")) {
      return {
        label: "PDF",
        icon: <FilePdf size={24} weight="fill" />,
        color: "bg-crimson-tint text-crimson-deep border-crimson-deep/20",
      };
    }
    if (
      lower.includes(".png") ||
      lower.includes(".jpg") ||
      lower.includes(".jpeg") ||
      lower.includes(".webp") ||
      lower.includes("image/")
    ) {
      return {
        label: "IMAGE",
        icon: <FileImage size={24} weight="fill" />,
        color: "bg-fern-tint text-fern-deep border-fern-deep/20",
      };
    }
    if (lower.includes(".docx") || lower.includes("word")) {
      return {
        label: "DOCX",
        icon: <FileDoc size={24} weight="fill" />,
        color: "bg-sun-tint text-sun-deep border-sun-deep/20",
      };
    }
    if (lower.includes(".pptx") || lower.includes("presentation")) {
      return {
        label: "PPTX",
        icon: <FilePpt size={24} weight="fill" />,
        color: "bg-tangerine-tint text-tangerine-deep border-tangerine-deep/20",
      };
    }
    if (lower.includes(".xlsx") || lower.includes("spreadsheet")) {
      return {
        label: "XLSX",
        icon: <FileXls size={24} weight="fill" />,
        color: "bg-fern-tint text-fern-deep border-fern-deep/20",
      };
    }
    if (lower.includes(".zip") || lower.includes("archive")) {
      return {
        label: "ZIP",
        icon: <FileZip size={24} weight="fill" />,
        color: "bg-berry-tint text-berry-deep border-berry-deep/20",
      };
    }
    return {
      label: "FILE",
      icon: <FileGeneric size={24} weight="fill" />,
      color: "bg-bg-grouped text-ink border-line",
    };
  };

  const fileType = getFileType();

  const handleOpen = async () => {
    if (!fileRef || opening || downloading) return;
    setOpening(true);
    try {
      await openFile(fileRef, "inline");
    } catch (err) {
      alert((err as Error).message || "Failed to open file.");
    } finally {
      setOpening(false);
    }
  };

  const handleDownload = async () => {
    if (!fileRef || opening || downloading) return;
    setDownloading(true);
    try {
      await openFile(fileRef, "attachment");
    } catch (err) {
      alert((err as Error).message || "Failed to download file.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      className={`p-4 sm:p-5 rounded-[20px] border-2 border-line bg-surface shadow-[0_3px_0_var(--line-strong)] flex flex-col justify-between gap-3 ${className}`}
    >
      <div>
        <div className="flex items-start gap-3">
          <div
            className={`w-12 h-12 rounded-[14px] border flex items-center justify-center flex-shrink-0 text-2xl shadow-[0_2px_0_var(--line-strong)] ${fileType.color}`}
          >
            {fileType.icon}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-display font-extrabold text-[15px] sm:text-[16px] text-ink leading-snug line-clamp-2">
              {title}
            </h4>
            <div className="flex items-center gap-2 mt-1 text-[12px] text-ink-3">
              <span>{fileType.label}</span>
              {sizeBytes ? <span>• {formatSize(sizeBytes)}</span> : null}
              {typeof unit === "number" && (
                <span>• {unit === 0 ? "General" : `Unit ${unit}`}</span>
              )}
              {typeof year === "number" && <span>• {year}</span>}
            </div>
          </div>
        </div>

        {description && (
          <p className="text-[13px] text-ink-2 mt-2.5 line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {tags.map((tag, i) => (
              <Chip key={i} variant="neutral" className="text-[11px] py-0.5 px-2">
                {tag}
              </Chip>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 pt-2 border-t border-line mt-1">
        <button
          type="button"
          onClick={handleOpen}
          disabled={opening || downloading}
          className="flex-1 h-10 inline-flex items-center justify-center gap-1.5 rounded-[12px] bg-berry-tint text-berry-deep font-display font-black text-[13px] cursor-pointer hover:bg-berry-tint/80 active:translate-y-[1px] transition-all disabled:opacity-50"
        >
          <ArrowSquareOut size={16} weight="bold" />
          <span>{opening ? "Opening..." : "Open"}</span>
        </button>
        <button
          type="button"
          onClick={handleDownload}
          disabled={opening || downloading}
          aria-label="Download file"
          className="h-10 px-3.5 inline-flex items-center justify-center rounded-[12px] border-2 border-line bg-surface text-ink hover:bg-surface-2 active:translate-y-[1px] cursor-pointer transition-all disabled:opacity-50"
        >
          <DownloadSimple size={18} weight="bold" />
        </button>
      </div>
    </div>
  );
}
