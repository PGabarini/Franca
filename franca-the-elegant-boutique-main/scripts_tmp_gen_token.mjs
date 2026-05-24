import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const { data: u } = await sb.auth.admin.getUserById('9d98f5f3-c56c-46e3-8b33-ce7b148ca31c');
console.log('email:', u.user.email);
const { data, error } = await sb.auth.admin.generateLink({ type: 'magiclink', email: u.user.email });
if (error) { console.error(error); process.exit(1); }
// Extract token from action_link
console.log('action_link:', data.properties.action_link);
