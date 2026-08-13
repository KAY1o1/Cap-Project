/*
main YouNote component that manages the note-taking UI, 
note CRUD operations, 
undo/redo, 
privacy, 
validation, 
video timestamps,
the video-rating feature while connecting everything to Supabase.
*/

import { useEffect, useState, useMemo } from "react";
import NoteMenu from "./NoteMenu";
import { useSession } from "../lib/auth";
import { ensureProfile } from "../lib/db";
import { ensureVideo } from "../lib/video";
import { fetchRating, saveRatingToSupabase } from "../lib/ratings";
import { fetchNotes, createNote, updateNote, deleteNote, restoreNote, getCurrentUserId } from "../lib/notes";
import { containsHatefulLanguage } from "../lib/profanity";
import styles from "./notes.module.css";

type Note = {
  id: string;
  text: string;
  createdAt: number;
  videoTime: number;
  isPrivate: boolean;
  profileId: string;
  username: string;
};

const NOTE_MAX_LENGTH = 150;

type NoteAction =
  | { type: "add"; note: Note }
  | { type: "delete"; note: Note }
  | { type: "edit"; id: string; before: string; after: string; beforePrivate: boolean; afterPrivate: boolean };

function getVideoId(): string | null {
  return new URL(window.location.href).searchParams.get("v");
}

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

function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);

  if (h > 0) {
    return `${h}:${m}:${s.toString().padStart(2, "0")}`
  } else {
    return `${m}:${s.toString().padStart(2, "0")}`
  }
}

export default function NotesPanel() {
  const email = useSession();
  const [videoId, setVideoId] = useState<string | null>(getVideoId);

  useEffect(() => {
    if (email) ensureProfile();
  }, [email]);

  // ===== SUE'S CONTRIBUTION: state, undo/redo, notes CRUD, char limit + filter checks =====
  const [videoDbId, setVideoDbId] = useState<string | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    if (email) getCurrentUserId().then(setUserId);
    else setUserId(null);
  }, [email]);

  const [notes, setNotes] = useState<Note[]>([]);
  const [note, setNote] = useState("");
  const [isPrivate, setIsPrivate] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editIsPrivate, setEditIsPrivate] = useState(true);
  const [noteError, setNoteError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  const [history, setHistory] = useState<{ past: NoteAction[]; future: NoteAction[] }>({
    past: [],
    future: [],
  });

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

  const sortedNotes = useMemo(() => {
    return [...notes].sort((a, b) => a.videoTime - b.videoTime);
  }, [notes]);

  const getCurrentVideoTime = (): number => {
    const player = document.querySelector("video");
    return player ? player.currentTime : 0;
  };

  const mutateNotes = (updater: (prev: Note[]) => Note[]) => {
    setNotes((prev) => updater(prev));
  };

  const pushAction = (action: NoteAction) => {
    setHistory((h) => ({ past: [...h.past, action], future: [] }));
  };

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
      const isPrivate = direction === "undo" ? action.beforePrivate : action.afterPrivate;
      mutateNotes((prev) => prev.map((n) => (n.id === action.id ? { ...n, text, isPrivate } : n)));
      updateNote(action.id, text, isPrivate);
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

    if (containsHatefulLanguage(trimmed)) {
      setNoteError("This note contains hateful or offensive language. Please rephrase it.");
      return;
    }
    setNoteError(null);

    if (!videoDbId) {
      console.log("[YouNote] handleSubmit: videoDbId not ready yet, skipping note save");
      return;
    }

    const newNote = await createNote(videoDbId, trimmed, getCurrentVideoTime(), isPrivate);
    if (!newNote) return;

    mutateNotes((prev) => [...prev, newNote]);
    pushAction({ type: "add", note: newNote });
    setNote("");
  };

  const handleDelete = (id: string) => {
    const target = notes.find((n) => n.id === id);
    mutateNotes((prev) => prev.filter((n) => n.id !== id));
    deleteNote(id);
    if (target) pushAction({ type: "delete", note: target });
  };

  const startEdit = (id: string, text: string, isPrivate: boolean) => {
    setEditingId(id);
    setEditText(text);
    setEditIsPrivate(isPrivate);
    setEditError(null);
  };

  const saveEdit = () => {
    if (!editingId) return;
    const trimmed = editText.trim();
    if (!trimmed) {
      cancelEdit();
      return;
    }

    if (containsHatefulLanguage(trimmed)) {
      setEditError("This note contains hateful or offensive language. Please rephrase it.");
      return;
    }

    const original = notes.find((n) => n.id === editingId);
    mutateNotes((prev) =>
      prev.map((n) => (n.id === editingId ? { ...n, text: trimmed, isPrivate: editIsPrivate } : n))
    );
    updateNote(editingId, trimmed, editIsPrivate);
    if (original && (original.text !== trimmed || original.isPrivate !== editIsPrivate)) {
      pushAction({
        type: "edit",
        id: editingId,
        before: original.text,
        after: trimmed,
        beforePrivate: original.isPrivate,
        afterPrivate: editIsPrivate,
      });
    }
    cancelEdit();
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
    setEditError(null);
  };
  // ===== END SUE'S CONTRIBUTION =====

  // ===== NBAULIB'S CONTRIBUTION: rating state, UI, and handlers =====
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  function PencilIcon({ filled }: { filled: boolean }) {
    return filled ? (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M3.14645 17.1036C3.05268 17.1973 3 17.3245 3 17.4571V20.5C3 20.7761 3.22386 21 3.5 21H6.54289C6.6755 21 6.80268 20.9473 6.89645 20.8536L17.81 9.94L14.06 6.19L3.14645 17.1036ZM20.71 7.04C21.1 6.65 21.1 6.02 20.71 5.63L18.37 3.29C17.98 2.9 17.35 2.9 16.96 3.29L15.13 5.12L18.88 8.87L20.71 7.04Z"
          fill="#F6EA7F"
        />
      </svg>
    ) : (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M3 17.25V21H6.75L17.81 9.94L14.06 6.19L3 17.25ZM20.71 7.04C21.1 6.65 21.1 6.02 20.71 5.63L18.37 3.29C17.98 2.9 17.35 2.9 16.96 3.29L15.13 5.12L18.88 8.87L20.71 7.04Z"
          stroke="#3a3a3a"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  const [showRating, setShowRating] = useState(false);
  const [rated, setRated] = useState(false);
  const [rating, setRating] = useState<number | null>(null);

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

  const seekTo = (seconds: number) => {
    const player = document.querySelector("video");
    if (player) player.currentTime = seconds;
  };

  const handleRating = (value: number) => {
    if (!videoId) return;

    setRating(value);
    setRated(true);
    setShowRating(false);

    if (videoDbId) saveRatingToSupabase(videoDbId, value);
  };
  // ===== END NBAULIB'S CONTRIBUTION =====

  useEffect(() => {
    const handleNavigate = () => setVideoId(getVideoId());
    document.addEventListener("yt-navigate-finish", handleNavigate);
    return () => document.removeEventListener("yt-navigate-finish", handleNavigate);
  }, []);

  useEffect(() => {
    // added this to prevent race condition, re-runs once email resolves so
    // ensureVideo() gets retried automatically instead of staying stuck
    if (videoId === null || email === null) {
      setNotes([]);
      setRating(null);
      setRated(false);
      setShowRating(false);
      setVideoDbId(null);
      return;
    }

    setEditingId(null);
    setNote("");
    setHistory({ past: [], future: [] });

    const { title, creator } = getVideoMeta();
    ensureVideo(videoId, title, creator).then((dbId) => {
      setVideoDbId(dbId);
      if (dbId) fetchNotes(dbId).then(setNotes);
      else setNotes([]);

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
    });
  }, [videoId, email]); // here added email to check if user is authencated to avoid race condition

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
      {/* ===== SUE'S CONTRIBUTION: main UI (title bar, note input, notes list) ===== */}
      <div className={styles["title-row"]}>
        <h3 className={styles.title}>YouNote</h3>
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

            <button className={styles.submit} onClick={handleSubmit} disabled={!videoDbId}>
              Submit
            </button>
          </div>
        )}
      </div>

      {sortedNotes.length > 0 && (
        <div className={styles.carousel}>
          {sortedNotes.map((n) => (
            <div key={n.id} className={styles.card}>
              <div className={styles.header}>
                <div className={styles["card-actions"]}>
                  {!n.isPrivate && <span className={styles.lock}>
                    <svg width="18" height="12" viewBox="0 0 18 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="8.75" cy="5.75" r="2" fill="#E6E6E6" />
                      <path d="M8.88991 0C12.7688 0 16.0899 3.3152 17.4641 4.91113C17.885 5.40006 17.885 6.09994 17.4641 6.58887C16.0899 8.1848 12.7688 11.5 8.88991 11.5V9.5C10.2657 9.5 11.668 8.90444 12.9788 7.99805C13.8546 7.3924 14.6166 6.69687 15.212 6.08556C15.3942 5.89846 15.3942 5.60154 15.212 5.41444C14.6166 4.80313 13.8546 4.1076 12.9788 3.50195C11.668 2.59556 10.2657 2 8.88991 2C7.51411 2 6.11182 2.59556 4.80104 3.50195C3.92495 4.10776 3.16241 4.80316 2.56687 5.41449C2.38464 5.60154 2.38464 5.89846 2.56687 6.08551C3.16241 6.69684 3.92495 7.39224 4.80104 7.99805C6.11182 8.90444 7.51411 9.5 8.88991 9.5V11.5C5.25351 11.5 2.1074 8.58643 0.595963 6.90723L0.315689 6.58887C-0.10523 6.09994 -0.10523 5.40006 0.315689 4.91113C1.68991 3.3152 5.01103 0 8.88991 0Z" fill="#E6E6E6" />
                    </svg>
                  </span>}
                  {n.isPrivate && <span className={styles.lock}>
                    <svg width="18" height="10" viewBox="0 0 18 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M16.6093 1.00002C11.6427 6.92528 6.20311 7.15316 1.00002 1.00002" stroke="#E6E6E6" strokeWidth="2" strokeLinecap="round" />
                      <path d="M3.83808 4.01989L1.94604 6.53645" stroke="#E6E6E6" strokeWidth="2" strokeLinecap="round" />
                      <path d="M6.20312 5.52982L5.73011 8.54969" stroke="#E6E6E6" strokeWidth="2" strokeLinecap="round" />
                      <path d="M11.9016 5.39718C11.8446 4.84507 11.3569 4.45689 10.8123 4.53015C10.2677 4.60341 9.87238 5.11036 9.92938 5.66247L10.9155 5.52982L11.9016 5.39718ZM10.2435 8.70569C10.3005 9.25779 10.7882 9.64597 11.3329 9.57271C11.8775 9.49946 12.2728 8.9925 12.2158 8.4404L11.2297 8.57304L10.2435 8.70569ZM10.9155 5.52982L9.92938 5.66247L10.2435 8.70569L11.2297 8.57304L12.2158 8.4404L11.9016 5.39718L10.9155 5.52982Z" fill="#E6E6E6" />
                      <path d="M13.7888 3.80964C13.4091 3.40127 12.7938 3.3897 12.4147 3.78379C12.0355 4.17788 12.0359 4.8284 12.4156 5.23677L13.1022 4.52321L13.7888 3.80964ZM14.4393 7.41309C14.819 7.82146 15.4342 7.83304 15.8134 7.43895C16.1925 7.04486 16.1921 6.39434 15.8124 5.98596L15.1258 6.69953L14.4393 7.41309ZM13.1022 4.52321L12.4156 5.23677L14.4393 7.41309L15.1258 6.69953L15.8124 5.98596L13.7888 3.80964L13.1022 4.52321Z" fill="#E6E6E6" />
                    </svg>
                  </span>}
                  <button className={styles.timestamp} onClick={() => seekTo(n.videoTime)}>
                    {formatTime(n.videoTime)}
                  </button>
                </div>
                {n.profileId === userId && (
                  <NoteMenu
                    onEdit={() => startEdit(n.id, n.text, n.isPrivate)}
                    onDelete={() => handleDelete(n.id)}
                  />
                )}
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
                  <div className={styles["char-count"]}>{editText.length}/{NOTE_MAX_LENGTH}</div>
                  {editError && <div className={styles["note-error"]}>{editError}</div>}
                  <label className={styles.switch} onMouseDown={(e) => e.preventDefault()}>
                    <input
                      type="checkbox"
                      checked={!editIsPrivate}
                      onChange={(e) => setEditIsPrivate(!e.target.checked)}
                    />
                    <span className={styles.slider}></span>
                    <span className={styles["switch-label"]}>
                      {editIsPrivate ? "Private" : "Public"}
                    </span>
                  </label>
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
                <div className={styles["note-content-wrapper"]}>
                  <div className={styles["note-username"]}>
                    @{n.username}
                  </div>

                  <div className={styles["note-content"]}>
                    {n.text}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {/* ===== END SUE'S CONTRIBUTION ===== */}

      {/* ===== NBAULIB'S CONTRIBUTION: rating UI ===== */}
      <div className={styles.rating}>
        {showRating && (
          <div className={styles.stars} onMouseLeave={() => setHoverRating(null)}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                className={styles.star}
                onClick={() => handleRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
              >
                <PencilIcon filled={star <= (hoverRating ?? rating ?? 0)} />
              </button>
            ))}
          </div>
        )}

        {rating && !showRating && (
          <button
            className={styles.savedRating}
            onClick={() => setShowRating(true)}
            aria-label={`Edit rating, currently ${rating} out of 5`}
          >
            {[1, 2, 3, 4, 5].map((star) => (
              <PencilIcon key={star} filled={star <= rating} />
            ))}
          </button>
        )}
      </div>
      {/* ===== END NBAULIB'S CONTRIBUTION ===== */}
    </div>
  );
}
