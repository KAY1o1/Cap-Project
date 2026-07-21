// import React, {useState} from 'react';
import '../styles/NavBar.css';
import logoImg from '../assets/images/YouNote.png'

interface NavBarP {
   setPage: (pageName: 'home' | 'notes' | 'friends') => void;
   currentPage: 'home' | 'notes' | 'friends';
   UserUrl?: string;
}

const NavBar = ({ setPage, currentPage, UserUrl }: NavBarP) => {
   return (
      <nav className="navbar-container">
         <div className="logo-section" onClick={() => setPage('home')}>
            <img src={logoImg} alt="YouNoteLogo" className='logo-image' />
         </div>
         <div className="set">
            <div className="nav-buttons">
               <button onClick={() => setPage('home')} disabled={currentPage === 'home'}>
                  Home
               </button>
               <button onClick={() => setPage('notes')} disabled={currentPage === 'notes'}>
                  Notes
               </button>
               <button onClick={() => setPage('friends')} disabled={currentPage === 'friends'}>
                  Friends
               </button>
            </div>

            <div className="profile">
               {UserUrl ? (
                  <img src={UserUrl} alt="User Profile" className='profile-image' />
               ) : (
                  <div className="defualt-profile">
                     ( •̀ ω •́ )✧
                  </div>
               )}
            </div>

         </div>

      </nav>

   );


}

export default NavBar;