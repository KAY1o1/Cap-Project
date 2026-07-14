import { useState } from 'react'
import NavBar from './components/NavBar'
import HomePage from './pages/HomePage'
import Folder from './pages/Folder'


function App() {
  const [currentPage, setCurrentPage] = useState('home')

  return (
    <>
    <NavBar setPage={setCurrentPage} currentPage={currentPage}/>
    <main className='main-content'>
      {currentPage === 'home' ? <HomePage/> : <Folder/>}
    </main>
    </>
  
  )
}

export default App
