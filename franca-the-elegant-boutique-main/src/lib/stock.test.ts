import { describe, expect, it } from "vitest";
import {
  estadoStock, etiquetaStock, sinStock, stockDisponible, textoStockDetalle, UMBRAL_ULTIMAS_UNIDADES,
} from "./stock";

describe("stockDisponible", () => {
  it.each([
    [5, 5],
    [0, 0],
    [-3, 0],
    [2.9, 2],
    [null, 0],
    [undefined, 0],
    [Number.NaN, 0],
  ])("%s -> %s", (entrada, esperado) => {
    expect(stockDisponible(entrada as number)).toBe(esperado);
  });
});

describe("estadoStock", () => {
  it("0 es agotado (el bug reportado: antes mostraba 'Últimas unidades')", () => {
    expect(estadoStock(0)).toBe("agotado");
    expect(sinStock(0)).toBe(true);
  });

  it("negativo o vacío también es agotado", () => {
    expect(estadoStock(-1)).toBe("agotado");
    expect(estadoStock(null)).toBe("agotado");
  });

  it("1 y 2 son últimas unidades", () => {
    expect(estadoStock(1)).toBe("ultimas");
    expect(estadoStock(UMBRAL_ULTIMAS_UNIDADES - 1)).toBe("ultimas");
  });

  it("desde el umbral en adelante está disponible", () => {
    expect(estadoStock(UMBRAL_ULTIMAS_UNIDADES)).toBe("disponible");
    expect(estadoStock(50)).toBe("disponible");
    expect(sinStock(50)).toBe(false);
  });
});

describe("etiquetaStock (tarjeta del catálogo)", () => {
  it("muestra 'Sin stock' con 0", () => expect(etiquetaStock(0)).toBe("Sin stock"));
  it("muestra 'Últimas unidades' con 1 o 2", () => {
    expect(etiquetaStock(1)).toBe("Últimas unidades");
    expect(etiquetaStock(2)).toBe("Últimas unidades");
  });
  it("no muestra nada con stock normal", () => expect(etiquetaStock(3)).toBeNull());
});

describe("textoStockDetalle (página de producto)", () => {
  it.each([
    [0, "Sin stock"],
    [1, "Última unidad"],
    [2, "Últimas 2 unidades"],
    [3, "3 en stock"],
    [15, "15 en stock"],
  ])("%s -> %s", (stock, texto) => {
    expect(textoStockDetalle(stock)).toBe(texto);
  });
});
