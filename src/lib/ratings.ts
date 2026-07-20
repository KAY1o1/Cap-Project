// FOR BACKEND: rating
import { supabase } from "./supabase";

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
