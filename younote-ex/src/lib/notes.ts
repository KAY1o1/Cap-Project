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

// Edit a note's text.
export async function updateNote(id: string, content: string): Promise<void> {
  const { error } = await supabase
    .from("notes")
    .update({ content, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) console.error("[YouNote] updateNote failed:", error);
}

// Delete a note.
export async function deleteNote(id: string): Promise<void> {
  const { error } = await supabase.from("notes").delete().eq("id", id);

  if (error) console.error("[YouNote] deleteNote failed:", error);
}
