/*
make sure user has an authenticated session,
gets the user's ID and email, creates a username from the email
then saves/updates that information in the `profiles` table in Supabase
*/
import { supabase } from "./supabase";

export async function ensureProfile(): Promise<void>
{
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const user = session?.user;
  if (!user)
  {
    console.log("[YouNote] ensureProfile: no session yet, skipping");
    return;
  }

  const username = user.email?.split("@")[0];

  const { error } = await supabase
    .from("profiles")
    .upsert({
      id: user.id,
      email: user.email,
      username,
    });

  if (error)
  {
    console.error("[YouNote] ensureProfile failed:", error); // print to console, for debugging
  } 
  else
  {
    console.log("[YouNote] Profile saved:", user.email);
  }
}