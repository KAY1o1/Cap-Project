// FOR BACKEND: video
import { supabase } from "./supabase";

// Upsert the video and return its internal id (needed as video_ratings.video_id).
export async function ensureVideo(
  youtubeVideoId: string,
  title: string,
  creator: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("videos")
    .upsert(
      { youtube_video_id: youtubeVideoId, title, creator },
      { onConflict: "youtube_video_id" }
    )
    .select("id")
    .single();

  if (error) {
    console.error("[YouNote] ensureVideo failed:", error);
    return null;
  }

  return data.id;
}