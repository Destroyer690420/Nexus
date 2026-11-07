"use client";

import { supabase } from "./supabase";

export type FileKind = "resource" | "contribution";

/**
 * Fetches a short-lived signed URL for a file after authenticated request.
 * Returns null when unauthorized or the file is unavailable.
 */
export async function getSignedFileUrl(
  kind: FileKind,
  id: string
): Promise<string | null> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) return null;

  try {
    const res = await fetch("/api/files/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ kind, id }),
    });
    if (!res.ok) return null;
    const { url } = (await res.json()) as { url?: string };
    return url ?? null;
  } catch {
    return null;
  }
}
