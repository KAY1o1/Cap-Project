import { useState } from "react";
import "./App.css";
import { login, logout, useSession } from "../../lib/auth"; // Google OAuth
import { supabase } from "../../lib/supabase"; 

function App() {
  const [count, setCount] = useState(0);
  const email = useSession(); // Google OAuth


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


      <button onClick={handleViewAllNotes}>View All Notes</button>

      {/* Google OAuth: sign out */}
      <p style={{ textAlign: "center", fontSize: "12px", marginTop: "8px" }}>
        Signed in as {email}{" "}
        <a onClick={logout} style={{ color: "#1a73e8", cursor: "pointer" }}>
          Sign out
        </a>
      </p>
    </div>
  );
}

export default App;
