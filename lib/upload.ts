import { supabase } from "./supabase";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export async function uploadFile(file: File): Promise<{ publicUrl: string; path: string }> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File size exceeds the 50MB limit");
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error("Not authenticated");

  const urlRes = await fetch("/api/upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ fileName: file.name, contentType: file.type, fileSize: file.size }),
  });

  if (!urlRes.ok) {
    let msg = "Failed to get upload URL";
    try { const err = await urlRes.json(); msg = err.error || msg; } catch {}
    throw new Error(msg);
  }

  const { signedUrl, publicUrl, path } = await urlRes.json();

  const uploadRes = await fetch(signedUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  });

  if (!uploadRes.ok) throw new Error("File upload to storage failed");

  return { publicUrl, path };
}
