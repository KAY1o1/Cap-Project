import { useEffect, useState } from "react";
import { supabase } from "./supabase";

// only for pop-up windows, like open Google sign-in in a new tab
export async function login() {
  const { data } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: "https://www.youtube.com/", skipBrowserRedirect: true },
  });
  if (data?.url) window.open(data.url, "_blank");
}

export async function logout() {
  await supabase.auth.signOut();
}

// once user logs out of YouNote, user can no longer take notes
export function useSession() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const refresh = async () => {
      const all = await chrome.storage.local.get(null);
      const key = Object.keys(all).find((k) => k.endsWith("-auth-token"));
      try {
        setEmail(key ? JSON.parse(all[key] as string).user.email : null);
      } catch {
        setEmail(null);
      }
    };
    refresh();

    chrome.storage.onChanged.addListener(refresh);
    return () => chrome.storage.onChanged.removeListener(refresh);
  }, []);

  return email;
}
