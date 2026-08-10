import '../styles/NotesPage.css';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import VideoSidebar from '../components/VideoSidebar';
import type { VideoFolder } from '../components/VideoSidebar';

type VideoItem = {
    id: string;
    title: string;
    youtube_video_id: string;
    creator?: string;
    created_at: string;
};

type NoteItem = {
    id: string;
    profile_id: string;
    video_id: string;
    content: string;
    created_at: string;
    timestamp_seconds?: number;
    video?: VideoItem[] | VideoItem;
};

type RatingRow = {
    video_id: string;
    rating: number;
    created_at: string;
    video?: VideoItem[] | VideoItem;
};

type KeyTopic = {
    term: string;
    mention_count: number;
    note_count: number;
    timestamps: number[];
};

type NotesPageP = {
    setPage: (page: 'home' | 'notes') => void;
};

const formatVideoTimestamp = (totalSeconds: number | undefined) => {
    if (totalSeconds === undefined || totalSeconds === null) return null;

    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = Math.floor(totalSeconds % 60);

    const paddedSecs = secs.toString().padStart(2, '0');

    if (hrs > 0) {
        const paddedMins = mins.toString().padStart(2, '0');
        return `${hrs}:${paddedMins}:${paddedSecs}`;
    }

    return `${mins}:${paddedSecs}`;
};

const formatDate = (isoString: string | undefined) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function NotesPage({ setPage }: NotesPageP) {
    const [notes, setNotes] = useState<NoteItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasUser, setHasUser] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingText, setEditingText] = useState('');
    const [savingId, setSavingId] = useState<string | null>(null);
    const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
    const [ratingsByVideoId, setRatingsByVideoId] = useState<Record<string, number>>({});
    const [ratingRows, setRatingRows] = useState<RatingRow[]>([]);
    const [keyTopics, setKeyTopics] = useState<KeyTopic[]>([]);
    const [topicLoading, setTopicLoading] = useState(false);
    const [topicError, setTopicError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        const fetchNotes = async () => {
            try {
                setLoading(true);
                setError(null);

                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    if (isMounted) {
                        setHasUser(false);
                        setLoading(false);
                    }
                    return;
                }

                if (isMounted) setHasUser(true);

                const [notesResult, ratingsResult] = await Promise.all([
                    supabase
                        .from('notes')
                        .select(`id, profile_id, video_id, content, created_at, timestamp_seconds, video:videos!video_id(id, title, youtube_video_id, creator)`)
                        .eq('profile_id', user.id)
                        .order('created_at', { ascending: false }),

                    supabase
                        .from('video_ratings')
                        .select(`video_id, rating, created_at, video:videos!video_id(id, title, youtube_video_id, creator)`)
                        .eq('profile_id', user.id),
                ]);

                if (notesResult.error) throw notesResult.error;

                if (isMounted) {
                    setNotes((notesResult.data as NoteItem[]) || []);

                    const ratingData = (ratingsResult.data as RatingRow[]) || [];
                    setRatingRows(ratingData);

                    const ratingsMap: Record<string, number> = {};
                    for (const row of ratingData) {
                        ratingsMap[row.video_id] = row.rating;
                    }
                    setRatingsByVideoId(ratingsMap);
                }
            } catch (err) {
                console.error('Error loading notes:', err);
                if (isMounted) {
                    setError('Something went wrong loading your notes.');
                    setNotes([]);
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchNotes();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
            fetchNotes();
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const getVideoData = (videoWrapper: NoteItem['video']): VideoItem | null => {
        if (!videoWrapper) return null;
        return Array.isArray(videoWrapper) ? (videoWrapper[0] ?? null) : videoWrapper;
    };

    // Group notes by video like a folder in the sidebar,
    // + any rated videos that have no notes at all yet.
    const videoFolders = useMemo<VideoFolder[]>(() => {
        const foldersByVideoId = new Map<string, VideoFolder>();

        for (const note of notes) {
            const video = getVideoData(note.video);
            if (!video) continue;

            const existing = foldersByVideoId.get(note.video_id);
            if (existing) {
                existing.noteCount += 1;
                if (note.created_at > existing.lastNoteAt) {
                    existing.lastNoteAt = note.created_at;
                }
            } else {
                foldersByVideoId.set(note.video_id, {
                    id: note.video_id,
                    title: video.title || 'Title',
                    creator: video.creator,
                    youtube_video_id: video.youtube_video_id,
                    noteCount: 1,
                    lastNoteAt: note.created_at,
                });
            }
        }

        for (const rating of ratingRows) {
            if (foldersByVideoId.has(rating.video_id)) continue;

            const video = getVideoData(rating.video);
            if (!video) continue;

            foldersByVideoId.set(rating.video_id, {
                id: rating.video_id,
                title: video.title || 'Title',
                creator: video.creator,
                youtube_video_id: video.youtube_video_id,
                noteCount: 0,
                lastNoteAt: rating.created_at,
            });
        }

        return Array.from(foldersByVideoId.values()).sort(
            (a, b) => new Date(b.lastNoteAt).getTime() - new Date(a.lastNoteAt).getTime()
        );
    }, [notes, ratingRows]);

    // Default to the video with the most recent note once notes have loaded
    useEffect(() => {
        if (selectedVideoId === null && videoFolders.length > 0) {
            setSelectedVideoId(videoFolders[0].id);
        }
    }, [videoFolders, selectedVideoId]);

    const startEdit = (note: NoteItem) => {
        setEditingId(note.id);
        setEditingText(note.content);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditingText('');
    };

    const saveEdit = async (noteId: string) => {
        const trimmed = editingText.trim();
        if (!trimmed) {
            window.alert("Note can't be empty.");
            return;
        }

        try {
            setSavingId(noteId);
            const { error: updateError } = await supabase
                .from('notes')
                .update({ content: trimmed })
                .eq('id', noteId);

            if (updateError) throw updateError;

            setNotes((prev) =>
                prev.map((note) => (note.id === noteId ? { ...note, content: trimmed } : note))
            );
            setEditingId(null);
            setEditingText('');
        } catch (err) {
            console.error('Error updating note:', err);
            window.alert('Could not save changes. Please try again.');
        } finally {
            setSavingId(null);
        }
    };

    const handleDelete = async (noteId: string) => {
        const confirmed = window.confirm('Delete this note? This can\'t be undone.');
        if (!confirmed) return;

        try {
            setDeletingId(noteId);
            const { error: deleteError } = await supabase
                .from('notes')
                .delete()
                .eq('id', noteId);

            if (deleteError) throw deleteError;

            setNotes((prev) => prev.filter((note) => note.id !== noteId));
        } catch (err) {
            console.error('Error deleting note:', err);
            window.alert('Could not delete this note. Please try again.');
        } finally {
            setDeletingId(null);
        }
    };

    const openVideoAtTimestamp = (note: NoteItem) => {
        const video = getVideoData(note.video);
        if (!video?.youtube_video_id) return;

        const seconds = note.timestamp_seconds ? Math.floor(note.timestamp_seconds) : 0;
        const url = `https://www.youtube.com/watch?v=${video.youtube_video_id}${seconds ? `&t=${seconds}s` : ''}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const generateKeyTopics = async () => {
        if (!selectedVideoId) return;

        const videoNotes = notes.filter((note) => note.video_id === selectedVideoId);
        if (videoNotes.length === 0) return;

        try {
            setTopicLoading(true);
            setTopicError(null);
            const apiUrl = (import.meta.env.VITE_TOPIC_API_URL || 'http://localhost:8000').replace(/\/$/, '');
            const response = await fetch(`${apiUrl}/topics`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    notes: videoNotes.map((note) => ({
                        content: note.content,
                        timestamp_seconds: note.timestamp_seconds,
                    })),
                }),
            });

            if (!response.ok) throw new Error('Topic service request failed');
            const data = await response.json() as { topics: KeyTopic[] };
            setKeyTopics(data.topics);
        } catch (err) {
            console.error('Error generating key topics:', err);
            setTopicError('Could not generate topics. Start the topic service and try again.');
            setKeyTopics([]);
        } finally {
            setTopicLoading(false);
        }
    };

    const filteredNotes = useMemo(() => {
        let scoped = selectedVideoId
            ? notes.filter((note) => note.video_id === selectedVideoId)
            : notes;

        if (searchTerm.trim()) {
            const term = searchTerm.trim().toLowerCase();
            scoped = scoped.filter((note) => {
                const video = getVideoData(note.video);
                const title = video?.title?.toLowerCase() || '';
                const creator = video?.creator?.toLowerCase() || '';
                const content = note.content?.toLowerCase() || '';
                return title.includes(term) || creator.includes(term) || content.includes(term);
            });
        }

        return scoped;
    }, [notes, searchTerm, selectedVideoId]);

    const selectedVideo = selectedVideoId
        ? videoFolders.find((video) => video.id === selectedVideoId) || null
        : null;

    useEffect(() => {
        setKeyTopics([]);
        setTopicError(null);
    }, [selectedVideoId]);

    if (loading) {
        return (
            <div className="notes-container">
                <h3>Loading your notes...</h3>
            </div>
        );
    }

    if (!hasUser) {
        return (
            <div className="notes-container" style={{ textAlign: 'center', paddingTop: '60px' }}>
                <p>Sign into the extension to view your notes</p>
            </div>
        );
    }

    return (
        <div className="notes-page-layout">
            <VideoSidebar
                videos={videoFolders}
                selectedVideoId={selectedVideoId}
                onSelect={setSelectedVideoId}
            />

            <div className="notes-container">
                <div className="notes-header">
                    <button className="notes-back-btn" onClick={() => setPage('home')}>
                        ← Back
                    </button>
                    <h1 id="notes-title">
                        {selectedVideo ? selectedVideo.title : 'Notes'}
                    </h1>
                </div>

                {selectedVideo && (
                    <>
                        <p className="notes-subheader">
                            by {selectedVideo.creator || 'Creator'}
                            {ratingsByVideoId[selectedVideo.id] !== undefined && (
                                <>
                                    {' '}·{' '}
                                    <span className="notes-rating">
                                        {ratingsByVideoId[selectedVideo.id]}/5{' '}
                                        {'✏️'.repeat(Math.max(0, Math.min(5, Math.floor(ratingsByVideoId[selectedVideo.id]))))}
                                    </span>
                                </>
                            )}
                        </p>
                        <div className="key-topics-panel">
                            <div className="key-topics-heading">
                                <div>
                                    <h2>Key topics</h2>
                                    <p>Generated from all notes for this video.</p>
                                </div>
                                <button
                                    className="key-topics-button"
                                    onClick={generateKeyTopics}
                                    disabled={topicLoading || !notes.some((note) => note.video_id === selectedVideoId)}
                                >
                                    {topicLoading ? 'Finding topics...' : 'Generate topics'}
                                </button>
                            </div>
                            {topicError && <p className="key-topics-error">{topicError}</p>}
                            {keyTopics.length > 0 && (
                                <div className="key-topics-list" aria-label="Generated key topics">
                                    {keyTopics.map((topic) => (
                                        <span key={topic.term} className="key-topic-chip" title={`Mentioned in ${topic.note_count} note${topic.note_count === 1 ? '' : 's'}`}>
                                            {topic.term}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}

                {!selectedVideoId ? (
                    <div className="notes-empty">
                        <p>Select a video from the sidebar to see its notes.</p>
                    </div>
                ) : (
                    <>
                        <div className="notes-search-row">
                            <input
                                type="text"
                                className="notes-search-input"
                                placeholder="Search this video's notes..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <span className="notes-count">{filteredNotes.length} note{filteredNotes.length === 1 ? '' : 's'}</span>
                        </div>

                        <hr className="notes-divider" />

                        {error && <p className="notes-error">{error}</p>}

                        {!error && filteredNotes.length === 0 && (
                            <div className="notes-empty">
                                <p>
                                    {searchTerm
                                        ? 'No notes match your search.'
                                        : "You haven't taken any notes on this video yet."}
                                </p>
                            </div>
                        )}

                        <div className="notes-card-grid">
                            {filteredNotes.map((note) => {
                                const videoTimeMarker = formatVideoTimestamp(note.timestamp_seconds);

                                return (
                                    <div key={note.id} className="note-card">
                                        <div className="note-card-header">
                                            <button
                                                className="note-card-timestamp"
                                                onClick={() => openVideoAtTimestamp(note)}
                                            >
                                                {videoTimeMarker ? `@${videoTimeMarker}` : 'Open'}
                                            </button>

                                            <div className="note-card-actions">
                                                {editingId !== note.id && (
                                                    <button
                                                        className="note-card-edit"
                                                        onClick={() => startEdit(note)}
                                                        aria-label="Edit note"
                                                    >
                                                        ✎
                                                    </button>
                                                )}

                                                <button
                                                    className="note-card-delete"
                                                    onClick={() => handleDelete(note.id)}
                                                    disabled={deletingId === note.id}
                                                    aria-label="Delete note"
                                                >
                                                    {deletingId === note.id ? '...' : '✕'}
                                                </button>
                                            </div>
                                        </div>

                                        {editingId === note.id ? (
                                            <div className="note-card-edit-area">
                                                <textarea
                                                    className="note-card-textarea"
                                                    value={editingText}
                                                    onChange={(e) => setEditingText(e.target.value)}
                                                    rows={4}
                                                    autoFocus
                                                />
                                                <div className="note-card-edit-actions">
                                                    <button
                                                        className="note-card-cancel-btn"
                                                        onClick={cancelEdit}
                                                        disabled={savingId === note.id}
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        className="note-card-save-btn"
                                                        onClick={() => saveEdit(note.id)}
                                                        disabled={savingId === note.id}
                                                    >
                                                        {savingId === note.id ? 'Saving...' : 'Save'}
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <p className="note-card-content">{note.content}</p>
                                                <p className="note-card-date">{formatDate(note.created_at)}</p>
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
