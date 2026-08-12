/*
This file creates the Supabase client, 
configures Google/PKCE authentication, 
and makes Supabase store the user's session in 
Chrome's local extension storage 
so different parts of the extension can share the login.
the jwt token is usually good for 1 hour.
*/

import { createClient } from "@supabase/supabase-js";

const customStorage = 
{
    getItem: async function (key: string): Promise<string | null>
     {
      const result = await chrome.storage.local.get(key);
      return (result[key] as string) || null;
    },

    setItem: async function (key: string, value: string): Promise<void>
    {
      await chrome.storage.local.set({ [key]: value });
    },

    removeItem: async function (key: string): Promise<void> 
    {
      await chrome.storage.local.remove(key); // token expires or supabase.auth.signOut() calls this from auth.ts
    },
};

const supabaseUrl = import.meta.env.WXT_SUPABASE_URL;
const supabaseKey = import.meta.env.WXT_SUPABASE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey, 
{
  auth: {
    flowType: "pkce",
    detectSessionInUrl: false,
    storage: customStorage,
  },
});