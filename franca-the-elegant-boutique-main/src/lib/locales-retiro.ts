import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type LocalRetiro = {
  id: string;
  nombre: string;
  direccion: string;
  ciudad: string;
  provincia: string;
  horarios: string;
  telefono: string;
  notas: string;
  orden: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
};

export type LocalRetiroInput = Partial<
  Pick<
    LocalRetiro,
    "nombre" | "direccion" | "ciudad" | "provincia" | "horarios" | "telefono" | "notas" | "orden" | "activo"
  >
>;

export async function fetchLocalesActivos(): Promise<LocalRetiro[]> {
  const { data, error } = await supabase
    .from("locales_retiro")
    .select("*")
    .eq("activo", true)
    .order("orden", { ascending: true })
    .order("nombre", { ascending: true });
  if (error) throw error;
  return (data ?? []) as LocalRetiro[];
}

export async function fetchLocalesAdmin(): Promise<LocalRetiro[]> {
  const { data, error } = await supabase
    .from("locales_retiro")
    .select("*")
    .order("orden", { ascending: true })
    .order("nombre", { ascending: true });
  if (error) throw error;
  return (data ?? []) as LocalRetiro[];
}

export const localesRetiroQueryOptions = () =>
  queryOptions({ queryKey: ["locales-retiro", "activos"], queryFn: fetchLocalesActivos });

export const localesRetiroAdminQueryOptions = () =>
  queryOptions({ queryKey: ["locales-retiro", "admin"], queryFn: fetchLocalesAdmin });

export async function crearLocal(input: LocalRetiroInput & { nombre: string }) {
  const nombre = input.nombre.trim();
  if (!nombre) throw new Error("Nombre requerido");
  if (nombre.length > 120) throw new Error("Nombre demasiado largo");
  const { error } = await supabase.from("locales_retiro").insert({
    nombre,
    direccion: input.direccion?.trim() ?? "",
    ciudad: input.ciudad?.trim() ?? "",
    provincia: input.provincia?.trim() ?? "",
    horarios: input.horarios?.trim() ?? "",
    telefono: input.telefono?.trim() ?? "",
    notas: input.notas?.trim() ?? "",
    orden: input.orden ?? 0,
    activo: input.activo ?? true,
  });
  if (error) throw error;
}

export async function actualizarLocal(id: string, input: LocalRetiroInput) {
  const payload: LocalRetiroInput = { ...input };
  for (const k of ["nombre", "direccion", "ciudad", "provincia", "horarios", "telefono", "notas"] as const) {
    const v = payload[k];
    if (typeof v === "string") payload[k] = v.trim();
  }
  const { error } = await supabase.from("locales_retiro").update(payload).eq("id", id);
  if (error) throw error;
}

export async function eliminarLocal(id: string) {
  const { error } = await supabase.from("locales_retiro").delete().eq("id", id);
  if (error) throw error;
}
