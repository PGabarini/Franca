import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false }});
await sb.auth.admin.updateUserById('9d98f5f3-c56c-46e3-8b33-ce7b148ca31c', { password: 'TestProbe!2026', email_confirm: true });
console.log('OK');
