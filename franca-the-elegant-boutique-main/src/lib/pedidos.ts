import { supabase } from "@/integrations/supabase/client";
import { queryOptions } from "@tanstack/react-query";

export type EstadoPedido =
  | "pendiente"
  | "esperando_transferencia"
  | "comprobante_recibido"
  | "pagado"
  | "enviado"
  | "cancelado";

export const ESTADO_LABELS: Record<EstadoPedido, string> = {
  pendiente: "Pendiente",
  esperando_transferencia: "Esperando transferencia",
  comprobante_recibido: "Comprobante recibido",
  pagado: "Pagado",
  enviado: "Enviado",
  cancelado: "Cancelado",
};

export type PedidoRow = {
  id: string;
  created_at: string;
  cliente_nombre: string;
  cliente_telefono: string | null;
  cliente_email: string | null;
  direccion_envio: string | null;
  total: number;
  estado: EstadoPedido;
  notas: string | null;
  comprobante_url: string | null;
  metodo_pago: string;
};

export async function fetchPedidos(): Promise<PedidoRow[]> {
  const { data, error } = await supabase
    .from("pedidos")
    .select("id, created_at, cliente_nombre, cliente_telefono, cliente_email, direccion_envio, total, estado, notas, comprobante_url, metodo_pago")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PedidoRow[];
}

export const pedidosQueryOptions = () =>
  queryOptions({ queryKey: ["pedidos", "all"], queryFn: fetchPedidos });

export async function fetchPedidoItems(pedidoId: string) {
  const { data, error } = await supabase
    .from("carrito_items")
    .select("id, nombre_snapshot, precio_unitario, cantidad, talle")
    .eq("pedido_id", pedidoId);
  if (error) throw error;
  return data ?? [];
}

export async function actualizarEstadoPedido(id: string, estado: EstadoPedido) {
  const { error } = await supabase.from("pedidos").update({ estado }).eq("id", id);
  if (error) throw error;
}

export async function subirComprobante(pedidoId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
  const path = `${pedidoId}/${Date.now()}.${ext}`;
  const { error: upErr } = await supabase.storage
    .from("comprobantes")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (upErr) throw upErr;

  const { error: updErr } = await supabase.rpc("set_comprobante_pedido", {
    p_pedido_id: pedidoId,
    p_path: path,
  });
  if (updErr) throw updErr;

  return path;
}

export async function comprobanteSignedUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from("comprobantes")
    .createSignedUrl(path, 60 * 10);
  if (error) return null;
  return data?.signedUrl ?? null;
}
