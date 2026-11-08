"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";

/**
 * Resolves a file reference (either legacy public URL or fileId) to a downloadable/viewable URL.
 */
export async function getFileLink(
  fileIdOrUrl: string,
  disposition: "inline" | "attachment" = "inline"
): Promise<string> {
  if (!fileIdOrUrl) return "";

  // If already an absolute HTTP(S) URL (legacy Supabase storage file), return as is
  if (/^https?:\/\//i.test(fileIdOrUrl)) {
    return fileIdOrUrl;
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) {
    throw new Error("You must be signed in to access this file");
  }

  const res = await fetch("/api/files/link", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      fileId: fileIdOrUrl,
      disposition,
    }),
  });

  if (!res.ok) {
    let msg = "Failed to get file access link";
    try {
      const err = await res.json();
      msg = err.error || msg;
    } catch {}
    throw new Error(msg);
  }

  const data = await res.json();
  return data.url;
}

/**
 * Opens a file in a new tab (inline) or initiates a download (attachment).
 */
export async function openFile(
  fileIdOrUrl: string,
  disposition: "inline" | "attachment" = "inline"
): Promise<void> {
  const url = await getFileLink(fileIdOrUrl, disposition);
  if (!url) return;

  if (disposition === "attachment") {
    const a = document.createElement("a");
    a.href = url;
    a.download = "";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } else {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

/**
 * React hook for components needing a direct URL to embed or preview (e.g. PDF viewer, img tag).
 */
export function useFileLink(
  fileIdOrUrl?: string | null,
  disposition: "inline" | "attachment" = "inline"
) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLink = useCallback(async () => {
    if (!fileIdOrUrl) {
      setUrl(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const resolved = await getFileLink(fileIdOrUrl, disposition);
      setUrl(resolved);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load file link";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [fileIdOrUrl, disposition]);

  useEffect(() => {
    fetchLink();
  }, [fetchLink]);

  return { url, loading, error, refresh: fetchLink };
}
