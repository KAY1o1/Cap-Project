import { useEffect, useState } from 'react';
import '../styles/NavBar.css';
import logoImg from '../assets/images/YouNote.png'
import {supabase} from '../lib/supabase'

interface NavBarP {
   setPage: (pageName: 'home' | 'notes' ) => void;
   currentPage: 'home' | 'notes' ;
   UserUrl?: string;
}

const NavBar = ({ setPage, currentPage, UserUrl }: NavBarP) => {
   const [userEmail, setUserEmail] = useState<string | null>(null);

   useEffect(() => {
      // 1. Check if they are already logged in on page load
      supabase.auth.getSession().then(({ data: { session } }) => {
         setUserEmail(session?.user?.email || null);
      });

      // 2. Listen for login/logout events (this catches the extension sync!)
      const {
         data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
         setUserEmail(session?.user?.email || null);
      });

      // Cleanup listener on unmount
      return () => subscription.unsubscribe();
   }, []);

   const logout = async () => {
      await supabase.auth.signOut();
   };

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

            {/* --- AUTHENTICATION & PROFILE SECTION --- */}
            <div className="auth-section" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
               
               {/* Login Text */}
               {userEmail ? (
                  <div className="signin-copy" style={{ textAlign: 'right', fontSize: '0.85rem' }}>
                     Signed in as <strong>{userEmail}</strong> <br/>
                     <a onClick={logout} className="signout-link" style={{ cursor: "pointer", textDecoration: "underline", color: "inherit" }}>
                        Sign out
                     </a>
                  </div>
               ) : (
                  <div className="signin-copy" style={{ fontSize: '0.85rem' }}>
                     Not signed in
                  </div>
               )}

               {/* Your existing profile picture logic */}
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
         </div>
      </nav>
   );
}

export default NavBar;