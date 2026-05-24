import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export async function fetchFavoritos(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("favoritos")
    .select("producto_id")
    .eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map((r) => r.producto_id as string);
}

export const favoritosQueryOptions = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["favoritos", userId ?? "anon"],
    queryFn: () => (userId ? fetchFavoritos(userId) : Promise.resolve<string[]>([])),
    enabled: !!userId,
  });

export async function agregarFavorito(userId: string, productoId: string) {
  const { error } = await supabase
    .from("favoritos")
    .insert({ user_id: userId, producto_id: productoId });
  if (error && !String(error.message).includes("duplicate")) throw error;
}

export async function quitarFavorito(userId: string, productoId: string) {
  const { error } = await supabase
    .from("favoritos")
    .delete()
    .eq("user_id", userId)
    .eq("producto_id", productoId);
  if (error) throw error;
}
