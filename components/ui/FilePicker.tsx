"use client";

import React, { useRef, useState } from "react";
import { CloudArrowUp, File as FileIcon, X } from "@phosphor-icons/react";
import { ProgressBar } from "./ProgressBar";

export interface FilePickerProps {
  file: File | null;
  onFileSelect: (file: File | null) => void;
  progress?: number | null;
  accept?: string;
  maxSizeBytes?: number;
  label?: string;
  error?: string;
  disabled?: boolean;
}

export function FilePicker({
  file,
  onFileSelect,
  progress = null,
  accept = ".pdf,.png,.jpg,.jpeg,.webp,.docx,.pptx,.xlsx,.zip",
  maxSizeBytes = 20_000_000,
  label = "Upload file",
  error,
  disabled = false,
}: FilePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const selected = files[0];
    if (selected.size > maxSizeBytes) {
      setLocalError("File exceeds 20 MB limit.");
      return;
    }
    setLocalError(null);
    onFileSelect(selected);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isUploading = typeof progress === "number";

  return (
    <div className="w-full flex flex-col gap-2">
      {label && (
        <span className="text-[14px] font-display font-extrabold text-ink">
          {label}
        </span>
      )}

      {!file ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (!disabled) handleFiles(e.dataTransfer.files);
          }}
          onClick={() => {
            if (!disabled) inputRef.current?.click();
          }}
          className={`flex flex-col items-center justify-center p-6 sm:p-8 rounded-[20px] border-2 border-dashed transition-all cursor-pointer select-none text-center ${
            dragOver
              ? "border-berry bg-berry-tint/40 scale-[0.99]"
              : "border-line-strong bg-surface hover:bg-surface-2"
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <div className="w-12 h-12 rounded-[14px] bg-berry-tint text-berry flex items-center justify-center text-2xl mb-3 shadow-[0_2px_0_var(--line-strong)]">
            <CloudArrowUp weight="bold" />
          </div>
          <p className="font-display font-extrabold text-[15px] text-ink">
            Tap to choose a file or drag it here
          </p>
          <p className="text-[13px] text-ink-2 mt-1">
            PDF, images, DOCX, PPTX, XLSX or ZIP. Up to 20 MB.
          </p>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            disabled={disabled}
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
          />
        </div>
      ) : (
        <div className="p-4 rounded-[18px] border-2 border-line bg-surface">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-[12px] bg-berry-tint text-berry flex items-center justify-center flex-shrink-0 text-xl">
                <FileIcon weight="fill" />
              </div>
              <div className="min-w-0">
                <p className="text-[14px] font-bold text-ink truncate">
                  {file.name}
                </p>
                <p className="text-[12px] text-ink-3">
                  {formatSize(file.size)}
                </p>
              </div>
            </div>

            {!isUploading && (
              <button
                type="button"
                onClick={() => onFileSelect(null)}
                aria-label="Remove file"
                className="w-8 h-8 rounded-full flex items-center justify-center text-ink-3 hover:text-crimson hover:bg-crimson-tint cursor-pointer transition-colors"
              >
                <X size={18} weight="bold" />
              </button>
            )}
          </div>

          {isUploading && (
            <div className="mt-3.5 space-y-1.5">
              <ProgressBar progress={progress} />
              <div className="flex justify-between text-[12px] text-ink-2 font-mono">
                <span>Uploading to file gateway...</span>
                <span>{Math.round(progress)}%</span>
              </div>
            </div>
          )}
        </div>
      )}

      {(error || localError) && (
        <p className="text-[13px] font-semibold text-crimson mt-0.5">
          {error || localError}
        </p>
      )}
    </div>
  );
}
