import { useState } from 'react'
import NavBar from './components/NavBar'
import HomePage from './pages/HomePage'
import Notes from './pages/Notes'
<<<<<<< HEAD
// import Friends from './pages/FriendsList'


function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'notes' | 'friends'>('home')

  const Page = () => {
    switch(currentPage){
      case 'home':
        return <HomePage/>
      case 'notes':
        return <Notes/>
      // case 'friends':
      //   return <Friends/>
      default:
        return <HomePage/>
    }
  }
=======


function App() {
  const [currentPage, setCurrentPage] = useState('home')
>>>>>>> b7a9142ba4a1d64af5c5d1e20ca81933e16684cb

  return (
    <>
    <NavBar setPage={setCurrentPage} currentPage={currentPage}/>
    <main className='main-content'>
<<<<<<< HEAD
      {Page()}
=======
      {currentPage === 'home' ? <HomePage/> : <Notes/>}
>>>>>>> b7a9142ba4a1d64af5c5d1e20ca81933e16684cb
    </main>
    </>
  
  )
}

export default App
