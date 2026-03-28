import { NextRequest } from 'next/server';
import { createClient } from '@/lib/auth/supabase-server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { isAdmin } from '@/lib/auth/admin';

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createSupabaseClient(url, key);
}

export async function GET() {
  if (!(await isAdmin())) {
    return Response.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const supabase = await createClient();

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, avatar_url, is_admin, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Admin users error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }

  const { data: reports } = await supabase
    .from('reports')
    .select('user_id, user_email');

  const countsByUser: Record<string, number> = {};
  for (const r of reports || []) {
    if (r.user_id) {
      countsByUser[r.user_id] = (countsByUser[r.user_id] || 0) + 1;
    }
  }

  const users = (profiles || []).map(p => ({
    ...p,
    report_count: countsByUser[p.id] || 0,
  }));

  return Response.json({ users });
}

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) {
    return Response.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const body = await request.json();
  const { email, password, fullName } = body;

  if (!email || !password) {
    return Response.json({ error: 'Email and password are required.' }, { status: 400 });
  }

  if (password.length < 6) {
    return Response.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
  }

  // Use service role client for admin user creation (skips email confirmation)
  const serviceClient = getServiceClient();
  if (serviceClient) {
    const { data, error } = await serviceClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName || '' },
    });

    if (error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    return Response.json({
      success: true,
      user: { id: data.user?.id, email },
    });
  }

  // Fallback: use signUp via anon client (user needs to confirm email)
  const supabase = await createClient();
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName || '' } },
  });

  if (signUpError) {
    return Response.json({ error: signUpError.message }, { status: 400 });
  }

  return Response.json({
    success: true,
    user: { id: signUpData.user?.id, email },
    note: 'User created but needs to confirm email (add SUPABASE_SERVICE_ROLE_KEY to skip confirmation).',
  });
}
