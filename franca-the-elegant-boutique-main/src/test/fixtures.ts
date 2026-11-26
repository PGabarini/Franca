import type { Product } from "@/lib/products";

let n = 0;

/** Producto de prueba con valores razonables; se pisan los campos que importan en cada test. */
export function producto(over: Partial<Product> = {}): Product {
  n += 1;
  return {
    id: `prod-${n}`,
    slug: `producto-${n}`,
    nombre: `Producto ${n}`,
    descripcion: "Descripción de prueba",
    precio: 10000,
    stock: 10,
    imagen_url: "https://example.supabase.co/storage/v1/object/public/productos/x.jpg",
    imagenes: [],
    categoria: "Accesorios",
    talles: ["Único"],
    talles_medidas: {},
    colores: [],
    destacado: false,
    ...over,
  };
}
