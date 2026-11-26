// Adaptado para Cloudflare Pages con Vite
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

function createSupabaseAdminClient() {
  // La URL es pública: puede venir de la variable de build (VITE_) o del runtime.
  const SUPABASE_URL = process.env.SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
  // La llave secreta se lee SOLO en runtime (secreto del Worker en Cloudflare,
  // o .env en desarrollo local). Nunca usar prefijo VITE_: Vite la incrustaría en el build.
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'Missing Supabase server environment variables. Ensure SUPABASE_URL (or VITE_SUPABASE_URL) and the SUPABASE_SERVICE_ROLE_KEY secret are set.'
    );
  }

  return createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    }
  });
}

let _supabaseAdmin: ReturnType<typeof createSupabaseAdminClient> | undefined;

// Server-side Supabase client with service role - bypasses RLS
export const supabaseAdmin = new Proxy({} as ReturnType<typeof createSupabaseAdminClient>, {
  get(_, prop, receiver) {
    if (!_supabaseAdmin) _supabaseAdmin = createSupabaseAdminClient();
    return Reflect.get(_supabaseAdmin, prop, receiver);
  },
});