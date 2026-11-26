import { describe, expect, it } from "vitest";
import { armarPayloadProducto, mensajeErrorProducto, productoUpdateSchema, slugify } from "./producto-schema";

const valido = {
  slug: "mate-coquito",
  nombre: "Mate coquito",
  descripcion: "Mate de coco",
  precio: 12000,
  costo: null,
  stock: 18,
  imagen_url: "https://x.supabase.co/storage/v1/object/public/productos/a.jpg",
  categoria: "Accesorios",
  talles: ["Único"],
  color: [],
  destacado: false,
  activo: true,
  talles_medidas: {},
};

const error = (over: Record<string, unknown>) => {
  const r = armarPayloadProducto({ ...valido, ...over });
  return r.ok ? null : r.error;
};

describe("slugify", () => {
  it("genera URLs limpias desde el nombre", () => {
    expect(slugify("Collar Corazón <3")).toBe("collar-corazon-3");
    expect(slugify("  Mate   de calabaza!! ")).toBe("mate-de-calabaza");
    expect(slugify("x".repeat(100))).toHaveLength(80);
  });
});

describe("armarPayloadProducto", () => {
  it("acepta un producto válido", () => {
    const r = armarPayloadProducto(valido);
    expect(r.ok).toBe(true);
  });

  it("exige imagen: un producto nuevo ya no queda con la foto de ejemplo", () => {
    expect(error({ imagen_url: "" })).toBe("Imagen principal: Subí una imagen principal");
    expect(error({ imagen_url: "foto.jpg" })).toMatch(/Imagen inválida/);
    expect(error({ imagen_url: "p3" })).toBeNull(); // compatibilidad con productos viejos
  });

  it("exige elegir categoría", () => {
    expect(error({ categoria: "" })).toBe("Categoría: Elegí una categoría");
    expect(error({ categoria: "   " })).toBe("Categoría: Elegí una categoría");
  });

  it("exige al menos un talle", () => {
    expect(error({ talles: [] })).toBe("Talles: Elegí al menos un talle");
  });

  it("valida precio y stock", () => {
    expect(error({ precio: -1 })).toMatch(/^Precio: /);
    expect(error({ stock: -1 })).toMatch(/^Stock: /);
    expect(error({ stock: 1.5 })).toBe("Stock: El stock tiene que ser un número entero");
    expect(error({ stock: 0 })).toBeNull(); // 0 = sin stock, es válido
  });

  it("valida el slug", () => {
    expect(error({ slug: "Con Espacios" })).toBe("Slug (URL): Solo minúsculas, números y guiones");
  });

  it("permite varios colores (hasta 20) y rechaza más", () => {
    expect(error({ color: ["Camel", "Negro", "Marrón chocolate"] })).toBeNull();
    expect(error({ color: Array.from({ length: 21 }, (_, i) => `c${i}`) })).toMatch(/^Colores: /);
  });

  it("guarda solo las medidas de los talles elegidos y no vacías", () => {
    const r = armarPayloadProducto({
      ...valido,
      talles: ["S", "M"],
      talles_medidas: { S: " Pecho 50cm ", M: "   ", L: "Pecho 60cm" },
    });
    expect(r.ok && r.payload.talles_medidas).toEqual({ S: "Pecho 50cm" });
  });

  it("limpia espacios de los textos", () => {
    const r = armarPayloadProducto({ ...valido, nombre: "  Mate  ", categoria: " Cuero " });
    expect(r.ok && [r.payload.nombre, r.payload.categoria]).toEqual(["Mate", "Cuero"]);
  });
});

describe("productoUpdateSchema", () => {
  it("al editar exige el id del producto", () => {
    expect(productoUpdateSchema.safeParse(valido).success).toBe(false);
    expect(productoUpdateSchema.safeParse({ ...valido, id: "8f1c2a8e-4b8e-4c1e-9f0a-1b2c3d4e5f60" }).success).toBe(true);
  });
});

describe("mensajeErrorProducto", () => {
  it("traduce slug duplicado y falta de permisos", () => {
    expect(mensajeErrorProducto(new Error('duplicate key value violates unique constraint "productos_slug_key"')))
      .toMatch(/Ya existe un producto con ese slug/);
    expect(mensajeErrorProducto(new Error("No autorizado: tu cuenta no tiene rol admin."))).toMatch(/Sin permiso/);
    expect(mensajeErrorProducto(new Error("Tu sesión expiró. Iniciá sesión nuevamente."))).toBe("Tu sesión expiró. Iniciá sesión nuevamente.");
    expect(mensajeErrorProducto(undefined)).toBe("Error al guardar");
  });
});
