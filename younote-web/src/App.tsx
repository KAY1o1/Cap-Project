import { useState } from 'react'
import NavBar from './components/NavBar'
import HomePage from './pages/HomePage'
import Notes from './pages/Notes'


function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'notes'>('home')

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
    <NavBar setPage={setCurrentPage} currentPage={currentPage}/>
    <main className='main-content'>
      {Page()}
    </main>
    </>
  
  )
}

export default App
