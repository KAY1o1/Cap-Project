type NoteItem = {
  id: string;
  profile_id?: string;
  video_id?: string; // This remains the UUID
  content: string;
  created_at?: string;
  updated_at?: string;
  is_private?: boolean;
  timestamp_seconds?: number;
  videos?: { youtube_video_id: string }; // <-- Add the joined table data
};

type NotesModalProps = {
  isOpen: boolean;
  loading: boolean;
  notes: NoteItem[];
  videoId: string | null; // <-- Add this prop
  onClose: () => void;
};

export default function NotesModal({
  isOpen,
  loading,
  notes,
  videoId,
  onClose,
}: NotesModalProps) {
  if (!isOpen) {
    return null;
  }

  const visibleNotes = notes.filter((note) => {
    const isPublic = note.is_private !== true;
    // Target youtube_video_id here:
    const matchesVideo = note.videos?.youtube_video_id === videoId;

    return isPublic && matchesVideo;
  });

  return (
    <div className="notes-modal-backdrop" onClick={onClose}>
      <div className="notes-modal" onClick={(event) => event.stopPropagation()}>
        <div className="notes-modal-header">
          <h2>Notes</h2>
          <button
            type="button"
            className="notes-close-button"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : visibleNotes.length > 0 ? (
          <div className="notes-list">
            {visibleNotes.map((note) => (
              <p key={note.id}>{note.content}</p>
            ))}
          </div>
        ) : (
          <p>No notes saved yet.</p>
        )}
      </div>
    </div>
  );
}
