import { NextRequest } from 'next/server';
import { createClient as createServerClient } from '@/lib/auth/supabase-server';
import { isAdmin } from '@/lib/auth/admin';
import { createClient } from '@supabase/supabase-js';

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return Response.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { password, fullName } = body;

  if (!password && !fullName) {
    return Response.json({ error: 'Nothing to update.' }, { status: 400 });
  }

  if (password && password.length < 6) {
    return Response.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
  }

  const serviceClient = getServiceClient();
  if (!serviceClient) {
    return Response.json(
      { error: 'Add SUPABASE_SERVICE_ROLE_KEY to .env.local to manage users.' },
      { status: 500 }
    );
  }

  // Update auth user via service role
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updates: any = {};
  if (password) updates.password = password;
  if (fullName) updates.user_metadata = { full_name: fullName };

  const { error } = await serviceClient.auth.admin.updateUserById(id, updates);
  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  // Update profile name if provided
  if (fullName) {
    const supabase = await createServerClient();
    await supabase
      .from('profiles')
      .update({ full_name: fullName, updated_at: new Date().toISOString() })
      .eq('id', id);
  }

  return Response.json({ success: true });
}
