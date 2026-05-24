import { supabase } from "@/integrations/supabase/client";
import { queryOptions } from "@tanstack/react-query";

export type DatosBancarios = {
  id: string;
  titular: string;
  cbu: string;
  alias: string;
  banco: string;
  email_contacto: string;
  notas: string;
};

export async function fetchDatosBancarios(): Promise<DatosBancarios | null> {
  const { data, error } = await supabase.rpc("get_datos_bancarios_publico");
  if (error) throw error;
  if (!data || data.length === 0) return null;
  const row = data[0];
  return { ...row, email_contacto: "" } as DatosBancarios;
}

export async function updateDatosBancarios(id: string, patch: Partial<Omit<DatosBancarios, "id">>) {
  const { error } = await supabase.from("datos_bancarios").update(patch).eq("id", id);
  if (error) throw error;
}

export const datosBancariosQueryOptions = () =>
  queryOptions({
    queryKey: ["datos_bancarios"],
    queryFn: fetchDatosBancarios,
  });
