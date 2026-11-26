/**
 * Lógica pura del carrito (sin React ni localStorage) para poder testearla.
 * El stock es por producto (no por talle/color), así que los límites se
 * calculan sumando todas las líneas del mismo producto.
 */
import { stockDisponible } from "./stock";

export type CartItem = {
  productId: string;
  cantidad: number;
  talle: string;
  color?: string;
};

export type LineKey = { productId: string; talle: string; color?: string };

export const sameLine = (a: LineKey, b: LineKey) =>
  a.productId === b.productId && a.talle === b.talle && (a.color ?? "") === (b.color ?? "");

/** Unidades de un producto en el carrito, sumando todos sus talles/colores. */
export const cantidadEnCarrito = (items: CartItem[], productId: string) =>
  items.filter((i) => i.productId === productId).reduce((acc, i) => acc + i.cantidad, 0);

/** Cuántas unidades más de ese producto se pueden agregar. `undefined` stock = sin límite conocido. */
export function unidadesAgregables(items: CartItem[], productId: string, stock?: number | null): number {
  if (stock === undefined) return Number.POSITIVE_INFINITY;
  return Math.max(0, stockDisponible(stock) - cantidadEnCarrito(items, productId));
}

export type AddResult = { items: CartItem[]; agregadas: number };

/** Agrega unidades respetando el stock. Devuelve cuántas se agregaron realmente. */
export function addItem(items: CartItem[], line: LineKey, cantidad = 1, stock?: number | null): AddResult {
  const agregables = unidadesAgregables(items, line.productId, stock);
  const agregadas = Math.max(0, Math.min(Math.floor(cantidad), agregables));
  if (agregadas === 0) return { items, agregadas: 0 };
  const idx = items.findIndex((i) => sameLine(i, line));
  const next =
    idx >= 0
      ? items.map((i, n) => (n === idx ? { ...i, cantidad: i.cantidad + agregadas } : i))
      : [...items, { productId: line.productId, talle: line.talle, color: line.color, cantidad: agregadas }];
  return { items: next, agregadas };
}

export const removeItem = (items: CartItem[], line: LineKey) => items.filter((i) => !sameLine(i, line));

/** Cambia la cantidad de una línea. <= 0 la elimina; con stock, no deja pasar del total disponible. */
export function setItemQty(items: CartItem[], line: LineKey, cantidad: number, stock?: number | null): CartItem[] {
  if (cantidad <= 0) return removeItem(items, line);
  const actual = items.find((i) => sameLine(i, line));
  if (!actual) return items;
  let nueva = Math.floor(cantidad);
  if (stock !== undefined) {
    const otrasLineas = cantidadEnCarrito(items, line.productId) - actual.cantidad;
    const maxLinea = Math.max(0, stockDisponible(stock) - otrasLineas);
    // Solo limitamos al subir: si ya había de más (bajó el stock), dejamos bajar de a uno.
    if (nueva > actual.cantidad) nueva = Math.min(nueva, Math.max(maxLinea, actual.cantidad));
  }
  return items.map((i) => (sameLine(i, line) ? { ...i, cantidad: nueva } : i));
}

export type ProblemaStock = { productId: string; pedidas: number; disponibles: number };

/** Productos del carrito que piden más unidades de las que hay (incluye los agotados). */
export function problemasDeStock(items: CartItem[], stockPorProducto: Map<string, number>): ProblemaStock[] {
  const ids = [...new Set(items.map((i) => i.productId))];
  return ids
    .filter((id) => stockPorProducto.has(id))
    .map((id) => ({
      productId: id,
      pedidas: cantidadEnCarrito(items, id),
      disponibles: stockDisponible(stockPorProducto.get(id)),
    }))
    .filter((p) => p.pedidas > p.disponibles);
}

/** Lee el carrito guardado tolerando datos viejos o corruptos. */
export function parseCart(raw: string | null): CartItem[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data
      .filter(
        (i): i is CartItem =>
          i && typeof i.productId === "string" && typeof i.talle === "string" && Number.isFinite(i.cantidad),
      )
      .map((i) => ({ ...i, cantidad: Math.floor(i.cantidad) }))
      .filter((i) => i.cantidad > 0);
  } catch {
    return [];
  }
}
