/*
makes sure a YouTube video exists in the videos table
avoids duplicates using the YouTube video ID
and returns the video's Supabase database ID
*/

import { supabase } from "./supabase";

export async function ensureVideo(
  youtubeVideoId: string,
  title: string,
  creator: string
): Promise<string | null> {
  const response = await supabase
    .from("videos")
    .upsert( // upsert = update and insert, Postgres uses it (supabase uses postgres)
      { 
        youtube_video_id: youtubeVideoId, 
        title: title, 
        creator: creator 
      },
      { onConflict: "youtube_video_id" }
    )
    .select("id")
    .single();

  const data = response.data;
  const error = response.error;

  if (error !== null)
  {
    console.error("[YouNote] ensureVideo failed:", error);
    return null;
  }

  if (data === null || data === undefined)
  {
    console.error("[YouNote] data is null or undefined:", error);
    return null;
  }

  return data.id;
}