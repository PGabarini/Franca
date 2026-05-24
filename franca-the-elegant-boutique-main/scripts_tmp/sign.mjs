import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false }});
// Set a temp password and sign in
const uid = '9d98f5f3-c56c-46e3-8b33-ce7b148ca31c';
const pwd = 'TempProbe!' + Date.now();
await sb.auth.admin.updateUserById(uid, { password: pwd, email_confirm: true });
const pub = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_PUBLISHABLE_KEY, { auth: { persistSession: false }});
const { data: u } = await sb.auth.admin.getUserById(uid);
const { data, error } = await pub.auth.signInWithPassword({ email: u.user.email, password: pwd });
if (error) { console.error(error); process.exit(1); }
console.log(data.session.access_token);
