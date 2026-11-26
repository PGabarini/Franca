import { describe, expect, it, vi } from "vitest";

// products.ts y cart.ts importan el cliente de Supabase; para la lógica pura no hace falta.
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));

const { formatPrice, normalizeText, matchesQuery, resolveImg } = await import("./products");
const { calcularDescuento } = await import("./descuentos");
const { buildWhatsAppUrl } = await import("./cart");
const { producto } = await import("@/test/fixtures");

const sinEspacios = (s: string) => s.replace(/\s/g, " ");

describe("formatPrice", () => {
  it("formatea en pesos sin decimales", () => {
    expect(sinEspacios(formatPrice(20000))).toBe("$ 20.000");
    expect(sinEspacios(formatPrice(1234.6))).toBe("$ 1.235");
  });
});

describe("búsqueda del catálogo", () => {
  const mate = producto({ nombre: "Mate de calabaza", categoria: "Cuero", colores: ["Marrón chocolate"] });

  it("ignora tildes y mayúsculas", () => {
    expect(normalizeText("  Corazón ")).toBe("corazon");
    expect(matchesQuery(mate, "MARRON")).toBe(true);
  });
  it("exige que estén todas las palabras", () => {
    expect(matchesQuery(mate, "mate cuero")).toBe(true);
    expect(matchesQuery(mate, "mate plata")).toBe(false);
  });
  it("búsqueda vacía muestra todo", () => expect(matchesQuery(mate, "   ")).toBe(true));
});

describe("resolveImg", () => {
  it("usa las URLs completas tal cual y devuelve vacío para claves desconocidas", () => {
    expect(resolveImg("https://x.supabase.co/a.jpg")).toBe("https://x.supabase.co/a.jpg");
    expect(resolveImg("no-existe")).toBe("");
  });
});

describe("calcularDescuento (espejo del cálculo en la base)", () => {
  it("porcentaje redondeado", () => {
    expect(calcularDescuento(10000, { codigo: "X", tipo: "porcentaje", valor: 15 })).toBe(1500);
    expect(calcularDescuento(999, { codigo: "X", tipo: "porcentaje", valor: 10 })).toBe(100);
  });
  it("el porcentaje no pasa de 100%", () => {
    expect(calcularDescuento(5000, { codigo: "X", tipo: "porcentaje", valor: 150 })).toBe(5000);
  });
  it("monto fijo no supera el subtotal", () => {
    expect(calcularDescuento(5000, { codigo: "X", tipo: "monto_fijo", valor: 2000 })).toBe(2000);
    expect(calcularDescuento(1500, { codigo: "X", tipo: "monto_fijo", valor: 2000 })).toBe(1500);
  });
});

describe("buildWhatsAppUrl", () => {
  it("arma el mensaje con items, total y número de pedido", () => {
    const p = producto({ nombre: "Pulsera Franca", precio: 8000 });
    const url = buildWhatsAppUrl([{ product: p, cantidad: 2, talle: "Único", color: "Camel" }], 16000, "Ana", "abcdef1234");
    expect(url.startsWith("https://wa.me/")).toBe(true);
    const texto = decodeURIComponent(url.split("?text=")[1]);
    expect(texto).toContain("Pulsera Franca — Talle Único — Color Camel — x2");
    expect(texto).toContain("Nombre: Ana");
    expect(texto).toContain("Pedido N°: ABCDEF12");
  });
});
