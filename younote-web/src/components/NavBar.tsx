// import React, {useState} from 'react';
import '../styles/NavBar.css';
import logoImg from '../assets/images/YouNote.png'
import type { Session } from '@supabase/supabase-js';

interface NavBarP {
   setPage: (pageName: 'home' | 'notes' ) => void;
   currentPage: 'home' | 'notes' ;
   UserUrl?: string;
   session: Session |null;
}

const NavBar = ({ setPage, currentPage, UserUrl, session }: NavBarP) => {
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
            </div>

            <div className="profile">
               {UserUrl ? (
                  <img src={UserUrl} alt="User Profile" className='profile-image' />
               ) : (
                  <div className="defualt-profile" title={session?.user?.email}>
                     ( •̀ ω •́ )✧
                  </div>
               )}
            </div>

         </div>

      </nav>

   );


}

export default NavBar;