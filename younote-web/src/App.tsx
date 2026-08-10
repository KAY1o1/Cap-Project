import { useState, useEffect } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import NavBar from './components/NavBar'
import HomePage from './pages/HomePage'
import Notes from './pages/NotesPage'
import './index.css';

function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'notes'>('home')
  const [session, setSession] = useState<Session | null>(null)

  // Listen for the auth token from the extension
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      // Security check: Make sure we only accept messages from our own window
      if (event.source !== window) return;

      if (event.data.type === "SYNC_SUPABASE_SESSION") {
        console.log("Received session from extension! Logging in...");
        
        const { access_token, refresh_token } = event.data.payload;

        // Force the website's Supabase client to log in using the extension's tokens
        const { error } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });

        if (error) {
          console.error("Failed to sync session:", error.message);
        } else {
          console.log("Successfully synced auth state!");
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  useEffect(() => {
  const syncSessionFromUrl = async () => {

    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get('access_token');
    const refreshToken = urlParams.get('refresh_token');

    if (accessToken && refreshToken) {
     
      await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      });

      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  
  syncSessionFromUrl().then(() => {
   
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
  });

  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    setSession(session);
  });

  return () => subscription.unsubscribe();
}, []);

 
  const Page = () => {
    switch(currentPage){
      case 'home':
        return <HomePage setPage={setCurrentPage}/>
      case 'notes':
        return <Notes />
      default:
        return <HomePage setPage={setCurrentPage}/>
    }
  }

  return (
    <>
      <NavBar setPage={setCurrentPage} currentPage={currentPage} session={session}/>
      <main className='main-content'>
        {Page()}
      </main>
    </>
  )
}

export default App
