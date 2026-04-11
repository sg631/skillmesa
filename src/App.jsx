import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { Group, Text, Anchor, Box, Avatar, ActionIcon, Indicator, useMantineColorScheme, useComputedColorScheme, Drawer, Burger, Stack, Divider } from '@mantine/core';

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
import NotificationsPage from './pages/NotificationsPage.jsx';
import ChatPage from './pages/ChatPage.jsx';
import InboxPage from './pages/InboxPage.jsx';
import AliasRedirectPage from './pages/AliasRedirectPage.jsx';
import GroupsPage from './pages/GroupsPage.jsx';
import GroupPage from './pages/GroupPage.jsx';
import GroupManagePage from './pages/GroupManagePage.jsx';
import CreateGroupPage from './pages/CreateGroupPage.jsx';
import OnboardingPage from './pages/OnboardingPage.jsx';

import { LinkImage } from './components/LinkElements';
import PageTransition from './components/PageTransition';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';
import { auth, db } from "./firebase.js";
import { Bell, Settings, UserCircle, Sun, Moon } from 'lucide-react';

function App() {
  const [user, setUser] = React.useState(undefined);
  const [profilePicUrl, setProfilePicUrl] = React.useState(null);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme('light');
  const isDark = computedColorScheme === 'dark';

  React.useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
      if (!u) setProfilePicUrl(null);
    });
    return unsubAuth;
  }, []);

  // Keep navbar avatar in sync with Firestore profile picture
  React.useEffect(() => {
    if (!user?.uid) return;
    const unsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      setProfilePicUrl(snap.exists() ? (snap.data().profilePic?.currentUrl || null) : null);
    });
    return () => unsub();
  }, [user?.uid]);

  // Track unread notifications count
  React.useEffect(() => {
    if (!user) { setUnreadCount(0); return; }

    const q = query(
      collection(db, "notifications", user.uid, "items"),
      where("read", "==", false)
    );
    const unsub = onSnapshot(q, (snap) => setUnreadCount(snap.size), () => {});
    return () => unsub();
  }, [user]);

  const toggleColorScheme = () => {
    setColorScheme(isDark ? 'light' : 'dark');
  };

  const navBg     = isDark ? 'var(--mantine-color-dark-7)' : '#ffffff';
  const navBorder = isDark ? 'var(--mantine-color-dark-5)' : 'var(--mantine-color-gray-2)';
  const pageBg    = isDark ? 'var(--mantine-color-dark-8)' : 'var(--mantine-color-gray-0)';
  const footerBg  = isDark ? 'var(--mantine-color-dark-7)' : '#ffffff';

  return (
    <Router>
      <Box style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: pageBg }}>

        {/* Navigation */}
        <Box
          component="nav"
          style={{
            width: '100%',
            height: 60,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingInline: '1.5rem',
            position: 'sticky',
            top: 0,
            background: navBg,
            borderBottom: `1px solid ${navBorder}`,
            zIndex: 100,
          }}
        >
          <LinkImage to="/" src="/assets/logos/skillmesa.svg" width={80} height={80} alt="Skillmesa Logo" />

          {/* Desktop nav links */}
          <Group gap="xs" align="center" visibleFrom="sm">
            <Anchor component={Link} to="/home" fw={500} underline="never" c="inherit" size="sm" className="nav-link">Dashboard</Anchor>
            <Anchor component={Link} to="/explore" fw={500} underline="never" c="inherit" size="sm" className="nav-link">Explore</Anchor>
            <Anchor component={Link} to="/inbox" fw={500} underline="never" c="inherit" size="sm" className="nav-link">Inbox</Anchor>
            <Anchor component={Link} to="/groups" fw={500} underline="never" c="inherit" size="sm" className="nav-link">Groups</Anchor>
          </Group>

          <Group gap={4} align="center">
            {/* Profile — desktop only */}
            <Box visibleFrom="sm">
              {user ? (
                <Link to="/profile">
                  <Avatar src={profilePicUrl} size={32} radius="xl" />
                </Link>
              ) : (
                <ActionIcon component={Link} to="/signon" variant="subtle" color="gray" size="lg" aria-label="Sign In">
                  <UserCircle size={20} />
                </ActionIcon>
              )}
            </Box>

            {/* Bell — always visible */}
            <Indicator color="red" size={8} offset={4} disabled={unreadCount === 0} processing={unreadCount > 0}>
              <ActionIcon component={Link} to="/notifications" variant="subtle" color="gray" size="lg" aria-label="Notifications">
                <Bell size={18} />
              </ActionIcon>
            </Indicator>

            {/* Settings — desktop only */}
            <Box visibleFrom="sm">
              <ActionIcon component={Link} to="/settings" variant="subtle" color="gray" size="lg" aria-label="Settings">
                <Settings size={18} />
              </ActionIcon>
            </Box>

            {/* Dark mode — always visible */}
            <ActionIcon variant="subtle" color="gray" onClick={toggleColorScheme} size="lg" aria-label="Toggle dark mode">
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </ActionIcon>

            {/* Hamburger — mobile only */}
            <Box hiddenFrom="sm">
              <Burger opened={menuOpen} onClick={() => setMenuOpen(o => !o)} size="sm" aria-label="Open menu" />
            </Box>
          </Group>

          {/* Mobile drawer */}
          <Drawer
            opened={menuOpen}
            onClose={() => setMenuOpen(false)}
            title="Menu"
            position="right"
            size="xs"
            styles={{ body: { paddingTop: 8 } }}
          >
            <Stack gap="sm">
              {user ? (
                <Group
                  component={Link} to="/profile"
                  onClick={() => setMenuOpen(false)}
                  gap="sm"
                  style={{ textDecoration: 'none', color: 'inherit', padding: '4px 0' }}
                >
                  <Avatar src={profilePicUrl} size={40} radius="xl" />
                  <Box>
                    <Text fw={600} size="sm">{user.displayName || 'Profile'}</Text>
                    <Text size="xs" c="dimmed">{user.email}</Text>
                  </Box>
                </Group>
              ) : (
                <ActionIcon
                  component={Link} to="/signon"
                  onClick={() => setMenuOpen(false)}
                  variant="default" size="lg" w="100%" aria-label="Sign In"
                  style={{ justifyContent: 'flex-start', paddingLeft: 12, gap: 8, height: 40 }}
                >
                  <UserCircle size={18} />
                  <Text size="sm" fw={500}>Sign in</Text>
                </ActionIcon>
              )}

              <Divider />

              <Stack gap={2}>
                {[
                  { to: '/home',    label: 'Dashboard' },
                  { to: '/explore', label: 'Explore' },
                  { to: '/inbox',   label: 'Inbox' },
                  { to: '/groups',  label: 'Groups' },
                ].map(({ to, label }) => (
                  <Anchor
                    key={label}
                    component={Link} to={to}
                    onClick={() => setMenuOpen(false)}
                    underline="never" c="inherit" fw={500} size="sm"
                    style={{ padding: '9px 8px', display: 'block', borderRadius: 6 }}
                    className="nav-link"
                  >
                    {label}
                  </Anchor>
                ))}
              </Stack>

              <Divider />

              <Stack gap={2}>
                <Anchor component={Link} to="/notifications" onClick={() => setMenuOpen(false)} underline="never" c="inherit" fw={500} size="sm" style={{ padding: '9px 8px', display: 'block', borderRadius: 6 }} className="nav-link">
                  Notifications
                </Anchor>
                <Anchor component={Link} to="/settings" onClick={() => setMenuOpen(false)} underline="never" c="inherit" fw={500} size="sm" style={{ padding: '9px 8px', display: 'block', borderRadius: 6 }} className="nav-link">
                  Settings
                </Anchor>
              </Stack>
            </Stack>
          </Drawer>
        </Box>

        {/* Main content */}
        <Box style={{ flex: 1 }}>
          <PageTransition>
            {user === undefined ? (
              <Text ta="center" size="sm" c="dimmed" py="xl">Loading…</Text>
            ) : (
              <Routes>
                <Route path="*" element={<NotFoundPage />} />
                <Route path="/" element={<StartingPage />} />
                <Route path="/signon" element={<SignonPage />} />
                <Route path="/onboarding" element={<OnboardingPage />} />
                <Route path="/comingsoon" element={<ComingSoonPage />} />
                <Route path="/home" element={<HomePage />} />
                <Route path="/profile/:userUIDparam" element={<ProfilePage />} />
                <Route path="/notifications" element={user ? <NotificationsPage /> : <Navigate to="/signon" />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/explore" element={<ExplorePage />} />
                <Route path="/create" element={user ? <CreateListingPage /> : <Navigate to="/signon" />} />
                <Route path="/listing/:listingId" element={<ListingDetailPage />} />
                <Route path="/contact/:userUIDparam" element={<ContactPage />} />
                <Route path="/share/:listingId" element={<OpenSharedLinkPage />} />
                <Route path="/s/:alias" element={<AliasRedirectPage />} />
                <Route path="/manage/:listingId" element={<ManagePage />} />
                <Route path="/chat/:otherUID" element={user ? <ChatPage /> : <Navigate to="/signon" />} />
                <Route path="/inbox" element={user ? <InboxPage /> : <Navigate to="/signon" />} />
                <Route path="/inbox/:chatId" element={user ? <InboxPage /> : <Navigate to="/signon" />} />
                <Route path="/groups" element={user ? <GroupsPage /> : <Navigate to="/signon" />} />
                <Route path="/groups/create" element={user ? <CreateGroupPage /> : <Navigate to="/signon" />} />
                <Route path="/groups/:groupId" element={user ? <GroupPage /> : <Navigate to="/signon" />} />
                <Route path="/groups/:groupId/manage" element={user ? <GroupManagePage /> : <Navigate to="/signon" />} />
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
            height: 52,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            background: footerBg,
            borderTop: `1px solid ${navBorder}`,
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
