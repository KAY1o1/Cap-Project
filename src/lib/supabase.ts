import { createClient } from "@supabase/supabase-js";

// save the login in chrome.storage so the popup and the youtube page both see it
const storage = {
  getItem: (k: string) =>
    chrome.storage.local.get(k).then((r) => (r[k] ?? null) as string | null),
  setItem: (k: string, v: string) => chrome.storage.local.set({ [k]: v }),
  removeItem: (k: string) => chrome.storage.local.remove(k),
};

export const supabase = createClient(
  import.meta.env.WXT_SUPABASE_URL,
  import.meta.env.WXT_SUPABASE_KEY,
  { auth: { flowType: "pkce", detectSessionInUrl: false, storage } }
);
