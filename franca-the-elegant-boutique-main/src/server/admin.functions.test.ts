/**
 * Tests de las funciones de servidor del admin (crear/editar/borrar productos).
 * Se reemplaza createServerFn por una versión que corre validador + handler directo,
 * y supabaseAdmin por un mock que registra las operaciones contra la base.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => {
    let validator: (d: unknown) => unknown = (d) => d;
    const b = {
      inputValidator(fn: (d: unknown) => unknown) {
        validator = fn;
        return b;
      },
      handler(h: (ctx: { data: unknown }) => unknown) {
        return async ({ data }: { data: unknown }) => h({ data: validator(data) });
      },
    };
    return b;
  },
}));

type Op = { table: string; method: string; payload?: unknown; filters: [string, unknown][] };
const ops: Op[] = [];
let usuario: { id: string } | null = { id: "user-admin" };
let esAdmin = true;
let falla: Record<string, { message: string }> = {};

function builder(table: string) {
  const op: Op = { table, method: "select", filters: [] };
  const fin = (data: unknown) => {
    ops.push(op);
    const error = falla[`${table}.${op.method}`] ?? null;
    return Promise.resolve({ data: error ? null : data, error, count: esAdmin ? 1 : 0 });
  };
  const b = {
    select: () => b,
    insert: (p: unknown) => ((op.method = "insert"), (op.payload = p), b),
    update: (p: unknown) => ((op.method = "update"), (op.payload = p), b),
    delete: () => ((op.method = "delete"), b),
    eq: (c: string, v: unknown) => (op.filters.push([c, v]), b),
    order: () => b,
    single: () => fin({ id: "nuevo-id" }),
    maybeSingle: () => fin(table === "user_roles" ? (esAdmin ? { id: "rol" } : null) : null),
    then: (ok: (v: unknown) => unknown, ko?: (e: unknown) => unknown) => fin([]).then(ok, ko),
  };
  return b;
}

vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: {
    from: (t: string) => builder(t),
    auth: {
      getUser: async () => (usuario ? { data: { user: usuario }, error: null } : { data: { user: null }, error: { message: "invalid" } }),
    },
  },
}));

const { createAdminProduct, updateAdminProduct, deleteAdminProduct } = await import("./admin.functions");

const TOKEN = "t".repeat(40);
const ID = "8f1c2a8e-4b8e-4c1e-9f0a-1b2c3d4e5f60";
const producto = {
  slug: "pulsera-franca",
  nombre: "Pulsera Franca",
  descripcion: "",
  precio: 8000,
  costo: 3000,
  stock: 10,
  imagen_url: "https://x.supabase.co/storage/v1/object/public/productos/p.jpg",
  categoria: "Accesorios",
  talles: ["Único"],
  color: ["Camel", "Negro"],
  destacado: false,
  activo: true,
  talles_medidas: {},
};
const escrituras = () => ops.filter((o) => o.table === "productos");

beforeEach(() => {
  ops.length = 0;
  usuario = { id: "user-admin" };
  esAdmin = true;
  falla = {};
});

describe("createAdminProduct", () => {
  it("un admin crea el producto con los datos validados", async () => {
    const r = await createAdminProduct({ data: { accessToken: TOKEN, product: { ...producto, nombre: "  Pulsera Franca " } } });
    expect(r).toEqual({ id: "nuevo-id" });
    expect(escrituras()).toEqual([
      { table: "productos", method: "insert", payload: { ...producto, nombre: "Pulsera Franca" }, filters: [] },
    ]);
  });

  it("verifica el rol admin del usuario del token", async () => {
    await createAdminProduct({ data: { accessToken: TOKEN, product: producto } });
    expect(ops.find((o) => o.table === "user_roles")?.filters).toEqual([["user_id", "user-admin"], ["role", "admin"]]);
  });

  it("un usuario que no es admin no puede crear", async () => {
    esAdmin = false;
    await expect(createAdminProduct({ data: { accessToken: TOKEN, product: producto } })).rejects.toThrow(/No autorizado/);
    expect(escrituras()).toEqual([]);
  });

  it("sin sesión válida no puede crear", async () => {
    usuario = null;
    await expect(createAdminProduct({ data: { accessToken: TOKEN, product: producto } })).rejects.toThrow(/Sesión inválida/);
    expect(escrituras()).toEqual([]);
  });

  it("rechaza datos inválidos antes de tocar la base", async () => {
    await expect(createAdminProduct({ data: { accessToken: TOKEN, product: { ...producto, categoria: "" } } })).rejects.toThrow();
    await expect(createAdminProduct({ data: { accessToken: TOKEN, product: { ...producto, stock: -1 } } })).rejects.toThrow();
    await expect(createAdminProduct({ data: { accessToken: "corto", product: producto } })).rejects.toThrow();
    expect(ops).toEqual([]);
  });

  it("devuelve el error de la base (ej. slug repetido)", async () => {
    falla["productos.insert"] = { message: 'duplicate key value violates unique constraint "productos_slug_key"' };
    await expect(createAdminProduct({ data: { accessToken: TOKEN, product: producto } })).rejects.toThrow(/productos_slug_key/);
  });
});

describe("updateAdminProduct", () => {
  it("cambia la categoría y demás datos del producto indicado", async () => {
    await updateAdminProduct({ data: { accessToken: TOKEN, product: { ...producto, id: ID, categoria: "Cuero", stock: 0 } } });
    const [w] = escrituras();
    expect(w.method).toBe("update");
    expect(w.filters).toEqual([["id", ID]]);
    expect(w.payload).toMatchObject({ categoria: "Cuero", stock: 0 });
    expect(w.payload).not.toHaveProperty("id");
  });

  it("guarda varios colores", async () => {
    await updateAdminProduct({ data: { accessToken: TOKEN, product: { ...producto, id: ID, color: ["Camel", "Marrón chocolate", "Negro"] } } });
    expect(escrituras()[0].payload).toMatchObject({ color: ["Camel", "Marrón chocolate", "Negro"] });
  });

  it("exige un id válido y rol admin", async () => {
    await expect(updateAdminProduct({ data: { accessToken: TOKEN, product: { ...producto, id: "no-es-uuid" } } })).rejects.toThrow();
    esAdmin = false;
    await expect(updateAdminProduct({ data: { accessToken: TOKEN, product: { ...producto, id: ID } } })).rejects.toThrow(/No autorizado/);
    expect(escrituras()).toEqual([]);
  });
});

describe("deleteAdminProduct", () => {
  it("borra solo el producto indicado, y solo si es admin", async () => {
    await deleteAdminProduct({ data: { accessToken: TOKEN, id: ID } });
    expect(escrituras()).toEqual([{ table: "productos", method: "delete", filters: [["id", ID]] }]);

    ops.length = 0;
    esAdmin = false;
    await expect(deleteAdminProduct({ data: { accessToken: TOKEN, id: ID } })).rejects.toThrow(/No autorizado/);
    expect(escrituras()).toEqual([]);
  });
});
