import { useEffect, useState } from "react";
import "./style.css";
import { login, logout, useSession } from "../../lib/auth"; // Google OAuth
import {
  getCurrentUserId,
  getUserStats,
  getRecentVideos,
  type UserStats,
  type RecentVideo,
} from "../../lib/notes";

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function App() {
  const email = useSession(); // Google OAuth
  const [enabled, setEnabled] = useState(true);

  const [stats, setStats] = useState<UserStats>({
    videosNoted: 0,
    notesSaved: 0,
  });
  const [recentVideos, setRecentVideos] = useState<RecentVideo[]>([]);

  useEffect(() => {
    if (!email) {
      setStats({ videosNoted: 0, notesSaved: 0 });
      setRecentVideos([]);
      return;
    }

    getCurrentUserId().then((userId) => {
      if (!userId) return;
      getUserStats(userId).then(setStats);
      getRecentVideos(userId).then(setRecentVideos);
    });
  }, [email]);

  // Google OAuth: show login when signed out
  if (!email) {
    return (
      <div className="popup">
        <h1 className="title">YouNote</h1>
        <p className="signin-copy">Sign in to use YouNote.</p>
        <button className="signin-btn" onClick={login}>
          Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <div className="popup">
      <h1>YouNote</h1>

      <div className="stat-card">
        <div className="stat">
          <span className="number">{stats.videosNoted}</span>
          <span className="label">Videos Noted</span>
        </div>
        <div className="stat">
          <span className="number">{stats.notesSaved}</span>
          <span className="label">Notes Saved</span>
        </div>
      </div>

      {recentVideos.length > 0 && (
        <div>
          <div className="recent-list">
            <h3>Recent</h3>
            {/* 2 videos */}
            {recentVideos.slice(0, 2).map((video) => (
              // links to video
              <a
                key={video.videoId}
                className="recent"
                href={`https://www.youtube.com/watch?v=${video.youtubeVideoId}`}
                target="_blank"
                rel="noreferrer"
              >
                <img
                  className="recent-thumbnail"
                  src={`https://img.youtube.com/vi/${video.youtubeVideoId}/mqdefault.jpg`}
                  alt={video.title}
                />

                <div className="recent-content">
                  <span className="recent-title">{video.title}</span>
                  <p className="recent-channel">{video.creator}</p>

                  <div className="recent-meta">
                    <span>{formatDate(video.lastNoteAt)}</span>
                    <span>•</span>
                    <span>
                      {video.noteCount} {video.noteCount === 1 ? "note" : "notes"}
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Links to Website */}
      <a
        href="/notes.html"
        target="_blank"
        rel="noreferrer"
        className="see-all-btn"
      >
        See All Notes
      </a>
      <p className="signin-copy">
        Signed in as {email} <br></br>
        <a onClick={logout} className="signout-link">
          Sign out
        </a>
      </p>
    </div>
  );
}

export default App;
