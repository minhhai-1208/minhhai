import { supabase } from "../config/supabase";

const uploadFile = async (file, bucketName = "ProjectIMG") => {
  if (!file) return null;

  const fileExt = file.name.split(".").pop(); // ví dụ: 'png'
  const fileName = `${Date.now()}-${Math.random()
    .toString(36)
    .substring(2)}.${fileExt}`;
  const path = fileName;

  // ⚙️ Cho phép ghi đè bằng cách thêm { upsert: true }
  const { error } = await supabase.storage.from(bucketName).upload(path, file, {
    cacheControl: "3600",
    upsert: true, // ✅ dòng quan trọng nhất
  });

  if (error) {
    console.error("Upload error:", error.message);
    return null;
  }

  // Lấy public URL
  const { data } = supabase.storage.from(bucketName).getPublicUrl(path);
  return data.publicUrl;
};

export { uploadFile };
