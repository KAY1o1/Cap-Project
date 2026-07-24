// import React, {useState} from 'react';
import '../styles/NavBar.css';
import logoImg from '../assets/images/YouNote.png'

interface NavBarP{
   setPage: (pageName: string) => void;
   currentPage: string;
}

const NavBar = ({setPage, currentPage}: NavBarP) => {
   return(
     <nav className="navbar-container">
         <div className="logo-section" onClick={() => setPage('home')}>
            <img src={logoImg} alt="YouNoteLogo" className='logo-image' />
         </div>
         <div className="nav-buttons">
            <button onClick={() => setPage('home')} disabled={currentPage === 'home'}>
               Home
            </button>
            <button onClick={() => setPage('notes')} disabled={currentPage === 'notes'}>
               Notes
            </button>
         </div>
    </nav>

   );


}

export default NavBar;