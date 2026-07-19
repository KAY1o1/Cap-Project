import { createClient } from "@supabase/supabase-js";

const storage = {
  getItem: (k: string) =>
    window.localStorage.getItem(k),
  setItem: (k: string, v: string) => 
    window.localStorage.setItem(k,v),
  removeItem: (k: string) => 
    window.localStorage.removeItem(k),
};

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_KEY,
  { auth: { flowType: "pkce", detectSessionInUrl: false, storage } }
);