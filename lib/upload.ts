"use client";

import { supabase } from "./supabase";

const MAX_FILE_SIZE = 20_000_000; // 20MB limit (Telegram Bot API download cap)

export interface UploadResult {
  fileId: string;
  duplicate?: boolean;
  publicUrl?: string;
  path?: string;
}

/**
 * Computes SHA-256 hex digest of a File in the browser using Web Crypto.
 */
async function computeSha256(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const digestBuffer = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digestBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Uploads a file via the Cloudflare Pages Telegram gateway with signed tokens
 * and client progress reporting.
 */
export async function uploadFile(
  file: File,
  onProgress?: (pct: number) => void
): Promise<UploadResult> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      `File size (${(file.size / 1_000_000).toFixed(1)} MB) exceeds the 20MB Telegram limit`
    );
  }

  if (file.size === 0) {
    throw new Error("File is empty");
  }

  onProgress?.(5);

  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error("Not authenticated");

  // Step 1: Compute client-side SHA-256
  const sha256 = await computeSha256(file);
  onProgress?.(15);

  // Step 2: Request signed upload ticket
  const ticketRes = await fetch("/api/files/ticket", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: file.name,
      size: file.size,
      sha256,
      mime: file.type || "application/octet-stream",
    }),
  });

  if (!ticketRes.ok) {
    let msg = "Failed to obtain upload ticket";
    try {
      const err = await ticketRes.json();
      msg = err.error || msg;
    } catch {}
    throw new Error(msg);
  }

  const ticketData = await ticketRes.json();

  // If identical file already exists on server, return instantly (deduplication)
  if (ticketData.duplicate && ticketData.fileId) {
    onProgress?.(100);
    return {
      fileId: ticketData.fileId,
      duplicate: true,
      publicUrl: "",
    };
  }

  const { ticket, uploadUrl } = ticketData;
  if (!ticket || !uploadUrl) {
    throw new Error("Invalid ticket response from server");
  }

  // Step 3: Stream file to gateway with progress tracking via XMLHttpRequest
  const receipt = await new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", uploadUrl);

    xhr.setRequestHeader("X-Ticket", ticket);
    xhr.setRequestHeader("X-File-Name", encodeURIComponent(file.name));
    xhr.setRequestHeader("X-File-Sha256", sha256);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && e.total > 0) {
        // Map upload progress from 20% to 90%
        const pct = 20 + Math.round((e.loaded / e.total) * 70);
        onProgress?.(pct);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          if (res.receipt) {
            resolve(res.receipt);
          } else {
            reject(new Error("Gateway did not return an upload receipt"));
          }
        } catch {
          reject(new Error("Invalid JSON response from upload gateway"));
        }
      } else {
        let msg = `Gateway upload failed (${xhr.status})`;
        try {
          const err = JSON.parse(xhr.responseText);
          msg = err.error || msg;
        } catch {}
        reject(new Error(msg));
      }
    };

    xhr.onerror = () => reject(new Error("Network error during gateway upload"));
    xhr.ontimeout = () => reject(new Error("Upload timed out"));

    xhr.send(file);
  });

  onProgress?.(92);

  // Step 4: Register receipt with server to save metadata in DB
  const registerRes = await fetch("/api/files/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ receipt }),
  });

  if (!registerRes.ok) {
    let msg = "Failed to register uploaded file";
    try {
      const err = await registerRes.json();
      msg = err.error || msg;
    } catch {}
    throw new Error(msg);
  }

  const regData = await registerRes.json();
  if (!regData.fileId) {
    throw new Error("Registration succeeded but no fileId returned");
  }

  onProgress?.(100);

  return {
    fileId: regData.fileId,
    duplicate: false,
    publicUrl: "",
  };
}
