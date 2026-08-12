/*
catches the Google OAuth code after the redirect, 
exchanges it with Supabase to establish the user's session
then cleans the temporary code out of the URL.
*/

import { supabase } from "../lib/supabase";

export default defineContentScript({ // this is a WXT object
  matches: ["*://*.youtube.com/*"],
  runAt: "document_start",

  async main()
  {
    const currentSearch = window.location.search;
    const searchParams = new URLSearchParams(currentSearch);
    const code = searchParams.get("code");

    if (code === null)
    {
      return;
    }

    await supabase.auth.exchangeCodeForSession(code);

    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.delete("code");

    const cleanUrlString = currentUrl.toString();
    window.history.replaceState({}, "", cleanUrlString);
  },
});