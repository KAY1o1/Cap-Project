import { supabase } from './supabase';

export async function getCurrentUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
}

export async function ensureProfile(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Insert or update profile information matching your table schema
  await supabase.from('profiles').upsert({
    id: user.id,
    email: user.email,
    updated_at: new Date().toISOString(),
  });
}