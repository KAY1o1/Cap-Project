import { useEffect, useState, useMemo } from "react";
import NoteMenu from "./NoteMenu";
import { useSession } from "../lib/auth"; // Google OAuth
// CALLING BACKEND: profiles
import { ensureProfile } from "../lib/db";
// CALLING BACKEND: video
import { ensureVideo } from "../lib/video";
// CALLING BACKEND: rating
import { fetchRating, saveRatingToSupabase } from "../lib/ratings";
// CALLING BACKEND: notes
import { fetchNotes, createNote, updateNote, deleteNote, restoreNote, getCurrentUserId } from "../lib/notes";
// END CALLING BACKEND
// FILTER: hateful speech
// import { containsHatefulLanguage } from "../lib/profanity";
// END FILTER
import styles from "./notes.module.css";

type Note = {
  id: string;
  text: string;
  createdAt: number;
  videoTime: number;
  // CALLING BACKEND: notes — renamed isPublic to isPrivate to keep it consistent with the Supabase `is_private` column.
  isPrivate: boolean;
  // END CALLING BACKEND
  profileId: string;
};

const NOTE_MAX_LENGTH = 150;

// UNDO/REDO: one entry per committed note action (add/delete/edit), so undo/redo
// can replay the inverse/forward change against both local state and Supabase.
type NoteAction =
  | { type: "add"; note: Note }
  | { type: "delete"; note: Note }
  | { type: "edit"; id: string; before: string; after: string };

// EXTRACT VID ID FROM URL
function getVideoId(): string | null {
  return new URL(window.location.href).searchParams.get("v");
}

// CALLING BACKEND: extract vid title + creator so we can log the video in Supabase
function getVideoMeta(): { title: string; creator: string } {
  const title =
    document
      .querySelector("h1.ytd-watch-metadata yt-formatted-string")
      ?.textContent?.trim() || document.title.replace(/ - YouTube$/, "");

  const creator =
    document
      .querySelector("#owner #channel-name a, ytd-channel-name a")
      ?.textContent?.trim() || "Unknown";

  return { title, creator };
}
// END CALLING BACKEND

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (seconds > 3600) {
    return `${h}:${m}:${s.toString().padStart(2, "0")}`
  } else {
    return `${m}:${s.toString().padStart(2, "0")}`
  }
}

export default function NotesPanel() {
  const email = useSession(); // Google OAuth
  const [videoId, setVideoId] = useState<string | null>(getVideoId);

  // CALLING BACKEND: profiles — when someone is signed in, log their info into the Supabase `profiles` table.
  useEffect(() => {
    if (email) ensureProfile();
  }, [email]);
  // END CALLING BACKEND

  // CALLING BACKEND: video — internal Supabase id for the current video (needed for ratings).
  const [videoDbId, setVideoDbId] = useState<string | null>(null);
  // END CALLING BACKEND

  // CALLING BACKEND: notes — who's signed in, so we only show Edit/Delete on that user's own notes.
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    if (email) getCurrentUserId().then(setUserId);
    else setUserId(null);
  }, [email]);
  // END CALLING BACKEND

  const [notes, setNotes] = useState<Note[]>([]);
  const [note, setNote] = useState("");
  // CALLING BACKEND: notes — renamed isPublic to isPrivate to keep it consistent with the Supabase `is_private` column.
  const [isPrivate, setIsPrivate] = useState(true);
  // END CALLING BACKEND
  const [showControls, setShowControls] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [noteError, setNoteError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  // UNDO/REDO: stacks of committed note actions for this video.
  const [history, setHistory] = useState<{ past: NoteAction[]; future: NoteAction[] }>({
    past: [],
    future: [],
  });

  // RATING
  const [showRating, setShowRating] = useState(false);
  const [rated, setRated] = useState(false);
  const [rating, setRating] = useState<number | null>(null);

  // PROMPT RATING AT 75% OF VIDEO
  useEffect(() => {
    if (!videoId) return;

    const checkTime = () => {
      const player = document.querySelector("video");

      if (!player || !Number.isFinite(player.duration)) return;

      const triggerTime = player.duration * 0.75;

      if (player.currentTime >= triggerTime && !rated) {
        setShowRating(true);
      }
    };

    const interval = setInterval(checkTime, 2000);

    return () => clearInterval(interval);
  }, [videoId, rated]);

  // UNDO/REDO: Ctrl/Cmd+Z to undo, Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y to redo.
  // Skipped while focus is in a textarea/input so native text-editing undo isn't hijacked.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "TEXTAREA" || target.tagName === "INPUT") return;
      if (!(e.metaKey || e.ctrlKey)) return;

      const key = e.key.toLowerCase();
      if (key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((key === "z" && e.shiftKey) || key === "y") {
        e.preventDefault();
        redo();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [videoDbId]);

  // SPA NAVIGATION LISTENER
  useEffect(() => {
    const handleNavigate = () => setVideoId(getVideoId());
    document.addEventListener("yt-navigate-finish", handleNavigate);
    return () => document.removeEventListener("yt-navigate-finish", handleNavigate);
  }, []);

  // RESET NOTE ON NEW VIDEO
  useEffect(() => {
    if (!videoId) {
      setNotes([]);
      setRating(null);
      setRated(false);
      setShowRating(false);
      setVideoDbId(null); // CALLING BACKEND: video — reset id on video change
      return;
    }

    setEditingId(null);
    setNote("");
    setHistory({ past: [], future: [] });

    // CALLING BACKEND: video — log this video into the Supabase `videos` table.
    const { title, creator } = getVideoMeta();
    ensureVideo(videoId, title, creator).then((dbId) => {
      setVideoDbId(dbId);
      // CALLING BACKEND: notes — load notes for this video from Supabase.
      if (dbId) fetchNotes(dbId).then(setNotes);
      else setNotes([]);
      // END CALLING BACKEND

      // CALLING BACKEND: rating — load this user's rating for this video from Supabase.
      if (dbId) {
        fetchRating(dbId).then((savedRating) => {
          setRating(savedRating);

          if (savedRating !== null) {
            setRated(true);
          }
        });
      } else {
        setRating(null);
        setRated(false);
      }
      // END CALLING BACKEND
    });
    // END CALLING BACKEND
  }, [videoId]);

  // SORT ON UPDATE
  const sortedNotes = useMemo(() => {
    return [...notes].sort((a, b) => a.videoTime - b.videoTime);
  }, [notes]);

  // TIMESTAMP HELPER
  const getCurrentVideoTime = (): number => {
    const player = document.querySelector("video");
    return player ? player.currentTime : 0;
  };

  // MUTATION HELPER
  const mutateNotes = (updater: (prev: Note[]) => Note[]) => {
    setNotes((prev) => updater(prev));
  };

  // UNDO/REDO: record a committed action and clear the redo stack.
  const pushAction = (action: NoteAction) => {
    setHistory((h) => ({ past: [...h.past, action], future: [] }));
  };

  // UNDO/REDO: apply an action's inverse ("undo") or forward ("redo") effect,
  // to both local state and Supabase.
  const applyAction = (action: NoteAction, direction: "undo" | "redo") => {
    if (action.type === "add") {
      if (direction === "undo") {
        mutateNotes((prev) => prev.filter((n) => n.id !== action.note.id));
        deleteNote(action.note.id);
      } else {
        mutateNotes((prev) => [...prev, action.note]);
        if (videoDbId) restoreNote(action.note, videoDbId);
      }
    } else if (action.type === "delete") {
      if (direction === "undo") {
        mutateNotes((prev) => [...prev, action.note]);
        if (videoDbId) restoreNote(action.note, videoDbId);
      } else {
        mutateNotes((prev) => prev.filter((n) => n.id !== action.note.id));
        deleteNote(action.note.id);
      }
    } else {
      const text = direction === "undo" ? action.before : action.after;
      mutateNotes((prev) => prev.map((n) => (n.id === action.id ? { ...n, text } : n)));
      updateNote(action.id, text);
    }
  };

  const undo = () => {
    setHistory((h) => {
      if (h.past.length === 0) return h;
      const action = h.past[h.past.length - 1];
      applyAction(action, "undo");
      return { past: h.past.slice(0, -1), future: [...h.future, action] };
    });
  };

  const redo = () => {
    setHistory((h) => {
      if (h.future.length === 0) return h;
      const action = h.future[h.future.length - 1];
      applyAction(action, "redo");
      return { past: [...h.past, action], future: h.future.slice(0, -1) };
    });
  };

  const handleSubmit = async () => {
    const trimmed = note.trim();
    if (!trimmed) return;

    // FILTER: hateful speech — block hateful/racist notes before they're saved.
    // if (containsHatefulLanguage(trimmed)) {
    //   setNoteError("This note contains hateful or offensive language. Please rephrase it.");
    //   return;
    // }
    setNoteError(null);
    // END FILTER

    // CALLING BACKEND: notes — insert this note into the Supabase `notes` table.
    if (!videoDbId) {
      console.log("[YouNote] handleSubmit: videoDbId not ready yet, skipping note save");
      return;
    }

    const newNote = await createNote(videoDbId, trimmed, getCurrentVideoTime(), isPrivate);
    // END CALLING BACKEND
    if (!newNote) return;

    mutateNotes((prev) => [...prev, newNote]);
    pushAction({ type: "add", note: newNote });
    setNote("");
  };

  const handleDelete = (id: string) => {
    const target = notes.find((n) => n.id === id);
    mutateNotes((prev) => prev.filter((n) => n.id !== id));
    // CALLING BACKEND: notes — delete this note from Supabase.
    deleteNote(id);
    // END CALLING BACKEND
    if (target) pushAction({ type: "delete", note: target });
  };

  const startEdit = (id: string, text: string) => {
    setEditingId(id);
    setEditText(text);
    setEditError(null);
  };

  const saveEdit = () => {
    if (!editingId) return;
    const trimmed = editText.trim();
    if (!trimmed) {
      cancelEdit();
      return;
    }

    // FILTER: hateful speech — block hateful/racist notes before they're saved.
    // if (containsHatefulLanguage(trimmed)) {
    //   setEditError("This note contains hateful or offensive language. Please rephrase it.");
    //   return;
    // }
    // END FILTER

    const original = notes.find((n) => n.id === editingId);
    mutateNotes((prev) =>
      prev.map((n) => (n.id === editingId ? { ...n, text: trimmed } : n))
    );
    // CALLING BACKEND: notes — save the edited text to Supabase.
    updateNote(editingId, trimmed);
    // END CALLING BACKEND
    if (original && original.text !== trimmed) {
      pushAction({ type: "edit", id: editingId, before: original.text, after: trimmed });
    }
    cancelEdit();
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
    setEditError(null);
  };

  const seekTo = (seconds: number) => {
    const player = document.querySelector("video");
    if (player) player.currentTime = seconds;
  };

  const handleRating = (value: number) => {
    if (!videoId) return;

    setRating(value);
    setRated(true);
    setShowRating(false);

    // CALLING BACKEND: rating — log this rating into the Supabase `video_ratings` table.
    if (videoDbId) saveRatingToSupabase(videoDbId, value);
    // END CALLING BACKEND
  };

  // START OF UI
  if (!email) {
    return (
      <div className={styles.container}>
        <h3 className={styles.title}>YouNote</h3>
        <p>Sign in to take notes.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles["title-row"]}>
        <h3 className={styles.title}>YouNote</h3>
        {/* UNDO/REDO */}
        <div className={styles["history-buttons"]}>
          <button
            type="button"
            className={styles["history-button"]}
            onClick={undo}
            disabled={history.past.length === 0}
            title="Undo"
          >
            ↶
          </button>
          <button
            type="button"
            className={styles["history-button"]}
            onClick={redo}
            disabled={history.future.length === 0}
            title="Redo"
          >
            ↷
          </button>
        </div>
        {/* END UNDO/REDO */}
      </div>

      <div
        onFocus={() => setShowControls(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setShowControls(false);
          }
        }}
      >
        <textarea
          value={note}
          onChange={(e) => {
            setNote(e.target.value);
            setNoteError(null);
          }}
          placeholder="Add a note..."
          className={styles.textarea}
          maxLength={NOTE_MAX_LENGTH}
        />
        <div className={styles["char-count"]}>
          {note.length}/{NOTE_MAX_LENGTH}
        </div>
        {noteError && <div className={styles["note-error"]}>{noteError}</div>}

        {showControls && (
          <div className={styles["hidden-buttons"]}>
            <label className={styles.switch} onMouseDown={(e) => e.preventDefault()}>
              <input
                type="checkbox"
                checked={!isPrivate}
                onChange={(e) => setIsPrivate(!e.target.checked)}
              />
              <span className={styles.slider}></span>
              <span className={styles["switch-label"]}>
                {isPrivate ? "Private" : "Public"}
              </span>
            </label>

            {/* CALLING BACKEND: notes — disabled until videoDbId resolves, to avoid a race condition where Submit silently no-ops before Supabase has a row for this video. */}
            <button className={styles.submit} onClick={handleSubmit} disabled={!videoDbId}>
              Submit
            </button>
            {/* END CALLING BACKEND */}
          </div>
        )}
      </div>

      {showRating && (
        <div className={styles.rating}>
          <p>What would rate this video?</p>

          <div className={styles.stars}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                className={styles.star}
                onClick={() =>
                  handleRating(star)
                }>
                {rating && star <= rating
                  ? "✏️"
                  : "⚪️"}
              </button>
            ))}
          </div>
        </div>
      )}


      {rating && !showRating && (
        <button
          className={styles.savedRating}
          onClick={() =>
            setShowRating(true)
          }
        >
          {"✏️".repeat(rating)}
        </button>
      )}

      {sortedNotes.length > 0 && (
        <div className={styles.carousel}>
          {sortedNotes.map((n) => (
            <div key={n.id} className={styles.card}>
              <div className={styles.header}>
                <div className={styles["card-actions"]}>
                  {!n.isPrivate && <span className={styles.lock}>
                    {/* eye open */}
                    <svg width="18" height="12" viewBox="0 0 18 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="8.75" cy="5.75" r="2" fill="#E6E6E6" />
                      <path d="M8.88991 0C12.7688 0 16.0899 3.3152 17.4641 4.91113C17.885 5.40006 17.885 6.09994 17.4641 6.58887C16.0899 8.1848 12.7688 11.5 8.88991 11.5V9.5C10.2657 9.5 11.668 8.90444 12.9788 7.99805C13.8546 7.3924 14.6166 6.69687 15.212 6.08556C15.3942 5.89846 15.3942 5.60154 15.212 5.41444C14.6166 4.80313 13.8546 4.1076 12.9788 3.50195C11.668 2.59556 10.2657 2 8.88991 2C7.51411 2 6.11182 2.59556 4.80104 3.50195C3.92495 4.10776 3.16241 4.80316 2.56687 5.41449C2.38464 5.60154 2.38464 5.89846 2.56687 6.08551C3.16241 6.69684 3.92495 7.39224 4.80104 7.99805C6.11182 8.90444 7.51411 9.5 8.88991 9.5V11.5C5.25351 11.5 2.1074 8.58643 0.595963 6.90723L0.315689 6.58887C-0.10523 6.09994 -0.10523 5.40006 0.315689 4.91113C1.68991 3.3152 5.01103 0 8.88991 0Z" fill="#E6E6E6" />
                    </svg>

                  </span>}
                  {n.isPrivate && <span className={styles.lock}>
                    {/* eye closed */}
                    <svg width="18" height="10" viewBox="0 0 18 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M16.6093 1.00002C11.6427 6.92528 6.20311 7.15316 1.00002 1.00002" stroke="#E6E6E6" stroke-width="2" stroke-linecap="round" />
                      <path d="M3.83808 4.01989L1.94604 6.53645" stroke="#E6E6E6" stroke-width="2" stroke-linecap="round" />
                      <path d="M6.20312 5.52982L5.73011 8.54969" stroke="#E6E6E6" stroke-width="2" stroke-linecap="round" />
                      <path d="M11.9016 5.39718C11.8446 4.84507 11.3569 4.45689 10.8123 4.53015C10.2677 4.60341 9.87238 5.11036 9.92938 5.66247L10.9155 5.52982L11.9016 5.39718ZM10.2435 8.70569C10.3005 9.25779 10.7882 9.64597 11.3329 9.57271C11.8775 9.49946 12.2728 8.9925 12.2158 8.4404L11.2297 8.57304L10.2435 8.70569ZM10.9155 5.52982L9.92938 5.66247L10.2435 8.70569L11.2297 8.57304L12.2158 8.4404L11.9016 5.39718L10.9155 5.52982Z" fill="#E6E6E6" />
                      <path d="M13.7888 3.80964C13.4091 3.40127 12.7938 3.3897 12.4147 3.78379C12.0355 4.17788 12.0359 4.8284 12.4156 5.23677L13.1022 4.52321L13.7888 3.80964ZM14.4393 7.41309C14.819 7.82146 15.4342 7.83304 15.8134 7.43895C16.1925 7.04486 16.1921 6.39434 15.8124 5.98596L15.1258 6.69953L14.4393 7.41309ZM13.1022 4.52321L12.4156 5.23677L14.4393 7.41309L15.1258 6.69953L15.8124 5.98596L13.7888 3.80964L13.1022 4.52321Z" fill="#E6E6E6" />
                    </svg>
                  </span>}
                  <button className={styles.timestamp} onClick={() => seekTo(n.videoTime)}>
                    @{formatTime(n.videoTime)}
                  </button>
                </div>
                {/* CALLING BACKEND: notes — only the note's owner can edit/delete it (RLS enforces this server-side too, this just hides the buttons for other users' public notes). */}
                {n.profileId === userId && (
                  <NoteMenu
                    onEdit={() => startEdit(n.id, n.text)}
                    onDelete={() => handleDelete(n.id)}
                  />
                )}
                {/* END CALLING BACKEND */}
              </div>

              {editingId === n.id ? (
                <div className={styles["edit-wrapper"]}>
                  <textarea
                    className={styles.textarea}
                    value={editText}
                    onChange={(e) => {
                      setEditText(e.target.value);
                      setEditError(null);
                    }}
                    autoFocus
                    maxLength={NOTE_MAX_LENGTH}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                        saveEdit();
                      } else if (e.key === "Escape") {
                        cancelEdit();
                      }
                    }}
                  />
                  <div className={styles["char-count"]}>
                    {editText.length}/{NOTE_MAX_LENGTH}
                  </div>
                  {editError && <div className={styles["note-error"]}>{editError}</div>}
                  <div className={styles["edit-actions"]}>
                    <button className={styles.cancel} onClick={cancelEdit}>
                      Cancel
                    </button>
                    <button className={styles.submit} onClick={saveEdit}>
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className={styles["note-content"]}>{n.text}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}