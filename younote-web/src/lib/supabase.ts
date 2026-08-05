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
  import.meta.env.WXT_SUPABASE_URL as string,
  import.meta.env.WXT_SUPABASE_KEY as string,
  { auth: { flowType: "pkce", detectSessionInUrl: false, storage } }
);