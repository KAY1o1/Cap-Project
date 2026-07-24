import { useState } from "react";
<<<<<<< HEAD
import "./style.css";
import { login, logout, useSession } from "../../lib/auth"; // Google OAuth

const numVideos = 12;
const numNotes = 50;

function App() {
  const email = useSession(); // Google OAuth
  const [enabled, setEnabled] = useState(true);
=======
import "./App.css";
import { login, logout, useSession } from "../../lib/auth"; // Google OAuth

function App() {
  const [count, setCount] = useState(0);
  const email = useSession(); // Google OAuth
>>>>>>> b7a9142ba4a1d64af5c5d1e20ca81933e16684cb

  // Google OAuth: show login when signed out
  if (!email) {
    return (
      <div className="popup">
<<<<<<< HEAD
        <h1 className="title">YouNote</h1>
        <p className="signin-copy">Sign in to use YouNote.</p>
        <button className="signin-btn" onClick={login}>
          Sign in with Google
        </button>
=======
        <h1>YouNote</h1>
        <hr></hr>
        <p style={{ textAlign: "center", fontSize: "13px" }}>
          Sign in to use YouNote.
        </p>
        <button onClick={login}>Sign in with Google</button>
>>>>>>> b7a9142ba4a1d64af5c5d1e20ca81933e16684cb
      </div>
    );
  }

  return (
    <div className="popup">
<<<<<<< HEAD
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

          <a
            target="_blank"
            rel="noreferrer"
            className="see-all-btn"
          >
            See All Notes
          </a>

          <div className="links">
            <a href="#" className="link">Bugs?</a>
            <a href="#" className="link">FAQ</a>
          </div>
        </>
      )}

      {/* Google OAuth: sign out */}
      <p className="signin-copy">
        Signed in as {email}{" "}
        <br></br>
        <a onClick={logout} className="signout-link">
=======
      <h1>YouNote</h1>

      <hr></hr>

      <hr></hr>

      <div className="settings">
        <label className="setting">
          <span>Extension Enabled</span>
          <input type="checkbox" />
        </label>

        <label className="setting">
          <span>Auto-save</span>
          <input type="checkbox" />
        </label>

        <label className="setting">
          <span>Show timestamps</span>
          <input type="checkbox" />
        </label>
      </div>

      <hr></hr>

      <button>View All Notes</button>

      {/* Google OAuth: sign out */}
      <p style={{ textAlign: "center", fontSize: "12px", marginTop: "8px" }}>
        Signed in as {email}{" "}
        <a onClick={logout} style={{ color: "#1a73e8", cursor: "pointer" }}>
>>>>>>> b7a9142ba4a1d64af5c5d1e20ca81933e16684cb
          Sign out
        </a>
      </p>
    </div>
  );
}

export default App;
