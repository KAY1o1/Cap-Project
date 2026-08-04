import { useState } from "react";
import "./App.css";
import { login, logout, useSession } from "../../lib/auth"; // Google OAuth
import { supabase } from "../../lib/supabase"; 

const numVideos = 12;
const numNotes = 50;

function App() {
  const [count, setCount] = useState(0);
  const email = useSession(); // Google OAuth
  const [enabled, setEnabled] = useState(true);


  const handleViewAllNotes = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (session) {
    // Grab the tokens from the extension's active session
    const accessToken = session.access_token;
    const refreshToken = session.refresh_token;
    
    // Build the URL pointing to your website with tokens attached
    const websiteUrl = `http://localhost:5173/?access_token=${accessToken}&refresh_token=${refreshToken}`;
    
    // Open the website tab
    chrome.tabs.create({ url: websiteUrl });
  } else {
    alert("Please log in to the extension first!");
  }
};


  // Google OAuth: show login when signed out
  if (!email) {
    return (
      <div className="popup">
        <h1>YouNote</h1>
        <hr></hr>
        <p style={{ textAlign: "center", fontSize: "13px" }}>
          Sign in to use YouNote.
        </p>
        <button onClick={login}>Sign in with Google</button>
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

          {/* Links to Website */}
          <a
            href="/notes.html"
            target="_blank"
            rel="noreferrer"
            className="see-all-btn"
          >
            See All Notes
          </a>

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
