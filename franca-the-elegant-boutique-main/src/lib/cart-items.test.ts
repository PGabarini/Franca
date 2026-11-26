import { describe, expect, it } from "vitest";
import {
  addItem, cantidadEnCarrito, parseCart, problemasDeStock, removeItem, sameLine, setItemQty,
  unidadesAgregables, type CartItem,
} from "./cart-items";

const linea = (over: Partial<CartItem> = {}): CartItem => ({ productId: "a", talle: "Único", cantidad: 1, ...over });

describe("sameLine", () => {
  it("distingue por producto, talle y color", () => {
    expect(sameLine(linea(), linea())).toBe(true);
    expect(sameLine(linea(), linea({ talle: "M" }))).toBe(false);
    expect(sameLine(linea({ color: "Camel" }), linea({ color: "Negro" }))).toBe(false);
  });
  it("sin color y color vacío son la misma línea", () => {
    expect(sameLine(linea({ color: undefined }), linea({ color: "" }))).toBe(true);
  });
});

describe("addItem", () => {
  it("agrega una línea nueva", () => {
    const r = addItem([], { productId: "a", talle: "Único" }, 1, 5);
    expect(r.agregadas).toBe(1);
    expect(r.items).toEqual([{ productId: "a", talle: "Único", color: undefined, cantidad: 1 }]);
  });

  it("suma a una línea existente sin mutar el array original", () => {
    const antes = [linea({ cantidad: 2 })];
    const r = addItem(antes, { productId: "a", talle: "Único" }, 1, 5);
    expect(r.items[0].cantidad).toBe(3);
    expect(antes[0].cantidad).toBe(2);
  });

  it("no agrega nada si el producto está sin stock", () => {
    const r = addItem([], { productId: "a", talle: "Único" }, 1, 0);
    expect(r.agregadas).toBe(0);
    expect(r.items).toEqual([]);
  });

  it("no deja pasar del stock, sumando todos los talles/colores del producto", () => {
    const items = [linea({ color: "Camel", cantidad: 2 })];
    const r = addItem(items, { productId: "a", talle: "Único", color: "Negro" }, 5, 3);
    expect(r.agregadas).toBe(1);
    expect(cantidadEnCarrito(r.items, "a")).toBe(3);
  });

  it("sin stock conocido no limita (compatibilidad con el Header que no pasa catálogo)", () => {
    const r = addItem([], { productId: "a", talle: "Único" }, 7);
    expect(r.agregadas).toBe(7);
  });
});

describe("setItemQty", () => {
  it("cantidad 0 o negativa elimina la línea", () => {
    expect(setItemQty([linea()], { productId: "a", talle: "Único" }, 0, 5)).toEqual([]);
  });

  it("no deja subir por encima del stock", () => {
    const r = setItemQty([linea({ cantidad: 3 })], { productId: "a", talle: "Único" }, 4, 3);
    expect(r[0].cantidad).toBe(3);
  });

  it("si el stock bajó, permite bajar de a uno aunque siga excedido", () => {
    const r = setItemQty([linea({ cantidad: 5 })], { productId: "a", talle: "Único" }, 4, 2);
    expect(r[0].cantidad).toBe(4);
  });

  it("ignora líneas que no existen", () => {
    const items = [linea()];
    expect(setItemQty(items, { productId: "zzz", talle: "Único" }, 3, 10)).toBe(items);
  });
});

describe("removeItem / unidadesAgregables", () => {
  it("removeItem saca solo esa línea", () => {
    const items = [linea({ talle: "S" }), linea({ talle: "M" })];
    expect(removeItem(items, { productId: "a", talle: "S" })).toEqual([linea({ talle: "M" })]);
  });

  it("unidadesAgregables descuenta lo que ya está en el carrito", () => {
    expect(unidadesAgregables([linea({ cantidad: 2 })], "a", 5)).toBe(3);
    expect(unidadesAgregables([linea({ cantidad: 6 })], "a", 5)).toBe(0);
    expect(unidadesAgregables([], "a", undefined)).toBe(Number.POSITIVE_INFINITY);
  });
});

describe("problemasDeStock", () => {
  it("detecta productos agotados o con menos stock que lo pedido", () => {
    const items = [linea({ productId: "a", cantidad: 1 }), linea({ productId: "b", cantidad: 3 }), linea({ productId: "c" })];
    const stock = new Map([["a", 0], ["b", 2], ["c", 10]]);
    expect(problemasDeStock(items, stock)).toEqual([
      { productId: "a", pedidas: 1, disponibles: 0 },
      { productId: "b", pedidas: 3, disponibles: 2 },
    ]);
  });

  it("ignora productos que ya no están en el catálogo", () => {
    expect(problemasDeStock([linea({ productId: "x" })], new Map())).toEqual([]);
  });
});

describe("parseCart", () => {
  it("lee un carrito válido", () => {
    expect(parseCart(JSON.stringify([linea()]))).toEqual([linea()]);
  });
  it("tolera basura, null y formatos viejos", () => {
    expect(parseCart(null)).toEqual([]);
    expect(parseCart("no es json")).toEqual([]);
    expect(parseCart(JSON.stringify({ items: [] }))).toEqual([]);
    expect(parseCart(JSON.stringify([{ productId: "a" }, linea({ cantidad: 0 }), linea({ cantidad: 2 })]))).toEqual([
      linea({ cantidad: 2 }),
    ]);
  });
});
