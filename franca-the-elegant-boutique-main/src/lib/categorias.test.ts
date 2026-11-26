import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Mock mínimo del query builder de Supabase: registra cada operación
 * (tabla, método, filtros) y devuelve respuestas configurables por tabla+método.
 */
type Op = { table: string; method: string; payload?: unknown; filters: [string, unknown][] };
const ops: Op[] = [];
let respuestas: Record<string, { data?: unknown; error?: unknown; count?: number }> = {};

function builder(table: string) {
  const op: Op = { table, method: "select", filters: [] };
  const resolve = () => {
    ops.push(op);
    return Promise.resolve({ data: null, error: null, ...respuestas[`${table}.${op.method}`] });
  };
  const b = {
    select: () => b,
    insert: (payload: unknown) => ((op.method = "insert"), (op.payload = payload), b),
    update: (payload: unknown) => ((op.method = "update"), (op.payload = payload), b),
    delete: () => ((op.method = "delete"), b),
    eq: (col: string, val: unknown) => (op.filters.push([col, val]), b),
    order: () => b,
    single: () => resolve(),
    then: (ok: (v: unknown) => unknown, ko?: (e: unknown) => unknown) => resolve().then(ok, ko),
  };
  return b;
}

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: (table: string) => builder(table) },
}));

const {
  validarNombreCategoria, mensajeErrorCategoria, crearCategoria, actualizarCategoria,
  contarProductosEnCategoria, MAX_NOMBRE_CATEGORIA,
} = await import("./categorias");

beforeEach(() => {
  ops.length = 0;
  respuestas = {};
});

describe("validarNombreCategoria", () => {
  it("limpia espacios de más", () => {
    expect(validarNombreCategoria("  Bijou   y  accesorios ")).toBe("Bijou y accesorios");
  });
  it("rechaza vacío y nombres demasiado largos", () => {
    expect(() => validarNombreCategoria("   ")).toThrow("Nombre requerido");
    expect(() => validarNombreCategoria("x".repeat(MAX_NOMBRE_CATEGORIA + 1))).toThrow(/Máximo/);
    expect(validarNombreCategoria("x".repeat(MAX_NOMBRE_CATEGORIA))).toHaveLength(MAX_NOMBRE_CATEGORIA);
  });
});

describe("mensajeErrorCategoria", () => {
  it("traduce el error de nombre duplicado de Postgres", () => {
    expect(mensajeErrorCategoria({ message: 'duplicate key value violates unique constraint "categorias_nombre_key"' }))
      .toBe("Ya existe una categoría con ese nombre");
  });
  it("devuelve el mensaje o el fallback", () => {
    expect(mensajeErrorCategoria(new Error("otra cosa"))).toBe("otra cosa");
    expect(mensajeErrorCategoria(undefined, "Error al crear")).toBe("Error al crear");
  });
});

describe("crearCategoria", () => {
  it("inserta el nombre limpio y activa", async () => {
    await crearCategoria({ nombre: "  Cuero ", orden: 2 });
    expect(ops).toEqual([
      { table: "categorias", method: "insert", payload: { nombre: "Cuero", orden: 2, activo: true }, filters: [] },
    ]);
  });
  it("propaga errores de Supabase", async () => {
    respuestas["categorias.insert"] = { error: { message: "duplicate key" } };
    await expect(crearCategoria({ nombre: "Cuero", orden: 0 })).rejects.toEqual({ message: "duplicate key" });
  });
});

describe("actualizarCategoria", () => {
  it("al renombrar, mueve los productos de la categoría vieja a la nueva", async () => {
    respuestas["categorias.select"] = { data: { nombre: "Accesorios" } };
    respuestas["productos.update"] = { data: [{ id: "p1" }, { id: "p2" }] };

    const r = await actualizarCategoria("cat-1", { nombre: " Bijou ", orden: 1 });

    expect(r.productosActualizados).toBe(2);
    const update = ops.find((o) => o.table === "categorias" && o.method === "update");
    expect(update?.payload).toEqual({ nombre: "Bijou", orden: 1 });
    expect(update?.filters).toEqual([["id", "cat-1"]]);
    const productos = ops.find((o) => o.table === "productos");
    expect(productos).toMatchObject({ method: "update", payload: { categoria: "Bijou" }, filters: [["categoria", "Accesorios"]] });
  });

  it("si el nombre no cambia, no toca los productos", async () => {
    respuestas["categorias.select"] = { data: { nombre: "Accesorios" } };
    const r = await actualizarCategoria("cat-1", { nombre: "Accesorios", orden: 5 });
    expect(r.productosActualizados).toBe(0);
    expect(ops.some((o) => o.table === "productos")).toBe(false);
  });

  it("activar/desactivar no consulta el nombre ni toca productos", async () => {
    await actualizarCategoria("cat-1", { activo: false });
    expect(ops).toEqual([{ table: "categorias", method: "update", payload: { activo: false }, filters: [["id", "cat-1"]] }]);
  });

  it("si falla la actualización de la categoría, no toca productos", async () => {
    respuestas["categorias.select"] = { data: { nombre: "Accesorios" } };
    respuestas["categorias.update"] = { error: { message: "duplicate key" } };
    await expect(actualizarCategoria("cat-1", { nombre: "Cuero" })).rejects.toEqual({ message: "duplicate key" });
    expect(ops.some((o) => o.table === "productos")).toBe(false);
  });
});

describe("contarProductosEnCategoria", () => {
  it("cuenta por nombre de categoría", async () => {
    respuestas["productos.select"] = { count: 3 };
    expect(await contarProductosEnCategoria("Cuero")).toBe(3);
    expect(ops[0].filters).toEqual([["categoria", "Cuero"]]);
  });
});
