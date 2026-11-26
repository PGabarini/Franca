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

export const MAX_NOMBRE_CATEGORIA = 60;

/** Valida y normaliza el nombre de una categoría. Devuelve el nombre limpio o tira un Error. */
export function validarNombreCategoria(raw: string): string {
  const nombre = raw.replace(/\s+/g, " ").trim();
  if (!nombre) throw new Error("Nombre requerido");
  if (nombre.length > MAX_NOMBRE_CATEGORIA) throw new Error(`Máximo ${MAX_NOMBRE_CATEGORIA} caracteres`);
  return nombre;
}

/** Traduce errores de Supabase a mensajes para el admin. */
export function mensajeErrorCategoria(err: unknown, fallback = "Error"): string {
  const msg = err instanceof Error ? err.message : typeof err === "object" && err && "message" in err ? String((err as { message: unknown }).message) : "";
  if (/duplicate|unique/i.test(msg)) return "Ya existe una categoría con ese nombre";
  return msg || fallback;
}

export async function crearCategoria(input: { nombre: string; orden: number }) {
  const nombre = validarNombreCategoria(input.nombre);
  const { error } = await supabase.from("categorias").insert({ nombre, orden: input.orden, activo: true });
  if (error) throw error;
}

/**
 * Actualiza una categoría. Si cambia el nombre, también actualiza los productos
 * que la usaban (los productos guardan el nombre de la categoría como texto).
 * Devuelve cuántos productos se movieron al nuevo nombre.
 */
export async function actualizarCategoria(
  id: string,
  input: Partial<Pick<Categoria, "nombre" | "orden" | "activo">>,
): Promise<{ productosActualizados: number }> {
  const payload = { ...input };
  let nombreAnterior: string | null = null;

  if (typeof payload.nombre === "string") {
    payload.nombre = validarNombreCategoria(payload.nombre);
    const { data: actual, error: errActual } = await supabase
      .from("categorias")
      .select("nombre")
      .eq("id", id)
      .single();
    if (errActual) throw errActual;
    nombreAnterior = actual.nombre;
  }

  const { error } = await supabase.from("categorias").update(payload).eq("id", id);
  if (error) throw error;

  if (nombreAnterior !== null && payload.nombre && payload.nombre !== nombreAnterior) {
    const { data: movidos, error: errProd } = await supabase
      .from("productos")
      .update({ categoria: payload.nombre })
      .eq("categoria", nombreAnterior)
      .select("id");
    if (errProd) throw errProd;
    return { productosActualizados: movidos?.length ?? 0 };
  }
  return { productosActualizados: 0 };
}

/** Cuántos productos (activos o no) usan una categoría. */
export async function contarProductosEnCategoria(nombre: string): Promise<number> {
  const { count, error } = await supabase
    .from("productos")
    .select("id", { count: "exact", head: true })
    .eq("categoria", nombre);
  if (error) throw error;
  return count ?? 0;
}

export async function eliminarCategoria(id: string) {
  const { error } = await supabase.from("categorias").delete().eq("id", id);
  if (error) throw error;
}
