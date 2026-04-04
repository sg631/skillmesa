import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { Group, Text, Anchor, Box, Avatar, ActionIcon, useMantineColorScheme, useComputedColorScheme } from '@mantine/core';

import HomePage from './pages/HomePage';
import StartingPage from './pages/StartingPage';
import NotFoundPage from './pages/NotFoundPage';
import ComingSoonPage from './pages/ComingSoonPage';
import SignonPage from './pages/SignonPage';
import ProfilePage from './pages/ProfilePage';
import CreateListingPage from './pages/CreateListingPage';
import ContactPage from './pages/ContactPage';
import OpenSharedLinkPage from './pages/OpenSharedLinkPage';
import ManagePage from './pages/ManagePage';
import ExplorePage from './pages/ExplorePage.jsx';
import ListingDetailPage from './pages/ListingDetailPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';

import { LinkImage } from './components/LinkElements';
import PageTransition from './components/PageTransition';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from "./firebase.js";
import { Bell, Settings, UserCircle, Sun, Moon } from 'lucide-react';

import './styles/blobs.css';

function App() {
  const [user, setUser] = React.useState(undefined);
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme('light');
  const isDark = computedColorScheme === 'dark';

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
    });
    return unsubscribe;
  }, []);

  const toggleColorScheme = () => {
    setColorScheme(isDark ? 'light' : 'dark');
  };

  return (
    <Router>
      <Box
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          background: isDark ? 'var(--mantine-color-dark-7)' : '#dfffff',
          transition: 'background 0.3s',
        }}
      >
        {/* Navigation */}
        <Box
          component="nav"
          style={{
            width: '100%',
            height: 65,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '1.5rem',
            position: 'sticky',
            top: 0,
            left: 0,
            isolation: 'isolate',
            fontSize: '1.2em',
            background: isDark ? 'var(--mantine-color-dark-6)' : 'rgb(157, 247, 255)',
            boxShadow: isDark ? '0 0px 20px rgba(0, 196, 240, 0.15)' : '0 0px 20px rgb(157, 247, 255)',
            zIndex: 9999,
            transition: 'background 0.3s, box-shadow 0.3s',
          }}
        >
          <LinkImage to="/" src="/assets/logos/skillmesa.svg" width={90} height={90} alt="Skillmesa Logo" />
          <Anchor component={Link} to="/home" fw={500} underline="never" c={isDark ? 'cyan.2' : 'dark'}>
            dashboard
          </Anchor>
          <Anchor component={Link} to="/explore" fw={500} underline="never" c={isDark ? 'cyan.2' : 'dark'}>
            explore
          </Anchor>
          <Anchor component={Link} to="/comingsoon" fw={500} underline="never" c={isDark ? 'cyan.2' : 'dark'}>
            opportunities
          </Anchor>
          {user ? (
            <Link to="/profile">
              <Avatar
                src={user.photoURL}
                size={36}
                radius="xl"
                style={{
                  boxShadow: isDark
                    ? '0 0 8px rgba(0, 196, 240, 0.4)'
                    : '0 0 5px rgb(204, 221, 243)',
                }}
              />
            </Link>
          ) : (
            <ActionIcon component={Link} to="/signon" variant="subtle" color={isDark ? 'cyan' : 'dark'} size="lg" aria-label="Sign In">
              <UserCircle size={24} />
            </ActionIcon>
          )}
          <ActionIcon component={Link} to="/notifications" variant="subtle" color={isDark ? 'cyan' : 'dark'} size="lg" aria-label="Notifications">
            <Bell size={22} />
          </ActionIcon>
          <ActionIcon component={Link} to="/settings" variant="subtle" color={isDark ? 'cyan' : 'dark'} size="lg" aria-label="Settings">
            <Settings size={22} />
          </ActionIcon>

          {/* Dark mode toggle */}
          <ActionIcon
            variant="subtle"
            color={isDark ? 'cyan' : 'dark'}
            onClick={toggleColorScheme}
            size="lg"
            aria-label="Toggle dark mode"
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </ActionIcon>
        </Box>

        {/* Blob background */}
        <div className="blobs">
          <div className="blob"></div>
          <div className="blob"></div>
          <div className="blob"></div>
          <div className="blob"></div>
          <div className="blob"></div>
          <div className="blob"></div>
        </div>

        {/* Main content */}
        <Box style={{ flex: 1 }}>
          <PageTransition>
            {user === undefined ? (
              <Text ta="center" size="lg" py="xl">Loading.. Please check your internet if this takes too long.</Text>
            ) : (
              <Routes>
                <Route path="*" element={<NotFoundPage />} />
                <Route path="/" element={<StartingPage />} />
                <Route path="/signon" element={<SignonPage />} />
                <Route path="/comingsoon" element={<ComingSoonPage />} />
                <Route path="/home" element={<HomePage />} />
                <Route path="/profile/:userUIDparam" element={<ProfilePage />} />
                <Route path="/notifications" element={<ComingSoonPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/explore" element={<ExplorePage />} />
                <Route
                  path="/create"
                  element={user ? <CreateListingPage /> : <Navigate to="/signon" />}
                />
                <Route path="/listing/:listingId" element={<ListingDetailPage />} />
                <Route path="/contact/:userUIDparam" element={<ContactPage />} />
                <Route path="/share/:listingId" element={<OpenSharedLinkPage />} />
                <Route path="/manage/:listingId" element={<ManagePage />} />
                <Route
                  path="/profile"
                  element={user ? <Navigate to={"/profile/" + user.uid} /> : <Navigate to="/signon" />}
                />
              </Routes>
            )}
          </PageTransition>
        </Box>

        {/* Footer */}
        <Box
          component="footer"
          style={{
            width: '100%',
            height: 60,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            background: isDark ? 'var(--mantine-color-dark-6)' : 'rgba(112, 238, 255, 0.1)',
            backdropFilter: 'blur(3px)',
            zIndex: 10,
            transition: 'background 0.3s',
          }}
        >
          <Text size="xs" c="dimmed">
            Skillmesa is currently in development. Stay tuned for updates!
          </Text>
        </Box>
      </Box>
    </Router>
  );
}

export default App;
