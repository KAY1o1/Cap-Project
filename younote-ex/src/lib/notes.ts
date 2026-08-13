/*note's CRUD*/

import { supabase } from "./supabase";

type Note =
{
  id: string;
  text: string;
  createdAt: number;
  videoTime: number;
  isPrivate: boolean;
  profileId: string;
  username: string;
};

export type UserStats =
{
  videosNoted: number;
  notesSaved: number;
};

// Helper function to convert raw database row format into our clean Note object structure
function mapRow(row: any): Note
{
  let usernameValue = "Unknown User";
  if (row.profiles !== null && row.profiles !== undefined)
  {
    if (row.profiles.username !== null && row.profiles.username !== undefined)
    {
      usernameValue = row.profiles.username;
    }
  }

  const createdTimestamp = new Date(row.created_at).getTime();

  return {
    id: row.id,
    text: row.content,
    createdAt: createdTimestamp,
    videoTime: row.timestamp_seconds,
    isPrivate: row.is_private,
    profileId: row.profile_id,
    username: usernameValue,
  };
}

// Get the ID of the user currently logged in so we can check note ownership
export async function getCurrentUserId(): Promise<string | null>
{
  const sessionResponse = await supabase.auth.getSession();
  const sessionData = sessionResponse.data;

  if (sessionData === null || sessionData === undefined)
  {
    return null;
  }

  const currentSession = sessionData.session;
  if (currentSession === null || currentSession === undefined) 
  {
    return null;
  }

  const user = currentSession.user;
  if (user === null || user === undefined) {
    return null;
  }

  return user.id;
}

// Load all notes associated with a specific video from the database
export async function fetchNotes(videoDbId: string): Promise<Note[]>
{
  const response = await supabase // this is the sql part
    .from("notes")
    .select(`
      *,
      profiles (
        username
      )
    `)
    .eq("video_id", videoDbId)
    .order("timestamp_seconds", { ascending: true });


  const data = response.data;
  const error = response.error;

  if (error !== null && error !== undefined)
  {
    console.error("[YouNote] fetchNotes failed:", error);
    return [];
  }

  if (data === null || data === undefined)
  {
    return []; // return silently
  }

  const notesList: Note[] = [];
  for (let i = 0; i < data.length; i++)
  {
    const mappedNote = mapRow(data[i]);
    notesList.push(mappedNote);
  }

  return notesList;
}

// Save a brand new note into the database for the current user and video
export async function createNote( 
  videoDbId: string,
  content: string,
  timestampSeconds: number,
  isPrivate: boolean
): Promise<Note | null>

{
  const sessionResponse = await supabase.auth.getSession();
  const sessionData = sessionResponse.data;

  if (sessionData === null || sessionData === undefined) {
    console.log("[YouNote] createNote: no session yet, skipping");
    return null;
  }

  const currentSession = sessionData.session;
  if (currentSession === null || currentSession === undefined) {
    console.log("[YouNote] createNote: no session yet, skipping");
    return null;
  }

  const user = currentSession.user;
  if (user === undefined || user === null) {
    console.log("[YouNote] createNote: no session yet, skipping");
    return null;
  }

  const roundedTime = Math.floor(timestampSeconds);
  const newUuid = crypto.randomUUID();

  const insertResponse = await supabase
    .from("notes")
    .insert({
      id: newUuid,
      profile_id: user.id,
      video_id: videoDbId,
      timestamp_seconds: roundedTime,
      content: content,
      is_private: isPrivate,
    })
    .select()
    .single();

  const data = insertResponse.data;
  const error = insertResponse.error;

  if (error !== null && error !== undefined)
  {
    console.error("[YouNote] createNote failed:", error);
    return null;
  }

  const profileResponse = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  const profile = profileResponse.data;
  const profileError = profileResponse.error;

  if (profileError !== null && profileError !== undefined)
  {
    console.error("[YouNote] fetching username failed:", profileError);
  }

  let usernameToUse = "Unknown User";
  if (profile !== null && profile !== undefined)
  {
    if (profile.username !== null && profile.username !== undefined)
    {
      usernameToUse = profile.username;
    }
  }

  const finalNote = mapRow(data);
  finalNote.username = usernameToUse;

  return finalNote;
}

// Update an existing note's text or privacy setting
export async function updateNote(id: string, content: string, isPrivate: boolean): Promise<void> 
{
  const currentTimeString = new Date().toISOString();

  const response = await supabase
    .from("notes")
    .update(
    { 
      content: content, 
      is_private: isPrivate, 
      updated_at: currentTimeString 
    })
    .eq("id", id);

  const error = response.error;

  if (error !== null && error !== undefined) 
  {
    console.error("[YouNote] updateNote failed:", error);
  }
}

// Delete a specific note by its unique ID
export async function deleteNote(id: string): Promise<void> 
{
  const response = await supabase.from("notes").delete().eq("id", id);
  const error = response.error;

  if (error !== null && error !== undefined) {
    console.error("[YouNote] deleteNote failed:", error);
  }
}

// Re-insert a previously deleted note back into the database (used for undo)
export async function restoreNote(note: Note, videoDbId: string): Promise<void>
{
  const roundedTime = Math.floor(note.videoTime);

  const response = await supabase.from("notes").insert({
    id: note.id,
    profile_id: note.profileId,
    video_id: videoDbId,
    timestamp_seconds: roundedTime,
    content: note.text,
    is_private: note.isPrivate,
  });

  const error = response.error;

  if (error !== null && error !== undefined)
  {
    console.error("[YouNote] restoreNote failed:", error);
  }
}

// Count how many total notes and distinct videos a user has worked with
export async function getUserStats(profileId: string): Promise<UserStats>
{
  const response = await supabase
    .from("notes")
    .select("video_id")
    .eq("profile_id", profileId);

  const data = response.data;
  const error = response.error;

  if (error !== null && error !== undefined || data === null || data === undefined) {
    console.error("[YouNote] getUserStats failed:", error);
    return { videosNoted: 0, notesSaved: 0 };
  }

  const uniqueVideoIds = new Set<string>();
  for (let i = 0; i < data.length; i++) {
    uniqueVideoIds.add(data[i].video_id);
  }

  return {
    videosNoted: uniqueVideoIds.size,
    notesSaved: data.length,
  };
}

export type RecentVideo = {
  videoId: string;
  youtubeVideoId: string;
  title: string;
  creator: string;
  lastNoteAt: number;
  noteCount: number;
};

// Fetch a list of videos the user recently took notes on, ordered by most recent
export async function getRecentVideos(
  profileId: string,
  limit = 2
): Promise<RecentVideo[]> {
  const response = await supabase
    .from("notes")
    .select("video_id, created_at, videos(youtube_video_id, title, creator)")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });

  const data = response.data;
  const error = response.error;

  if (error !== null && error !== undefined || data === null || data === undefined)
  {
    console.error("[YouNote] getRecentVideos failed:", error);
    return [];
  }

  const byVideo = new Map<string, RecentVideo>();

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const video = row.videos as any;

    if (video === null || video === undefined) {
      continue;
    }

    const existing = byVideo.get(row.video_id);
    if (existing !== undefined)
    {
      existing.noteCount = existing.noteCount + 1;
    } 
    else 
    {
      const parsedTime = new Date(row.created_at).getTime();
      byVideo.set(row.video_id, {
        videoId: row.video_id,
        youtubeVideoId: video.youtube_video_id,
        title: video.title,
        creator: video.creator,
        lastNoteAt: parsedTime,
        noteCount: 1,
      });
    }
  }

  const allValues = Array.from(byVideo.values());
  const slicedValues = allValues.slice(0, limit);

  return slicedValues;
}