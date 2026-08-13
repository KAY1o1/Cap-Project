/*
checks whether the logged-in user has rated a specific video 
and returns their rating if one exists
and it saves or updates their rating in the video_ratings table when they submit one
*/

import { supabase } from "./supabase";

export async function fetchRating(videoDbId: string): Promise<number | null> 
{
  const sessionResponse = await supabase.auth.getSession();

  const sessionData = sessionResponse.data;
  if (sessionData === null)
  {
    return null;
  }

  const currentSession = sessionData.session;
  if (currentSession === null)
  {
    return null;
  }

  const user = currentSession.user;
  if (user === undefined || user === null)
  {
    return null;
  }

  const queryResponse = await supabase
    .from("video_ratings")
    .select("rating")
    .eq("video_id", videoDbId)
    .eq("profile_id", user.id)
    .maybeSingle();

  const data = queryResponse.data;
  const error = queryResponse.error;

  if (error !== null) {
    console.error("[YouNote] fetchRating failed:", error);
    return null;
  }

  if (data === null || data === undefined) { // if user hasnt given a rating, record nothing
    return null;
  }

  return data.rating;
}

export async function saveRatingToSupabase(videoDbId: string, rating: number): Promise<void>
{
  const sessionResponse = await supabase.auth.getSession();
  const sessionData = sessionResponse.data;

  if (sessionData === null) {
    console.log("[YouNote] saveRating: no session yet, skipping");
    return;
  }

  const currentSession = sessionData.session;
  if (currentSession === null) {
    console.log("[YouNote] saveRating: no session yet, skipping");
    return;
  }

  const user = currentSession.user;
  if (user === undefined || user === null) {
    console.log("[YouNote] saveRating: no session yet, skipping");
    return;
  }

  const upsertResponse = await supabase.from("video_ratings").upsert({
    profile_id: user.id,
    video_id: videoDbId,
    rating: rating,
  });

  const error = upsertResponse.error;

  if (error !== null) {
    console.error("[YouNote] saveRating failed:", error);
  }
}