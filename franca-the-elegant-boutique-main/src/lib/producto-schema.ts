/**
 * Validación de productos compartida entre el formulario del admin (navegador)
 * y las funciones de servidor que escriben en la base. Sin dependencias de Supabase.
 */
import { z } from "zod";

export const TALLES_DISPONIBLES = ["XS", "S", "M", "L", "XL", "Único"];

/** p1..p8 son las imágenes de ejemplo viejas (se aceptan por compatibilidad); lo normal es una URL. */
export const esImagenValida = (v: string) => /^p[1-8]$/.test(v) || /^https?:\/\//i.test(v);

export const productoSchema = z.object({
  slug: z.string().trim().min(1, "Slug requerido").max(80).regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones"),
  nombre: z.string().trim().min(1, "Nombre requerido").max(120),
  descripcion: z.string().trim().max(2000),
  precio: z.number({ message: "Precio inválido" }).min(0, "No puede ser negativo").max(99999999),
  costo: z.number().min(0).max(99999999).nullable().optional(),
  stock: z.number({ message: "Stock inválido" }).int("El stock tiene que ser un número entero").min(0, "No puede ser negativo").max(99999),
  imagen_url: z.string().trim().min(1, "Subí una imagen principal").max(500)
    .refine(esImagenValida, "Imagen inválida: subí una foto o pegá una URL https://"),
  categoria: z.string().trim().min(1, "Elegí una categoría").max(60),
  talles: z.array(z.string().trim().min(1).max(20)).min(1, "Elegí al menos un talle"),
  color: z.array(z.string().trim().min(1).max(60)).max(20),
  destacado: z.boolean(),
  activo: z.boolean(),
  talles_medidas: z.record(z.string().min(1).max(20), z.string().trim().max(500)).default({}),
});

export type ProductoInput = z.infer<typeof productoSchema>;

export const productoUpdateSchema = productoSchema.extend({ id: z.string().uuid() });

export const FIELD_LABELS: Record<string, string> = {
  slug: "Slug (URL)", nombre: "Nombre", descripcion: "Descripción",
  precio: "Precio", costo: "Costo", stock: "Stock",
  imagen_url: "Imagen principal", categoria: "Categoría",
  talles: "Talles", color: "Colores", talles_medidas: "Guía de talles",
};

export const slugify = (s: string) =>
  s.normalize("NFD").replace(/\p{Diacritic}/gu, "")
    .toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);

/** Valida los valores del formulario y arma lo que se manda al servidor. */
export function armarPayloadProducto(
  values: unknown,
): { ok: true; payload: ProductoInput } | { ok: false; error: string } {
  const parsed = productoSchema.safeParse(values);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = issue?.path[0] as string | undefined;
    const label = field ? FIELD_LABELS[field] ?? field : "";
    return { ok: false, error: label ? `${label}: ${issue.message}` : issue?.message ?? "Datos inválidos" };
  }
  // Solo guardamos medidas de talles elegidos y que no estén vacías.
  const medidas: Record<string, string> = {};
  for (const t of parsed.data.talles) {
    const m = (parsed.data.talles_medidas[t] ?? "").trim();
    if (m) medidas[t] = m;
  }
  return { ok: true, payload: { ...parsed.data, talles_medidas: medidas } };
}

/** Traduce errores del servidor/base a mensajes para el admin. */
export function mensajeErrorProducto(err: unknown): string {
  const msg = err instanceof Error ? err.message : typeof err === "object" && err && "message" in err ? String((err as { message: unknown }).message) : "";
  if (/productos_slug_key|duplicate key.*slug/i.test(msg)) return "Ya existe un producto con ese slug (URL). Cambiá el slug.";
  if (/row-level security|permission|denied|No autorizado/i.test(msg)) return "Sin permiso. Tu sesión puede haber expirado o tu cuenta no es admin.";
  if (/Sesi[oó]n/i.test(msg)) return msg;
  return msg || "Error al guardar";
}
