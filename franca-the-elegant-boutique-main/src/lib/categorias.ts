import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Categoria = {
  id: string;
  nombre: string;
  orden: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
};

export async function fetchCategoriasActivas(): Promise<Categoria[]> {
  const { data, error } = await supabase
    .from("categorias")
    .select("*")
    .eq("activo", true)
    .order("orden", { ascending: true })
    .order("nombre", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Categoria[];
}

export async function fetchCategoriasAdmin(): Promise<Categoria[]> {
  const { data, error } = await supabase
    .from("categorias")
    .select("*")
    .order("orden", { ascending: true })
    .order("nombre", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Categoria[];
}

export const categoriasQueryOptions = () =>
  queryOptions({ queryKey: ["categorias", "activas"], queryFn: fetchCategoriasActivas });

export const categoriasAdminQueryOptions = () =>
  queryOptions({ queryKey: ["categorias", "admin"], queryFn: fetchCategoriasAdmin });

export async function crearCategoria(input: { nombre: string; orden: number }) {
  const nombre = input.nombre.trim();
  if (!nombre) throw new Error("Nombre requerido");
  if (nombre.length > 60) throw new Error("Nombre demasiado largo");
  const { error } = await supabase.from("categorias").insert({ nombre, orden: input.orden, activo: true });
  if (error) throw error;
}

export async function actualizarCategoria(
  id: string,
  input: Partial<Pick<Categoria, "nombre" | "orden" | "activo">>,
) {
  const payload = { ...input };
  if (typeof payload.nombre === "string") payload.nombre = payload.nombre.trim();
  const { error } = await supabase.from("categorias").update(payload).eq("id", id);
  if (error) throw error;
}

export async function eliminarCategoria(id: string) {
  const { error } = await supabase.from("categorias").delete().eq("id", id);
  if (error) throw error;
}
