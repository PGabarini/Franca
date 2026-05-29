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

export async function fetchConsultasByProducto(productoId: string, isAdmin = false): Promise<Consulta[]> {
  // 1. Si sos admin, vas directo a la tabla y traés TODO sin filtros restrictivos
  if (isAdmin) {
    const { data, error } = await supabase
      .from("producto_consultas")
      .select("*")
      .eq("producto_id", productoId)
      .order("created_at", { ascending: false });
      
    if (error) throw error;
    return data as Consulta[];
  }

  // 2. Si es un cliente o invitado, usamos el RPC público que oculta las pendientes
  const { data, error } = await supabase.rpc("get_consultas_publicas", { p_producto_id: productoId });
  if (error) throw error;
  return ((data ?? []) as any[]).map((r) => ({ ...r, user_id: "" })) as Consulta[];
}

// Sumamos isAdmin a los parámetros y a la queryKey de React Query
export const consultasQueryOptions = (productoId: string, isAdmin = false) =>
  queryOptions({
    queryKey: ["consultas", productoId, isAdmin], 
    queryFn: () => fetchConsultasByProducto(productoId, isAdmin),
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
