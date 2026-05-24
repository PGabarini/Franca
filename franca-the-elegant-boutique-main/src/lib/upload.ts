import { supabase } from "@/integrations/supabase/client";

const BUCKET = "productos";
const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export async function uploadProductImage(file: File): Promise<string> {
  if (!ALLOWED.includes(file.type)) {
    throw new Error(`Formato no soportado (${file.type || "desconocido"}). Usá JPG, PNG, WEBP o AVIF.`);
  }
  if (file.size > MAX_BYTES) {
    throw new Error("La imagen supera 5MB.");
  }
  const rawExt = (file.name.split(".").pop() || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const ext = rawExt || (file.type.split("/")[1] ?? "jpg");
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
    contentType: file.type,
  });
  if (error) {
    console.error("[uploadProductImage] storage error", error);
    throw new Error(error.message || "No se pudo subir la imagen");
  }
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
