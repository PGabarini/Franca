import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import p1 from "@/assets/p1.jpg";
import p2 from "@/assets/p2.jpg";
import p3 from "@/assets/p3.jpg";
import p4 from "@/assets/p4.jpg";
import p5 from "@/assets/p5.jpg";
import p6 from "@/assets/p6.jpg";
import p7 from "@/assets/p7.jpg";
import p8 from "@/assets/p8.jpg";

// Mapa: la columna `imagen_url` guarda una clave (p1..p8) que el frontend
// resuelve al asset local. Si en el futuro se sube una URL completa (http...),
// se usa directamente.
const IMG_MAP: Record<string, string> = { p1, p2, p3, p4, p5, p6, p7, p8 };
export const resolveImg = (key: string) =>
  key.startsWith("http") ? key : IMG_MAP[key] ?? "";

export type Categoria = string;

export type ProductImage = { url: string; alt: string };

export type TallesMedidas = Record<string, string>;

export type Product = {
  id: string;
  slug: string;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  imagen_url: string;
  imagenes: ProductImage[];
  categoria: Categoria;
  talles: string[];
  talles_medidas: TallesMedidas;
  colores: string[];
  destacado: boolean;
};

/** Lista por defecto, sólo se usa como fallback. La fuente de verdad es la tabla `categorias`. */
export const CATEGORIES: Categoria[] = [
  "Sweaters", "Pantalones", "Camisas", "Abrigos", "Faldas", "Vestidos", "Accesorios",
];

export const formatPrice = (n: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency", currency: "ARS", maximumFractionDigits: 0,
  }).format(n);

export const normalizeText = (s: string) =>
  s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();

export function matchesQuery(product: Product, query: string): boolean {
  const q = normalizeText(query);
  if (!q) return true;
  const tokens = q.split(/\s+/).filter(Boolean);
  const haystack = normalizeText(
    [
      product.nombre,
      product.categoria,
      product.descripcion,
      product.colores.join(" "),
    ].join(" "),
  );
  return tokens.every((t) => haystack.includes(t));
}

type Row = {
  id: string; slug: string; nombre: string; descripcion: string;
  precio: number; stock: number; imagen_url: string;
  categoria: Categoria; talles: string[]; color: string[] | string | null; destacado: boolean;
  talles_medidas?: Record<string, string> | null;
};

const toColores = (c: Row["color"]): string[] => {
  if (Array.isArray(c)) return c.filter((x) => x && x.trim().length > 0);
  if (typeof c === "string" && c.trim().length > 0) return [c.trim()];
  return [];
};

const mapRow = (r: Row, extras: { url: string; alt: string }[] = []): Product => {
  const principal = resolveImg(r.imagen_url);
  const galeria: ProductImage[] = [
    { url: principal, alt: r.nombre },
    ...extras
      .map((e) => ({ url: resolveImg(e.url), alt: e.alt || r.nombre }))
      .filter((e) => e.url && e.url !== principal),
  ];
  const { color: _color, ...rest } = r;
  return {
    ...rest,
    precio: Number(r.precio),
    imagen_url: principal,
    imagenes: galeria,
    colores: toColores(r.color),
    talles_medidas: (r.talles_medidas ?? {}) as TallesMedidas,
  };
};

export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("productos")
    .select("id,slug,nombre,descripcion,precio,stock,imagen_url,categoria,talles,color,destacado,talles_medidas")
    .eq("activo", true)
    .order("destacado", { ascending: false })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as unknown as Row[]).map((r) => mapRow(r));
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from("productos")
    .select("id,slug,nombre,descripcion,precio,stock,imagen_url,categoria,talles,color,destacado,talles_medidas")
    .eq("slug", slug)
    .eq("activo", true)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as unknown as Row;
  const { data: imgs } = await supabase
    .from("producto_imagenes")
    .select("url,alt,orden")
    .eq("producto_id", row.id)
    .order("orden", { ascending: true });
  return mapRow(row, (imgs ?? []) as { url: string; alt: string }[]);
}

export const productsQueryOptions = () =>
  queryOptions({ queryKey: ["productos"], queryFn: fetchProducts });

export const productQueryOptions = (slug: string) =>
  queryOptions({ queryKey: ["productos", slug], queryFn: () => fetchProductBySlug(slug) });
