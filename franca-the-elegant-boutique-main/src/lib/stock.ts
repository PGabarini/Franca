/** Desde cuántas unidades (exclusive) se muestra "Últimas unidades". */
export const UMBRAL_ULTIMAS_UNIDADES = 3;

export type EstadoStock = "agotado" | "ultimas" | "disponible";

/** Normaliza el stock que viene de la base (puede venir null/NaN/negativo). */
export function stockDisponible(stock: number | null | undefined): number {
  const n = Math.floor(Number(stock));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function estadoStock(stock: number | null | undefined): EstadoStock {
  const n = stockDisponible(stock);
  if (n === 0) return "agotado";
  if (n < UMBRAL_ULTIMAS_UNIDADES) return "ultimas";
  return "disponible";
}

export const sinStock = (stock: number | null | undefined) => estadoStock(stock) === "agotado";

/** Etiqueta corta para la tarjeta de producto. `null` = no mostrar etiqueta. */
export function etiquetaStock(stock: number | null | undefined): string | null {
  switch (estadoStock(stock)) {
    case "agotado":
      return "Sin stock";
    case "ultimas":
      return "Últimas unidades";
    default:
      return null;
  }
}

/** Texto para la página de producto. */
export function textoStockDetalle(stock: number | null | undefined): string {
  const n = stockDisponible(stock);
  if (n === 0) return "Sin stock";
  if (n === 1) return "Última unidad";
  if (n < UMBRAL_ULTIMAS_UNIDADES) return `Últimas ${n} unidades`;
  return `${n} en stock`;
}
