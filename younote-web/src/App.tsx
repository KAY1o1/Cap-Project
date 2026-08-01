import { useState, useEffect } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './lib/supabase'
import NavBar from './components/NavBar'
import HomePage from './pages/HomePage'
import Notes from './pages/Notes'

function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'notes'>('home')
  const [session, setSession] = useState<Session | null>(null)
  



  useEffect(() => {
  const syncSessionFromUrl = async () => {
    // 1. Parse the URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get('access_token');
    const refreshToken = urlParams.get('refresh_token');

    if (accessToken && refreshToken) {
      // 2. Manually inject the extension's tokens into the website's Supabase instance
      await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      });

      // 3. Clean up the URL so the ugly tokens don't sit in the address bar
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  // Run the URL sync check first
  syncSessionFromUrl().then(() => {
    // 4. Fallback to normal session tracking once checked
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
        return <HomePage />
      case 'notes':
        return <Notes />
      default:
        return <HomePage />
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

