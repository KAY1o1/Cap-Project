import { supabase } from "../lib/supabase";

// authentication for non-popup windows, like 
// after Google redirects back, swap the ?code= for a session
export default defineContentScript({
  matches: ["*://*.youtube.com/*"],
  runAt: "document_start",
  async main() {
    const code = new URLSearchParams(window.location.search).get("code");
    if (!code) return;
    await supabase.auth.exchangeCodeForSession(code);
    const url = new URL(window.location.href);
    url.searchParams.delete("code");
    window.history.replaceState({}, "", url.toString());
  },
});
