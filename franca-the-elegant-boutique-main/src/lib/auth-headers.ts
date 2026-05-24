import { supabase } from "@/integrations/supabase/client";

export async function getAccessToken() {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.access_token) {
    throw new Error("Tu sesión expiró. Iniciá sesión nuevamente.");
  }

  return data.session.access_token;
}

export async function getAuthHeaders() {
  return { Authorization: `Bearer ${await getAccessToken()}` };
}
