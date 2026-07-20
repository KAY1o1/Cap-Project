import { useEffect, useState, useMemo } from "react";
import NoteMenu from "./NoteMenu";
import { useSession } from "../lib/auth"; // Google OAuth
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
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (seconds > 3600) {
    return `${h}:${m}:${s.toString().padStart(2, "0")}`
  } else {
    return `${m}:${s.toString().padStart(2, "0")}`
  }
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
                  {n.isPublic && <span className={styles.lock}>
                    {/* eye open */}
                    <svg width="18" height="12" viewBox="0 0 18 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="8.75" cy="5.75" r="2" fill="#E6E6E6" />
                      <path d="M8.88991 0C12.7688 0 16.0899 3.3152 17.4641 4.91113C17.885 5.40006 17.885 6.09994 17.4641 6.58887C16.0899 8.1848 12.7688 11.5 8.88991 11.5V9.5C10.2657 9.5 11.668 8.90444 12.9788 7.99805C13.8546 7.3924 14.6166 6.69687 15.212 6.08556C15.3942 5.89846 15.3942 5.60154 15.212 5.41444C14.6166 4.80313 13.8546 4.1076 12.9788 3.50195C11.668 2.59556 10.2657 2 8.88991 2C7.51411 2 6.11182 2.59556 4.80104 3.50195C3.92495 4.10776 3.16241 4.80316 2.56687 5.41449C2.38464 5.60154 2.38464 5.89846 2.56687 6.08551C3.16241 6.69684 3.92495 7.39224 4.80104 7.99805C6.11182 8.90444 7.51411 9.5 8.88991 9.5V11.5C5.25351 11.5 2.1074 8.58643 0.595963 6.90723L0.315689 6.58887C-0.10523 6.09994 -0.10523 5.40006 0.315689 4.91113C1.68991 3.3152 5.01103 0 8.88991 0Z" fill="#E6E6E6" />
                    </svg>

                  </span>}
                  {!n.isPublic && <span className={styles.lock}>
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