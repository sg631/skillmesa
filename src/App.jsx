import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';

import HomePage from './pages/HomePage';
import StartingPage from './pages/StartingPage';
import NotFoundPage from './pages/NotFoundPage';
import ComingSoonPage from './pages/ComingSoonPage';
import SignonPage from './pages/SignonPage';
import ProfilePage from './pages/ProfilePage';
import CreateListingPage from './pages/CreateListingPage';

import { LinkButton } from './components/LinkElements';
import { LinkImage } from './components/LinkElements';
import PageTransition from './components/PageTransition';
//Import firebase using firebase.js
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';
import { auth } from "./firebase.js";


function App() {
  const [user, setUser] = React.useState(undefined);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
    });
    return unsubscribe;
  }, []);

  if (user === undefined) {
    return <p>Loading...</p>;
  }

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
          { user ? ( <LinkImage to="/profile" src={user.photoURL} width={40} height={40} alt="User Profile" classes="navbutton-profile navbutton-profile-loggedin" /> ) : ( <LinkImage to="/signon" src="/assets/icons/account2.svg" width={40} height={40} alt="Sign In" className="navbutton-profile navbutton-profile-loggedout" /> )}
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
              <Route path="/profile/:userUIDparam" element={<ProfilePage />} />
              <Route path="/notifications" element={<ComingSoonPage />} />
              <Route path="/settings" element={<ComingSoonPage />} />
              <Route path="/create" element={ user ? (<CreateListingPage />) : (<Navigate to="/signon" />)} />
              <Route path="/profile" element={ user ? (<Navigate to={"/profile/" + user.uid} />) : (<Navigate to="/signon" />)} />
            </Routes>
          </PageTransition>
        </div>
      </div>
    </Router>
  );
}

export default App;