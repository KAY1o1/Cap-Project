// import React, {useState} from 'react';
import '../styles/NavBar.css';
import logoImg from '../assets/images/YouNote.png'
import type { Session } from '@supabase/supabase-js';

interface NavBarP {
   setPage: (pageName: 'home' | 'notes' | 'explore' ) => void;
   currentPage: 'home' | 'notes' | 'explore' ;
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
               <button onClick={() => setPage('explore')} disabled={currentPage === 'explore'}>
                  Explore
               </button>
            </div>

            <div className="profile">
               {session && UserUrl && (
                   <img src={UserUrl} alt="Profile" className="avatar-img" style={{ width: 40, height: 40, borderRadius: '50%' }} />
               )}
            </div>

         </div>

      </nav>

   );


}

export default NavBar;