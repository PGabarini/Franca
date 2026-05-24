import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type TipoDescuento = "porcentaje" | "monto_fijo";

export type CodigoDescuento = {
  id: string;
  codigo: string;
  tipo: TipoDescuento;
  valor: number;
  activo: boolean;
  expira_at: string | null;
  created_at: string;
  updated_at: string;
};

export type DescuentoValido = {
  codigo: string;
  tipo: TipoDescuento;
  valor: number;
};

/** Calcula el descuento aplicado a un subtotal. Mirror del cálculo server-side. */
export function calcularDescuento(subtotal: number, d: DescuentoValido): number {
  if (d.tipo === "porcentaje") {
    return Math.round(subtotal * (Math.min(d.valor, 100) / 100));
  }
  return Math.min(d.valor, subtotal);
}

/** Busca un código activo y no vencido. Devuelve null si no existe / venció. */
export async function validarCodigo(codigo: string): Promise<DescuentoValido | null> {
  const norm = codigo.trim();
  if (!norm) return null;
  const { data, error } = await supabase.rpc("validar_codigo_descuento", { p_codigo: norm });
  if (error || !data || data.length === 0) return null;
  const row = data[0];
  return { codigo: row.codigo, tipo: row.tipo as TipoDescuento, valor: Number(row.valor) };
}

/* ============ Admin ============ */

export async function fetchCodigosAdmin(): Promise<CodigoDescuento[]> {
  const { data, error } = await supabase
    .from("codigos_descuento")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as CodigoDescuento[];
}

export const codigosAdminQueryOptions = () =>
  queryOptions({ queryKey: ["codigos_descuento", "admin"], queryFn: fetchCodigosAdmin });

export async function crearCodigo(input: {
  codigo: string;
  tipo: TipoDescuento;
  valor: number;
  activo: boolean;
  expira_at: string | null;
}) {
  const payload = { ...input, codigo: input.codigo.trim().toUpperCase() };
  const { error } = await supabase.from("codigos_descuento").insert(payload);
  if (error) throw error;
}

export async function actualizarCodigo(
  id: string,
  input: Partial<Omit<CodigoDescuento, "id" | "created_at" | "updated_at">>,
) {
  const payload = input.codigo ? { ...input, codigo: input.codigo.trim().toUpperCase() } : input;
  const { error } = await supabase.from("codigos_descuento").update(payload).eq("id", id);
  if (error) throw error;
}

export async function eliminarCodigo(id: string) {
  const { error } = await supabase.from("codigos_descuento").delete().eq("id", id);
  if (error) throw error;
}
