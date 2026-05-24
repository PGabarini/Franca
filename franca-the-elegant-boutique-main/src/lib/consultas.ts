import { supabase } from "@/integrations/supabase/client";
import { queryOptions } from "@tanstack/react-query";

export type Consulta = {
  id: string;
  producto_id: string;
  user_id: string;
  nombre_usuario: string;
  pregunta: string;
  respuesta: string | null;
  respondida_at: string | null;
  created_at: string;
};

export async function fetchConsultasByProducto(productoId: string): Promise<Consulta[]> {
  const { data, error } = await supabase.rpc("get_consultas_publicas", { p_producto_id: productoId });
  if (error) throw error;
  return ((data ?? []) as any[]).map((r) => ({ ...r, user_id: "" })) as Consulta[];
}

export const consultasQueryOptions = (productoId: string) =>
  queryOptions({
    queryKey: ["consultas", productoId],
    queryFn: () => fetchConsultasByProducto(productoId),
  });

export async function crearConsulta(input: {
  producto_id: string;
  user_id: string;
  nombre_usuario: string;
  pregunta: string;
}) {
  const { error } = await supabase.from("producto_consultas").insert({
    producto_id: input.producto_id,
    user_id: input.user_id,
    nombre_usuario: input.nombre_usuario.slice(0, 80),
    pregunta: input.pregunta.trim().slice(0, 500),
  });
  if (error) throw error;
}

export async function responderConsulta(id: string, respuesta: string) {
  const { error } = await supabase
    .from("producto_consultas")
    .update({ respuesta: respuesta.trim().slice(0, 1000), respondida_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function eliminarConsulta(id: string) {
  const { error } = await supabase.from("producto_consultas").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchConsultasPendientes(): Promise<Consulta[]> {
  const { data, error } = await supabase
    .from("producto_consultas")
    .select("id,producto_id,user_id,nombre_usuario,pregunta,respuesta,respondida_at,created_at")
    .is("respuesta", null)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Consulta[];
}
