// FOR BACKEND: rating
import { supabase } from "./supabase";

// Load the signed-in user's rating for a video, if they've rated it.
export async function fetchRating(videoDbId: string): Promise<number | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const user = session?.user;
  if (!user) return null;

  const { data, error } = await supabase
    .from("video_ratings")
    .select("rating")
    .eq("video_id", videoDbId)
    .eq("profile_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[YouNote] fetchRating failed:", error);
    return null;
  }

  return data?.rating ?? null;
}

// Save the signed-in user's rating for a video.
export async function saveRatingToSupabase(videoDbId: string, rating: number): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const user = session?.user;
  if (!user) {
    console.log("[YouNote] saveRating: no session yet, skipping");
    return;
  }

  const { error } = await supabase.from("video_ratings").upsert({
    profile_id: user.id,
    video_id: videoDbId,
    rating,
  });

  if (error) console.error("[YouNote] saveRating failed:", error);
}