import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useSession() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    // 1. Get initial session info on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setEmail(session?.user?.email || null);
    });

    // 2. Listen to real-time auth changes (Sign In / Sign Out / Token Refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return email;
}