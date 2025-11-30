// config/supabase.js
import { createClient } from "@supabase/supabase-js";
const baseUrl = "https://tekihlrxbepuudbxivsx.supabase.co";
const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRla2lobHJ4YmVwdXVkYnhpdnN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0NTIwNzgsImV4cCI6MjA3NzAyODA3OH0.48LQzn38F7Ucykh8_3HZs1KoOQ2NRnVtkL32ngNi3G8";

export const supabase = createClient(baseUrl, anonKey);

/**
 * Helper to build a public URL for an existing file.
 * NOTE: Bucket must have public policy or a signed URL should be used instead.
 */
export const getPublicUrl = (bucket, path) => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data?.publicUrl ?? null;
};
export const uploadFile = async (fileObj, bucket = "ProjectIMG") => {
  if (!fileObj) return null;

  try {
    const fileName = `${Date.now()}-${fileObj.name}`;
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, fileObj, { cacheControl: "3600", upsert: false });

    if (error) throw error;

    return getPublicUrl(bucket, data.path);
  } catch (err) {
    console.error("Supabase upload error:", err.message);
    return null;
  }
};