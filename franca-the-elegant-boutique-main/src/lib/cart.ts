import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice, type Product } from "./products";
import { BRAND } from "./config";

export type CartItem = {
  productId: string;
  cantidad: number;
  talle: string;
  color?: string;
};

const KEY = "franca:cart:v2";

function read(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function write(items: CartItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent("franca:cart"));
}

const sameLine = (a: CartItem, b: { productId: string; talle: string; color?: string }) =>
  a.productId === b.productId && a.talle === b.talle && (a.color ?? "") === (b.color ?? "");

/**
 * Hook del carrito. Persiste en localStorage y resuelve los productos
 * contra una lista pasada (que viene de Supabase via TanStack Query).
 */
export function useCart(catalog: Product[] = []) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    setItems(read());
    const onChange = () => setItems(read());
    window.addEventListener("franca:cart", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("franca:cart", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const add = useCallback((productId: string, talle: string, cantidad = 1, color?: string) => {
    const current = read();
    const idx = current.findIndex((i) => sameLine(i, { productId, talle, color }));
    if (idx >= 0) current[idx].cantidad += cantidad;
    else current.push({ productId, talle, cantidad, color });
    write(current);
  }, []);

  const remove = useCallback((productId: string, talle: string, color?: string) => {
    write(read().filter((i) => !sameLine(i, { productId, talle, color })));
  }, []);

  const setQty = useCallback((productId: string, talle: string, cantidad: number, color?: string) => {
    if (cantidad <= 0) return remove(productId, talle, color);
    const current = read().map((i) =>
      sameLine(i, { productId, talle, color }) ? { ...i, cantidad } : i,
    );
    write(current);
  }, [remove]);

  const clear = useCallback(() => write([]), []);

  const detailed = items
    .map((i) => {
      const product = catalog.find((p) => p.id === i.productId);
      return product ? { ...i, product } : null;
    })
    .filter((x): x is CartItem & { product: Product } => x !== null);

  const total = detailed.reduce((acc, i) => acc + i.product.precio * i.cantidad, 0);
  // count se basa en los items crudos para que el indicador del header funcione
  // incluso cuando el hook se usa sin catálogo (p. ej. en el Header global).
  const count = items.reduce((acc, i) => acc + i.cantidad, 0);

  return { items: detailed, total, count, add, remove, setQty, clear };
}

/**
 * Crea el pedido en Supabase + sus líneas. Devuelve el id del pedido creado.
 * Funciona tanto para invitados (user_id = null) como para usuarios logueados.
 * El total y el descuento se recalculan server-side (RPC `crear_pedido_seguro`).
 */
export async function crearPedido(params: {
  items: { product: Product; cantidad: number; talle: string; color?: string }[];
  total: number;
  cliente_nombre: string;
  cliente_telefono?: string;
  cliente_email?: string;
  direccion_envio?: string;
  notas?: string;
  metodo_pago?: string;
  codigo_descuento?: string;
}): Promise<string> {
  const { data, error } = await supabase.rpc("crear_pedido_seguro", {
    p_items: params.items.map((i) => ({
      producto_id: i.product.id,
      cantidad: i.cantidad,
      talle: i.talle,
      color: i.color ?? null,
    })),
    p_cliente_nombre: params.cliente_nombre,
    p_cliente_telefono: params.cliente_telefono ?? undefined,
    p_cliente_email: params.cliente_email ?? undefined,
    p_direccion_envio: params.direccion_envio ?? undefined,
    p_notas: params.notas ?? undefined,
    p_metodo_pago: params.metodo_pago ?? "transferencia",
    p_codigo_descuento: params.codigo_descuento ?? undefined,
  } as never);
  if (error) throw error;
  return data as string;
}

export function buildWhatsAppUrl(
  items: { product: Product; cantidad: number; talle: string; color?: string }[],
  total: number,
  cliente?: string,
  pedidoId?: string,
) {
  const lines = [
    `Hola ${BRAND.name} ✨`,
    `Quisiera confirmar el siguiente pedido:`,
    ``,
    ...items.map(
      (i) =>
        `• ${i.product.nombre} — Talle ${i.talle}${i.color ? ` — Color ${i.color}` : ""} — x${i.cantidad} — ${formatPrice(
          i.product.precio * i.cantidad,
        )}`,
    ),
    ``,
    `Total estimado: ${formatPrice(total)}`,
    cliente ? `\nNombre: ${cliente}` : ``,
    pedidoId ? `Pedido N°: ${pedidoId.slice(0, 8).toUpperCase()}` : ``,
    `\n¿Me confirman disponibilidad y forma de envío? ¡Gracias!`,
  ];
  const text = encodeURIComponent(lines.filter(Boolean).join("\n"));
  return `https://wa.me/${BRAND.whatsapp}?text=${text}`;
}
