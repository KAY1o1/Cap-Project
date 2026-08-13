import '../styles/VideoSidebar.css';
import { Images } from '../assets/images';

export type VideoFolder = {
    id: string;
    title: string;
    creator?: string;
    youtube_video_id: string;
    noteCount: number;
    lastNoteAt: string;
};

type VideoSidebarP = {
    videos: VideoFolder[];
    selectedVideoId: string | null;
    onSelect: (videoId: string | null) => void;
};

// iso to "Jan 1"
const formatDate = (isoString: string | undefined) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const getThumb = (youtubeId: string | undefined) => {
    return youtubeId
        ? `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`
        : Images.placeholder;
};

export default function VideoSidebar({ videos, selectedVideoId, onSelect }: VideoSidebarP) {
    return (
        <aside className="video-sidebar">
            <div className="recent-list">
                <h3>Videos</h3>

                {/* no notes */}
                {videos.length === 0 && (
                    <p className="sidebar-empty">No videos yet</p>
                )}

                {/* renders each vid in list */}
                {videos.map((video) => (
                    <div
                        key={video.id}
                        className={`recent ${selectedVideoId === video.id ? 'recent-active' : ''}`}
                        onClick={() => onSelect(video.id)}
                    >
                        {/*  */}
                        <img
                            className="recent-thumbnail"
                            src={getThumb(video.youtube_video_id)}
                            alt="thumbnail"
                        />

                        {/* meta */}
                        <div className="recent-content">
                            <span className="recent-title">{video.title}</span>
                            <p className="recent-channel">{video.creator || 'Creator'}</p>

                            <div className="recent-meta">
                                <span>{formatDate(video.lastNoteAt)}</span>
                                <span>•</span>
                                <span>
                                    {video.noteCount} {video.noteCount === 1 ? 'note' : 'notes'}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </aside>
    );
}