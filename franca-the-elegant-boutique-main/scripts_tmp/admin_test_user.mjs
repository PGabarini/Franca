import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = 'admin-test-' + Date.now() + '@franca.test';
const password = 'TestAdmin123!';

if (!url || !key) throw new Error('Missing backend env');
const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const { data: created, error: createError } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});
if (createError) throw createError;

const { error: roleError } = await supabase.from('user_roles').insert({ user_id: created.user.id, role: 'admin' });
if (roleError) throw roleError;

console.log(JSON.stringify({ email, password, userId: created.user.id }));
