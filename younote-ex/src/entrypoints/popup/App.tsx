import { useState } from "react";
import "./style.css";
import { login, logout, useSession } from "../../lib/auth"; // Google OAuth
import { supabase } from "../../lib/supabase"; 

const numVideos = 12;
const numNotes = 50;

function App() {
  const email = useSession(); // Google OAuth
  const [enabled, setEnabled] = useState(true);

  const handleViewAllNotesClick = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    let targetUrl = "http://localhost:5173"; 

    // If a session exists, attach the tokens to the end of the URL
    if (session) {
      targetUrl += `?access_token=${session.access_token}&refresh_token=${session.refresh_token}`;
    }

    // Open the new tab
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ url: targetUrl });
    } else {
      window.open(targetUrl, '_blank');
    }
  };

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
      <h1 className="title">YouNote</h1>

      <button
        className="toggle-row"
        onClick={() => setEnabled((prev) => !prev)}
        aria-pressed={enabled}
      >
        <span className={`toggle-dot ${enabled ? "toggle-dot--on" : ""}`} />
        <span className="toggle-label">
          {enabled ? "Extension On" : "Extension Off"}
        </span>
      </button>

      {enabled && (
        <>
          <div className="stats-card">
            <div className="stat">
              <span className="stat-number">{numVideos}</span>
              <span className="stat-label">Videos Noted</span>
            </div>
            <div className="stat">
              <span className="stat-number">{numNotes}</span>
              <span className="stat-label">Notes Saved</span>
            </div>
          </div>

          {/* 👇 3. Replace the <a> tag with this button to trigger our new function */}
          <button
            onClick={handleViewAllNotesClick}
            className="see-all-btn"
          >
            See All Notes
          </button>

          <div className="links">
            <a href="#" className="link">
              Bugs?
            </a>
            <a href="#" className="link">
              FAQ
            </a>
          </div>
        </>
      )}

      {/* Google OAuth: sign out */}
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