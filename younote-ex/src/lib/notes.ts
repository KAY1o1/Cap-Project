// FOR BACKEND: notes
import { supabase } from "./supabase";

type Note = {
  id: string;
  text: string;
  createdAt: number;
  videoTime: number;
  // renamed isPublic to isPrivate to keep it consistent with the Supabase `is_private` column.
  isPrivate: boolean;
  profileId: string;
};

// for pop-up
export type UserStats = {
  videosNoted: number;
  notesSaved: number;
};

function mapRow(row: any): Note {
  return {
    id: row.id,
    text: row.content,
    createdAt: new Date(row.created_at).getTime(),
    videoTime: row.timestamp_seconds,
    isPrivate: row.is_private,
    profileId: row.profile_id,
  };
}

// Get the signed-in user's id, so the UI can check note ownership.
export async function getCurrentUserId(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session?.user.id ?? null;
}

// Load notes for a video (own notes + public notes from others, per RLS).
export async function fetchNotes(videoDbId: string): Promise<Note[]> {
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("video_id", videoDbId)
    .order("timestamp_seconds", { ascending: true });

  if (error) {
    console.error("[YouNote] fetchNotes failed:", error);
    return [];
  }

  return (data ?? []).map(mapRow);
}

// Create a note.
export async function createNote(
  videoDbId: string,
  content: string,
  timestampSeconds: number,
  isPrivate: boolean
): Promise<Note | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const user = session?.user;
  if (!user) {
    console.log("[YouNote] createNote: no session yet, skipping");
    return null;
  }

  const { data, error } = await supabase
    .from("notes")
    .insert({
      id: crypto.randomUUID(),
      profile_id: user.id,
      video_id: videoDbId,
      timestamp_seconds: Math.floor(timestampSeconds),
      content,
      is_private: isPrivate,
    })
    .select()
    .single();

  if (error) {
    console.error("[YouNote] createNote failed:", error);
    return null;
  }

  return mapRow(data);
}

// Edit a note's text and/or privacy.
export async function updateNote(id: string, content: string, isPrivate: boolean): Promise<void> {
  const { error } = await supabase
    .from("notes")
    .update({ content, is_private: isPrivate, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) console.error("[YouNote] updateNote failed:", error);
}

// Delete a note.
export async function deleteNote(id: string): Promise<void> {
  const { error } = await supabase.from("notes").delete().eq("id", id);

  if (error) console.error("[YouNote] deleteNote failed:", error);
}

// UNDO/REDO: re-insert a previously-deleted note with its original id.
export async function restoreNote(note: Note, videoDbId: string): Promise<void> {
  const { error } = await supabase.from("notes").insert({
    id: note.id,
    profile_id: note.profileId,
    video_id: videoDbId,
    timestamp_seconds: Math.floor(note.videoTime),
    content: note.text,
    is_private: note.isPrivate,
  });

  if (error) console.error("[YouNote] restoreNote failed:", error);
}


///////
// GET note stats (nums) for popup: how many total notes and diff videos
export async function getUserStats(profileId: string): Promise<UserStats> {
  const { data, error } = await supabase
    .from("notes")
    .select("video_id")
    .eq("profile_id", profileId);

  if (error || !data) {
    console.error("[YouNote] getUserStats failed:", error);
    return { videosNoted: 0, notesSaved: 0 };
  }

  const uniqueVideoIds = new Set(data.map((row) => row.video_id));

  return {
    videosNoted: uniqueVideoIds.size,
    notesSaved: data.length,
  };
}

// GET video information and date noted
// entry per video, most recently noted first, note count per video
export type RecentVideo = {
  videoId: string;
  youtubeVideoId: string;
  title: string;
  creator: string;
  lastNoteAt: number;
  noteCount: number;
};

export async function getRecentVideos(
  profileId: string,
  limit = 2
): Promise<RecentVideo[]> {
  // db notes already newest first
  const { data, error } = await supabase
    .from("notes")
    .select("video_id, created_at, videos(youtube_video_id, title, creator)")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("[YouNote] getRecentVideos failed:", error);
    return [];
  }

  // groups note by video
  const byVideo = new Map<string, RecentVideo>();

  for (const row of data) {
    const video = row.videos as any;
    if (!video) continue;

    const existing = byVideo.get(row.video_id);
    if (existing) {
      existing.noteCount += 1;
    } else {
      byVideo.set(row.video_id, {
        videoId: row.video_id,
        youtubeVideoId: video.youtube_video_id,
        title: video.title,
        creator: video.creator,
        lastNoteAt: new Date(row.created_at).getTime(),
        noteCount: 1,
      });
    }
  }

  return Array.from(byVideo.values()).slice(0, limit);
}