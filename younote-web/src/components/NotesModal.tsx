export type NoteItem = {
  id: string;
  profile_id?: string;
  video_id?: string;
  content: string;
  created_at?: string;
  updated_at?: string;
  is_private?: boolean;
  timestamp_seconds?: number;
  videos?: { id?: string; youtube_video_id: string };
  profiles?: { username?: string; email?: string };
};

type NotesModalProps = {
  isOpen: boolean;
  loading: boolean;
  notes: NoteItem[];
  videoId: string | null;
  currentUserId: string | null;
  videoRatings: { profile_id: string; rating: number }[];
  onClose: () => void;
};

export default function NotesModal({
  isOpen,
  loading,
  notes,
  videoId,
  currentUserId,
  videoRatings,
  onClose,
}: NotesModalProps) {
  if (!isOpen) return null;

  const formatVideoTimestamp = (totalSeconds?: number | null) => {
    if (totalSeconds === undefined || totalSeconds === null) return null;
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = Math.floor(totalSeconds % 60);
    const paddedSecs = secs.toString().padStart(2, "0");
    if (hrs > 0) {
      const paddedMins = mins.toString().padStart(2, "0");
      return `${hrs}:${paddedMins}:${paddedSecs}`;
    }
    return `${mins}:${paddedSecs}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Unknown date";
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const visibleNotes = notes
    .filter((note) => {
      const isPublic = note.is_private !== true;
      const isMine = note.profile_id === currentUserId;
      const matchesVideo = note.videos?.youtube_video_id === videoId;

      return (isPublic || isMine) && matchesVideo;
    })
    .sort((a, b) => {
      const aIsMe = a.profile_id === currentUserId;
      const bIsMe = b.profile_id === currentUserId;

      if (aIsMe && !bIsMe) return -1;
      if (!aIsMe && bIsMe) return 1;

      const timeA = a.timestamp_seconds ?? 999999;
      const timeB = b.timestamp_seconds ?? 999999;

      if (timeA !== timeB) return timeA - timeB;

      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
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
            {visibleNotes.map((note) => {
              const isMyNote = note.profile_id === currentUserId;
              const authorName = isMyNote
                ? "You"
                : note.profiles?.username ||
                  note.profiles?.email ||
                  "Anonymous";

              const timeMarker = formatVideoTimestamp(note.timestamp_seconds);

              //If the user left a rating
              const authorRating = videoRatings.find(
                (r) => r.profile_id === note.profile_id,
              )?.rating;

              return (
                <div key={note.id} className="note-card">
                  <div className="note-card-header">
                    <span>
                      <strong>{authorName}</strong> {isMyNote && "!"}
                    </span>
                    <span>{formatDate(note.created_at)}</span>
                  </div>

                  <p className="note-card-content">{note.content}</p>

                  {authorRating && (
                    <p
                      style={{
                        fontSize: "12px",
                        margin: "8px 0",
                        color: "#4b5563",
                        textAlign: "center",
                      }}
                    >
                      {"✏️".repeat(
                        Math.max(0, Math.min(5, Math.floor(authorRating))),
                      )}
                    </p>
                  )}

                  {timeMarker && (
                    <span className="note-timestamp">⏱ {timeMarker}</span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p>No notes saved yet.</p>
        )}
      </div>
    </div>
  );
}
