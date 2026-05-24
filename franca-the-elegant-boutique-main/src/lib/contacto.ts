import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

export const contactoSchema = z.object({
  nombre: z.string().trim().min(1, "Ingresá tu nombre").max(80),
  email: z.string().trim().email("Email inválido").max(255),
  telefono: z.string().trim().max(30).optional().or(z.literal("")),
  asunto: z.string().trim().min(1, "Elegí un asunto").max(120),
  mensaje: z.string().trim().min(10, "Contanos un poco más (mín. 10 caracteres)").max(2000),
  // Honeypot — debe quedar vacío
  website: z.string().max(0).optional().or(z.literal("")),
});

export type ContactoInput = z.infer<typeof contactoSchema>;

export async function enviarMensajeContacto(input: ContactoInput): Promise<string> {
  const { data, error } = await supabase.rpc("crear_mensaje_contacto", {
    p_nombre: input.nombre,
    p_email: input.email,
    p_asunto: input.asunto,
    p_mensaje: input.mensaje,
    p_telefono: input.telefono || undefined,
  });
  if (error) throw new Error(error.message);
  return data as string;
}

export type MensajeContacto = {
  id: string;
  created_at: string;
  nombre: string;
  email: string;
  telefono: string | null;
  asunto: string;
  mensaje: string;
  leido: boolean;
  user_id: string | null;
};

export async function listarMensajesContacto(): Promise<MensajeContacto[]> {
  const { data, error } = await supabase
    .from("mensajes_contacto")
    .select("id, created_at, nombre, email, telefono, asunto, mensaje, leido, user_id")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as MensajeContacto[];
}

export async function marcarMensajeLeido(id: string, leido: boolean) {
  const { error } = await supabase
    .from("mensajes_contacto")
    .update({ leido })
    .eq("id", id);
  if (error) throw error;
}
