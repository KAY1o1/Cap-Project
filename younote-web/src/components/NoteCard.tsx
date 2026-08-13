// import { formatTime, formatDate } from '../utils/format';   
import NoteMenu from './NoteMenu';

// formats timestamps
export function formatTime(seconds: number | undefined | null): string | null {
    if (seconds === undefined || seconds === null) return null;

    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    const paddedSecs = s.toString().padStart(2, '0');

    if (h > 0) {
        const paddedMins = m.toString().padStart(2, '0');
        return `${h}:${paddedMins}:${paddedSecs}`;
    }

    return `${m}:${paddedSecs}`;
}

// "Jan 1, 2026" style date for note cards
export function formatDate(isoString: string | undefined): string {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export const NOTE_MAX_LENGTH = 150;

export type NoteCardData = {
    id: string;
    content: string;
    created_at: string;
    timestamp_seconds?: number;
    isPrivate: boolean;
    // username: string;
    profileId: string;
};

type NoteCardProps = {
    note: NoteCardData;
    // edit/delete only for owner
    currentUserId: string | null;
    isEditing: boolean;
    editingText: string;
    editingIsPrivate: boolean;
    editingError: string | null;
    isSaving: boolean;
    isDeleting: boolean;
    onOpen: () => void;
    onStartEdit: () => void;
    onCancelEdit: () => void;
    onSaveEdit: () => void;
    onEditingTextChange: (value: string) => void;
    onEditingPrivacyChange: (isPrivate: boolean) => void;
    onDelete: () => void;
};

export default function NoteCard({
    note,
    currentUserId,
    isEditing,
    editingText,
    editingIsPrivate,
    editingError,
    isSaving,
    // isDeleting,
    onOpen,
    onStartEdit,
    onCancelEdit,
    onSaveEdit,
    onEditingTextChange,
    onEditingPrivacyChange,
    onDelete,
}: NoteCardProps) {
    const videoTimeMarker = formatTime(note.timestamp_seconds);
    const isOwner = note.profileId === currentUserId;

    return (
        <div className="note-card">
            <div className="note-card-header">
                <div className="note-card-actions-left">
                    {!note.isPrivate && (
                        <span className="note-card-privacy-icon">
                            Public
                        </span>
                    )}
                    {note.isPrivate && (
                        <span className="note-card-privacy-icon">
                            Private
                        </span>
                    )}
                    <button className="note-card-timestamp" onClick={onOpen}>
                        {videoTimeMarker ? `@${videoTimeMarker}` : 'Open'}
                    </button>
                </div>

                {isOwner && (
                    <NoteMenu
                        onEdit={onStartEdit}
                        onDelete={onDelete}
                        scrollContainerSelector=".notes-card-grid"
                    />
                )}
            </div>

            {isEditing ? (
                <div className="note-card-edit-area">
                    <textarea
                        className="note-card-textarea"
                        value={editingText}
                        onChange={(e) => onEditingTextChange(e.target.value)}
                        autoFocus
                        maxLength={NOTE_MAX_LENGTH}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                onSaveEdit();
                            } else if (e.key === 'Escape') {
                                onCancelEdit();
                            }
                        }}
                    />
                    <div className="note-card-char-count">
                        {editingText.length}/{NOTE_MAX_LENGTH}
                    </div>

                    {editingError && <div className="note-card-error">{editingError}</div>}

                    <label className="note-card-switch" onMouseDown={(e) => e.preventDefault()}>
                        <input
                            type="checkbox"
                            checked={!editingIsPrivate}
                            onChange={(e) => onEditingPrivacyChange(!e.target.checked)}
                        />
                        <span className="note-card-slider"></span>
                        <span className="note-card-switch-label">
                            {editingIsPrivate ? 'Private' : 'Public'}
                        </span>
                    </label>

                    <div className="note-card-edit-actions">
                        <button
                            className="note-card-cancel-btn"
                            onClick={onCancelEdit}
                            disabled={isSaving}
                        >
                            Cancel
                        </button>
                        <button
                            className="note-card-save-btn"
                            onClick={onSaveEdit}
                            disabled={isSaving}
                        >
                            {isSaving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="note-card-content-wrapper">
                    <div className="note-card-content">{note.content}</div>
                    <p className="note-card-date">{formatDate(note.created_at)}</p>
                </div>
            )}
        </div>
    );
}