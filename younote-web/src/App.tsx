import { useState, useEffect } from 'react'
import type { Session } from '@supabase/supabase-js'
import {supabase} from './lib/supabase'
import NavBar from './components/NavBar'
import HomePage from './pages/HomePage'
import Notes from './pages/Notes'


function App() {
 const [currentPage, setCurrentPage] = useState<'home' | 'notes'>('home')
  const [session, setSession] = useState<Session | null>(null)
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const Page = () => {
    switch(currentPage){
      case 'home':
        return <HomePage/>
      case 'notes':
        return <Notes/>
      default:
        return <HomePage/>
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
