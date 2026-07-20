// FOR BACKEND: profiles
import { supabase } from "./supabase";

// Make sure the signed-in user has a row in `profiles`.
export async function ensureProfile(): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const user = session?.user;
  if (!user) {
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

  if (error) {
    console.error("[YouNote] ensureProfile failed:", error);
  } else {
    console.log("[YouNote] Profile saved:", user.email);
  }
}