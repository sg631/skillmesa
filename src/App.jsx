import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

import HomePage from './pages/HomePage';
import StartingPage from './pages/StartingPage';
import NotFoundPage from './pages/NotFoundPage';
import ComingSoonPage from './pages/ComingSoonPage';
import SignonPage from './pages/SignonPage';

import { LinkButton } from './components/LinkElements';
import { LinkImage } from './components/LinkElements';
import PageTransition from './components/PageTransition';
//Import firebase using firebase.js
import {auth, db} from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';

function App() {
  // Check if user is logged in
  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("User is signed in:", user);
        // Fetch user data from Firestore: todo
        // Log if firebase is active
        console.log("Firebase is active:", !!auth && !!db);
      } else {
        console.log("No user is signed in.");
      }
    }
    );
    return () => unsubscribe();
  }, []);
  return (
    <Router>
      <div>
        <nav>
          {/* Menu Button, left aligned stuff, opens sidebar menu */}
          {/* Logo, right aligned stuff */}
          <LinkImage to="/" src="/assets/logos/skillmesa.svg" width={100} height={100}alt="Skillmesa Logo" />
          <Link to="/home">home</Link>
          <Link to="/comingsoon">dashboard</Link>
          <Link to="/comingsoon">explore</Link>
          <Link to="/comingsoon">opportunities</Link>
          {/* User Profile Icon */}
          <LinkImage to="/profile" src="/assets/icons/account1.svg" width={40} height={40} alt="User Profile" />
          {/* Notifications Icon */}
          <LinkImage to="/notifications" src="/assets/icons/notifications.svg" width={30} height={30} alt="Notifications" />
          {/* Settings Icon */}
          <LinkImage to="/settings" src="/assets/icons/settings.svg" width={30} height={30} alt="Settings" />
        </nav>
        <div className="blobs">
          <div className="blob"></div>
          <div className="blob"></div>
          <div className="blob"></div>
          <div className="blob"></div>
          <div className="blob"></div>
          <div className="blob"></div>
        </div>
        <div className="content">
          <PageTransition>
            <Routes>
              <Route path="*" element={<NotFoundPage />} />
              <Route path="/" element={<StartingPage />} />
              <Route path="/signon" element={<SignonPage />} />
              <Route path="/comingsoon" element={<ComingSoonPage />} />
              <Route path="/home" element={<HomePage />} />
            </Routes>
          </PageTransition>
        </div>
      </div>
    </Router>
  );
}

export default App;