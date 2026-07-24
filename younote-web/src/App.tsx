import { useState } from 'react'
import NavBar from './components/NavBar'
import HomePage from './pages/HomePage'
import Notes from './pages/Notes'


function App() {
  const [currentPage, setCurrentPage] = useState('home')

  return (
    <>
    <NavBar setPage={setCurrentPage} currentPage={currentPage}/>
    <main className='main-content'>
      {currentPage === 'home' ? <HomePage/> : <Notes/>}
    </main>
    </>
  
  )
}

export default App
