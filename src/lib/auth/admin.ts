import { createClient } from './supabase-server';

const ADMIN_EMAILS = ['sahul.hameed@prezent.ai'];

export async function getAdminUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;
  if (!ADMIN_EMAILS.includes(user.email || '')) return null;

  return user;
}

export async function isAdmin(): Promise<boolean> {
  const user = await getAdminUser();
  return user !== null;
}
