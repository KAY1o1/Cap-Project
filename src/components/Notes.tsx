import { useEffect, useState, useMemo } from "react";
import NoteMenu from "./NoteMenu";
import { useSession } from "../lib/auth"; // Google OAuth
import { ensureProfile } from "../lib/db"; // Supabase: log the user
import styles from "./notes.module.css";

type Note = {
  id: string;
  text: string;
  createdAt: number;
  videoTime: number;
  isPublic: boolean;
};

// EXTRACT VID ID FROM URL
function getVideoId(): string | null {
  return new URL(window.location.href).searchParams.get("v");
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// CHROME STORAGE
async function loadNotes(videoId: string): Promise<Note[]> {
  try {
    const res = await chrome.storage.local.get(videoId);
    const notes = (res[videoId] ?? []) as Note[];
    return notes.map((note) => ({
      ...note,
      isPublic: note.isPublic ?? false,
    }));
  } catch (err) {
    console.error("Failed to load notes:", err);
    return [];
  }
}

async function saveNotes(videoId: string, notes: Note[]): Promise<void> {
  await chrome.storage.local.set({ [videoId]: notes });
}

async function loadRating(videoId: string): Promise<number | null> {
  const key = `${videoId}-rating`;
  const res = await chrome.storage.local.get(key);
  const value = res[key];

  if (typeof value === "number") { return value; }
  return null;
}

async function saveRating(videoId: string, rating: number): Promise<void> {
  await chrome.storage.local.set({
    [`${videoId}-rating`]: rating,
  });
}

export default function NotesPanel() {
  const email = useSession(); // Google OAuth
  const [videoId, setVideoId] = useState<string | null>(getVideoId);

  // When someone is signed in, log their info into the Supabase `profiles` table.
  useEffect(() => {
    if (email) ensureProfile();
  }, [email]);

  const [notes, setNotes] = useState<Note[]>([]);
  const [note, setNote] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

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
      return;
    }

    setEditingId(null);
    setNote("");

    loadNotes(videoId).then(setNotes);

    loadRating(videoId).then((savedRating) => {
      setRating(savedRating);

      if (savedRating !== null) {
        setRated(true);
      }
    });
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
    if (!videoId) return;
    setNotes((prev) => {
      const updated = updater(prev);
      saveNotes(videoId, updated);
      return updated;
    });
  };

  const handleSubmit = () => {
    if (!note.trim()) return;

    const newNote: Note = {
      id: crypto.randomUUID(),
      text: note.trim(),
      createdAt: Date.now(),
      videoTime: getCurrentVideoTime(),
      isPublic,
    };

    mutateNotes((prev) => [...prev, newNote]);
    setNote("");
  };

  const handleDelete = (id: string) => {
    mutateNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const startEdit = (id: string, text: string) => {
    setEditingId(id);
    setEditText(text);
  };

  const saveEdit = () => {
    if (!editingId) return;
    const trimmed = editText.trim();
    if (!trimmed) {
      cancelEdit();
      return;
    }
    mutateNotes((prev) =>
      prev.map((n) => (n.id === editingId ? { ...n, text: trimmed } : n))
    );
    cancelEdit();
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
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

    saveRating(videoId, value);
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
      <h3 className={styles.title}>YouNote</h3>

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
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a note..."
          className={styles.textarea}
        />

        {showControls && (
          <div className={styles["hidden-buttons"]}>
            <label className={styles.switch} onMouseDown={(e) => e.preventDefault()}>
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
              />
              <span className={styles.slider}></span>
              <span className={styles["switch-label"]}>
                {isPublic ? "Public" : "Private"}
              </span>
            </label>

            <button className={styles.submit} onClick={handleSubmit}>
              Submit
            </button>
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
                  {!n.isPublic && <span className={styles.lock}>🔒</span>}
                  <button className={styles.timestamp} onClick={() => seekTo(n.videoTime)}>
                    @{formatTime(n.videoTime)}
                  </button>
                </div>
                <NoteMenu
                  onEdit={() => startEdit(n.id, n.text)}
                  onDelete={() => handleDelete(n.id)}
                />
              </div>

              {editingId === n.id ? (
                <div className={styles["edit-wrapper"]}>
                  <textarea
                    className={styles.textarea}
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                        saveEdit();
                      } else if (e.key === "Escape") {
                        cancelEdit();
                      }
                    }}
                  />
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