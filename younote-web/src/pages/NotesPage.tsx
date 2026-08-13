import '../styles/NotesPage.css';
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import VideoSidebar from '../components/VideoSidebar';
import type { VideoFolder } from '../components/VideoSidebar';
import NoteCard from '../components/NoteCard';
import KeyTopicsPanel from '../components/KeyTopicsPanel';

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
    is_private: boolean;
    // username: string;
    // handles array OR a single object
    video?: VideoItem[] | VideoItem;
};

type RatingRow = {
    video_id: string;
    rating: number;
    created_at: string;
    video?: VideoItem[] | VideoItem;
};

type NotesPageP = {
    setPage: (page: 'home' | 'notes' | 'explore') => void;
};

export default function NotesPage({ setPage }: NotesPageP) {
    const [notes, setNotes] = useState<NoteItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasUser, setHasUser] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // delete/edit tracking IDs
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingText, setEditingText] = useState('');
    const [savingId, setSavingId] = useState<string | null>(null);

    const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
    const [ratingsByVideoId, setRatingsByVideoId] = useState<Record<string, number>>({});
    const [ratingRows, setRatingRows] = useState<RatingRow[]>([]);

    const [userId, setUserId] = useState<string | null>(null);
    const [editingIsPrivate, setEditingIsPrivate] = useState(false);

    useEffect(() => {
        // isMounted guards against setState after the component's gone
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

                if (isMounted) {
                    setHasUser(true);
                    setUserId(user.id); // 2. Store the user ID in state
                }

                // parallel queries to the database
                const [notesResult, ratingsResult] = await Promise.all([
                    supabase
                        .from('notes')
                        .select(`id, profile_id, video_id, content, created_at, timestamp_seconds, is_private, video:videos!video_id(id, title, youtube_video_id, creator)`)
                        .eq('profile_id', user.id)
                        .order('created_at', { ascending: false }),

                    supabase
                        .from('video_ratings')
                        .select(`video_id, rating, created_at, video:videos!video_id(id, title, youtube_video_id, creator)`)
                        .eq('profile_id', user.id),
                ]);

                // error for notes
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

        // Re-fetch whenever auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
            fetchNotes();
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, []);

    // handles array or object again
    const getVideoData = (videoWrapper: NoteItem['video']): VideoItem | null => {
        if (!videoWrapper) return null;
        return Array.isArray(videoWrapper) ? (videoWrapper[0] ?? null) : videoWrapper;
    };

    // Group notes by video, like a folder in the sidebar
    // + any rated videos that have no notes at all yet
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

        // videos with no note but ratings are displayed
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

        // most recent note on top
        return Array.from(foldersByVideoId.values()).sort(
            (a, b) => new Date(b.lastNoteAt).getTime() - new Date(a.lastNoteAt).getTime()
        );
    }, [notes, ratingRows]);

    // displays first folder by default
    useEffect(() => {
        if (selectedVideoId === null && videoFolders.length > 0) {
            setSelectedVideoId(videoFolders[0].id);
        }
    }, [videoFolders, selectedVideoId]);

    const startEdit = (note: NoteItem) => {
        setEditingId(note.id);
        setEditingText(note.content);
        setEditingIsPrivate(note.is_private); // Sync privacy state on edit
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
                .update({
                    content: trimmed,
                    is_private: editingIsPrivate // Save privacy change
                })
                .eq('id', noteId);

            if (updateError) throw updateError;

            setNotes((prev) =>
                prev.map((note) =>
                    note.id === noteId
                        ? { ...note, content: trimmed, is_private: editingIsPrivate }
                        : note
                )
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

    const cancelEdit = () => {
        setEditingId(null);
        setEditingText('');
    };

    const handleDelete = async (noteId: string) => {
        // window appears if you want to delete
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

    // map to the time of the note
    const openVideoAtTimestamp = (note: NoteItem) => {
        const video = getVideoData(note.video);
        if (!video?.youtube_video_id) return;

        const seconds = note.timestamp_seconds ? Math.floor(note.timestamp_seconds) : 0;
        const url = `https://www.youtube.com/watch?v=${video.youtube_video_id}${seconds ? `&t=${seconds}s` : ''}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    /* SEARCH */
    // looks for notes within the video folder
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

    // only notes for a video - for key words generator 
    const notesForSelectedVideo = useMemo(
        () => notes.filter((note) => note.video_id === selectedVideoId),
        [notes, selectedVideoId]
    );

    const selectedVideo = selectedVideoId
        ? videoFolders.find((video) => video.id === selectedVideoId) || null
        : null;

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
                                        {/* max 5 pencils */}
                                        {'✏️'.repeat(Math.max(0, Math.min(5, Math.floor(ratingsByVideoId[selectedVideo.id]))))}
                                    </span>
                                </>
                            )}
                        </p>

                        <KeyTopicsPanel
                            videoId={selectedVideo.id}
                            notes={notesForSelectedVideo}
                        />
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
                            {filteredNotes.map((note) => (
                                <NoteCard
                                    key={note.id}
                                    note={{
                                        id: note.id,
                                        content: note.content,
                                        created_at: note.created_at,
                                        timestamp_seconds: note.timestamp_seconds,
                                        isPrivate: note.is_private,
                                        profileId: note.profile_id,
                                    }}
                                    currentUserId={userId || ''}
                                    isEditing={editingId === note.id}
                                    editingText={editingText}
                                    editingIsPrivate={editingIsPrivate}
                                    editingError={null}
                                    isSaving={savingId === note.id}
                                    isDeleting={deletingId === note.id}
                                    onOpen={() => openVideoAtTimestamp(note)}
                                    onStartEdit={() => startEdit(note)}
                                    onCancelEdit={cancelEdit}
                                    onSaveEdit={() => saveEdit(note.id)}
                                    onEditingTextChange={setEditingText}
                                    onEditingPrivacyChange={setEditingIsPrivate}
                                    onDelete={() => handleDelete(note.id)}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
