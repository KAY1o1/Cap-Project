import { useEffect, useState } from "react";
import NoteMenu from "./NoteMenu";
import { useSession } from "../lib/auth"; // Google OAuth
import "./notes.css";

type Note = {
  id: string;
  text: string;
  createdAt: number;
  videoTime: number;
};

type NotesStorage = {
  [videoId: string]: Note[];
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
function loadNotes(videoId: string): Promise<Note[]> {
  return new Promise((resolve) => {
    chrome.storage.local.get(videoId, (res: NotesStorage) => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        resolve([]);
        return;
      }
      resolve(res[videoId] ?? []);
    });
  });
}

function saveNotes(videoId: string, notes: Note[]): Promise<void> {
  const update: NotesStorage = { [videoId]: notes };
  return new Promise((resolve) => {
    chrome.storage.local.set(update, () => resolve());
  });
}

export default function NotesPanel() {
  const email = useSession(); // Google OAuth
  const [videoId, setVideoId] = useState<string | null>(getVideoId);
  const [notes, setNotes] = useState<Note[]>([]);
  const [note, setNote] = useState("");
  const [focused, setFocused] = useState(false);

  // LOAD ON NEW VID (SPA)
  useEffect(() => {
    const handleNavigate = () => setVideoId(getVideoId());
    document.addEventListener("yt-navigate-finish", handleNavigate);
    return () =>
      document.removeEventListener("yt-navigate-finish", handleNavigate);
  }, []);

  // ID CHANGE
  useEffect(() => {
    if (!videoId) {
      setNotes([]);
      return;
    }
    loadNotes(videoId).then(setNotes);
  }, [videoId]);

  // TIMESTAMP
  const getCurrentVideoTime = (): number => {
    const player = document.querySelector("video");
    return player ? player.currentTime : 0;
  };

  // HELPER
  const mutateNotes = (updater: (prev: Note[]) => Note[]) => {
    if (!videoId) return;
    setNotes((prev) => {
      const updated = updater(prev);
      saveNotes(videoId, updated);
      return updated;
    });
  };

  const addNote = (text: string) => {
    const newNote: Note = {
      id: crypto.randomUUID(),
      text,
      createdAt: Date.now(),
      videoTime: getCurrentVideoTime(),
    };
    mutateNotes((prev) => [...prev, newNote]);
  };

  const handleSubmit = () => {
    if (!note.trim()) return;
    addNote(note);
    setNote(""); // reset area
  };

  const handleDelete = (id: string) => {
    mutateNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const handleEdit = (id: string, text: string) => {
    mutateNotes((prev) => prev.map((n) => (n.id === id ? { ...n, text } : n)));
  };

  // JUMP TO TIME
  const seekTo = (seconds: number) => {
    const player = document.querySelector("video");
    if (player) player.currentTime = seconds;
  };

  // Google OAuth: no notes unless signed in
  if (!email) {
    return (
      <div className="yn-container">
        <h3 className="yn-title">YouNote</h3>
        <p className="yn-signin">Sign in to take notes.</p>
      </div>
    );
  }

  return (
    <div className="yn-container">
      <h3 className="yn-title">YouNote</h3>

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        placeholder="Add a note..."
        className="yn-textarea"
      />

      {focused && (
        <button className="yn-submit" onClick={handleSubmit}>
          Submit
        </button>
      )}

      {notes.length > 0 && (
        <div id="yn-carousel" className="yn-carousel">
          {notes.map((n) => (
            <div key={n.id} className="yn-card">
              <div className="yn-header">
                <button
                  className="yn-timestamp"
                  onClick={() => seekTo(n.videoTime)}
                >
                  @{formatTime(n.videoTime)}
                </button>
                <NoteMenu
                  onEdit={() => handleEdit(n.id, n.text)}
                  onDelete={() => handleDelete(n.id)}
                />
              </div>
              <div className="yn-note-content">{n.text}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}