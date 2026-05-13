import { supabase } from "./supabase";

export async function uploadFile(
  file: File,
  folder: string
): Promise<string> {
  const ext = file.name.split(".").pop();
  const fileName = `${folder}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from("resources")
    .upload(fileName, file);

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from("resources")
    .getPublicUrl(fileName);

  return urlData.publicUrl;
}
