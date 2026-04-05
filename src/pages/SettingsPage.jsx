import React from 'react';
import {
  Title, Text, TextInput, Textarea, PasswordInput, Button, Stack,
  Paper, Divider, Group, Avatar, Box, Loader, Grid,
  useMantineColorScheme, useComputedColorScheme, Center, SegmentedControl,
  UnstyledButton, Switch,
} from '@mantine/core';
import { Sun, Moon, Upload, Palette, User, Image, Lock, Shield } from 'lucide-react';
import { onAuthStateChanged, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../firebase';
import showAlert from '../components/ShowAlert';

const SECTIONS = [
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'profile',    label: 'Profile',    icon: User },
  { id: 'picture',    label: 'Picture',    icon: Image },
  { id: 'security',   label: 'Security',   icon: Lock },
  { id: 'privacy',    label: 'Privacy',    icon: Shield },
];

function scrollToSection(id) {
  const el = document.getElementById(id);
  if (!el) return;
  // Offset for sticky nav (60px) + a little breathing room
  const top = el.getBoundingClientRect().top + window.scrollY - 80;
  window.scrollTo({ top, behavior: 'smooth' });
}

function SettingsPage() {
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme('light');
  const isDark = computedColorScheme === 'dark';

  const [user, setUser]                     = React.useState(null);
  const [loading, setLoading]               = React.useState(true);
  const [saving, setSaving]                 = React.useState(false);
  const [pwSaving, setPwSaving]             = React.useState(false);
  const [picUploading, setPicUploading]     = React.useState(false);
  const [activeSection, setActiveSection]   = React.useState('appearance');

  // Profile fields
  const [displayName, setDisplayName]       = React.useState('');
  const [username, setUsername]             = React.useState('');
  const [bio, setBio]                       = React.useState('');
  const [email, setEmail]                   = React.useState('');
  const [phone, setPhone]                   = React.useState('');
  const [birthday, setBirthday]             = React.useState('');
  const [profilePicUrl, setProfilePicUrl]   = React.useState('');

  // Password fields
  const [currentPw, setCurrentPw]           = React.useState('');
  const [newPw, setNewPw]                   = React.useState('');
  const [confirmPw, setConfirmPw]           = React.useState('');

  // Privacy fields
  const [profileVisibility, setProfileVisibility]   = React.useState('public');
  const [allowDirectMessages, setAllowDirectMessages] = React.useState('everyone');
  const [showContactInfo, setShowContactInfo]       = React.useState('everyone');
  const [privacySaving, setPrivacySaving]           = React.useState(false);

  const picInputRef = React.useRef(null);

  // IntersectionObserver — highlight sidebar item matching the section most in view
  React.useEffect(() => {
    const observers = [];
    const visible = {};

    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          visible[id] = entry.intersectionRatio;
          // Pick the section with the highest ratio
          const best = Object.entries(visible).sort((a, b) => b[1] - a[1])[0];
          if (best) setActiveSection(best[0]);
        },
        { threshold: [0, 0.25, 0.5, 0.75, 1], rootMargin: '-80px 0px -40% 0px' }
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach(o => o.disconnect());
  }, [loading]); // re-run after content mounts

  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const snap = await getDoc(doc(db, 'users', u.uid));
          if (snap.exists()) {
            const d = snap.data();
            setDisplayName(d.displayName || '');
            setUsername(d.username || '');
            setBio(d.bio || '');
            setEmail(d.contact?.email || '');
            setPhone(d.contact?.phone || '');
            setBirthday(d.birthday || '');
            setProfilePicUrl(d.profilePic?.currentUrl || '');
            setProfileVisibility(d.privacy?.profileVisibility || 'public');
            setAllowDirectMessages(d.privacy?.allowDirectMessages || 'everyone');
            setShowContactInfo(d.privacy?.showContactInfo || 'everyone');
          }
        } catch (err) {
          console.error('Failed to load settings:', err);
        }
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  async function handleSaveProfile() {
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        displayName, username, bio,
        'contact.email': email,
        'contact.phone': phone,
        birthday,
      });
      showAlert('Profile saved!');
    } catch (err) {
      console.error(err);
      showAlert('Failed to save profile.');
    } finally {
      setSaving(false);
    }
  }

  async function handlePicUpload(file) {
    if (!file || !user) return;
    setPicUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const storageRef = ref(storage, `users/${user.uid}/profilePic.${ext}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await updateDoc(doc(db, 'users', user.uid), { 'profilePic.currentUrl': url });
      setProfilePicUrl(url);
      showAlert('Profile picture updated!');
    } catch (err) {
      console.error(err);
      showAlert('Failed to upload picture.');
    } finally {
      setPicUploading(false);
    }
  }

  async function handlePasswordChange() {
    if (!user) return;
    if (!currentPw || !newPw || !confirmPw) { showAlert('Please fill in all password fields.'); return; }
    if (newPw !== confirmPw) { showAlert('New passwords do not match.'); return; }
    if (newPw.length < 6) { showAlert('Password must be at least 6 characters.'); return; }
    setPwSaving(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPw);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPw);
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      showAlert('Password changed successfully!');
    } catch (err) {
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        showAlert('Current password is incorrect.');
      } else {
        showAlert('Failed to change password. Try signing out and back in first.');
      }
    } finally {
      setPwSaving(false);
    }
  }

  async function handleSavePrivacy() {
    if (!user) return;
    setPrivacySaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        privacy: { profileVisibility, allowDirectMessages, showContactInfo },
      });
      showAlert('Privacy settings saved!');
    } catch (err) {
      console.error(err);
      showAlert('Failed to save privacy settings.');
    } finally {
      setPrivacySaving(false);
    }
  }

  if (loading) {
    return (
      <Box py="xl" style={{ display: 'flex', justifyContent: 'center' }}>
        <Loader color="gray" size="sm" />
      </Box>
    );
  }

  if (!user) {
    return <Text ta="center" py="xl" c="dimmed">Sign in to manage your settings.</Text>;
  }

  const sidebarBg   = isDark ? 'var(--mantine-color-dark-7)' : 'var(--mantine-color-gray-0)';
  const activeBg    = isDark ? 'var(--mantine-color-dark-5)' : 'var(--mantine-color-gray-2)';
  const hoverBg     = isDark ? 'var(--mantine-color-dark-6)' : 'var(--mantine-color-gray-1)';
  const activeColor = isDark ? 'var(--accent-hex)' : 'inherit';

  return (
    <Box py="xl" px={{ base: 'md', sm: 'xl' }} maw={1000} mx="auto" className="page-enter">
      <title>settings | skillmesa</title>

      <Grid gutter="xl">

        {/* ── Sidebar nav ───────────────────────────── */}
        <Grid.Col span={{ base: 12, sm: 3 }}>
          <Box className="sticky-sidebar">
            <Text size="xs" fw={600} c="dimmed" tt="uppercase" mb="xs" style={{ letterSpacing: '0.06em' }}>
              Settings
            </Text>
            <Stack gap={2}>
              {SECTIONS.map(({ id, label, icon: Icon }) => {
                const isActive = activeSection === id;
                return (
                  <UnstyledButton
                    key={id}
                    onClick={() => scrollToSection(id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 12px',
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: isActive ? 600 : 400,
                      color: isActive ? activeColor : 'inherit',
                      background: isActive ? activeBg : 'transparent',
                      transition: 'background 0.15s ease, color 0.15s ease',
                      cursor: 'pointer',
                      width: '100%',
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = hoverBg; }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <Icon size={15} />
                    {label}
                  </UnstyledButton>
                );
              })}
            </Stack>
          </Box>
        </Grid.Col>

        {/* ── Content ───────────────────────────────── */}
        <Grid.Col span={{ base: 12, sm: 9 }}>
          <Stack gap="xl">

            {/* Appearance */}
            <Paper id="appearance" withBorder p="xl" radius="md">
              <Stack gap="md">
                <Title order={4}>Appearance</Title>
                <SegmentedControl
                  value={computedColorScheme}
                  onChange={setColorScheme}
                  fullWidth
                  data={[
                    { label: (<Center inline gap={6}><Sun size={15} /> Light</Center>), value: 'light' },
                    { label: (<Center inline gap={6}><Moon size={15} /> Dark</Center>), value: 'dark' },
                  ]}
                />
              </Stack>
            </Paper>

            {/* Profile */}
            <Paper id="profile" withBorder p="xl" radius="md">
              <Stack gap="md">
                <Title order={4}>Profile</Title>
                <TextInput
                  label="Display Name"
                  placeholder="Your name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
                <TextInput
                  label="Username"
                  placeholder="@username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
                <Textarea
                  label="Bio"
                  placeholder="Tell people about yourself..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  minRows={3}
                  autosize
                />
                <TextInput
                  type="date"
                  label="Birthday"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                />
                <Divider label="Contact Info" labelPosition="left" />
                <TextInput
                  label="Email"
                  placeholder="Shown to users who inquire"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <TextInput
                  label="Phone Number"
                  placeholder="Optional"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <Button onClick={handleSaveProfile} loading={saving}>
                  Save profile
                </Button>
              </Stack>
            </Paper>

            {/* Profile Picture */}
            <Paper id="picture" withBorder p="xl" radius="md">
              <Stack gap="md">
                <Title order={4}>Profile Picture</Title>
                <input
                  ref={picInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => handlePicUpload(e.target.files?.[0])}
                />
                <Group gap="md" align="center">
                  <Avatar src={profilePicUrl || null} size={72} radius="xl" />
                  <Stack gap="xs">
                    <Button
                      variant="default"
                      leftSection={<Upload size={14} />}
                      loading={picUploading}
                      onClick={() => picInputRef.current?.click()}
                    >
                      Upload new picture
                    </Button>
                    <Text size="xs" c="dimmed">JPG, PNG or GIF. Recommended square.</Text>
                  </Stack>
                </Group>
              </Stack>
            </Paper>

            {/* Security */}
            <Paper id="security" withBorder p="xl" radius="md">
              <Stack gap="md">
                <Title order={4}>Security</Title>
                <PasswordInput
                  label="Current password"
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                />
                <PasswordInput
                  label="New password"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                />
                <PasswordInput
                  label="Confirm new password"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                />
                <Button variant="default" onClick={handlePasswordChange} loading={pwSaving}>
                  Change password
                </Button>
              </Stack>
            </Paper>

            {/* Privacy */}
            <Paper id="privacy" withBorder p="xl" radius="md">
              <Stack gap="md">
                <Title order={4}>Privacy</Title>

                <Stack gap="xs">
                  <Text size="sm" fw={500}>Profile visibility</Text>
                  <Text size="xs" c="dimmed">Controls who can see your bio and personal info on your profile page.</Text>
                  <SegmentedControl
                    value={profileVisibility}
                    onChange={setProfileVisibility}
                    data={[
                      { label: 'Public',  value: 'public' },
                      { label: 'Private', value: 'private' },
                    ]}
                  />
                </Stack>

                <Divider />

                <Switch
                  label="Allow direct messages"
                  description="When off, other users cannot initiate new conversations with you."
                  checked={allowDirectMessages === 'everyone'}
                  onChange={e => setAllowDirectMessages(e.currentTarget.checked ? 'everyone' : 'nobody')}
                />

                <Switch
                  label="Show contact info on listings"
                  description="When off, your email and phone number are hidden from your listing pages."
                  checked={showContactInfo === 'everyone'}
                  onChange={e => setShowContactInfo(e.currentTarget.checked ? 'everyone' : 'nobody')}
                />

                <Button onClick={handleSavePrivacy} loading={privacySaving}>
                  Save privacy settings
                </Button>
              </Stack>
            </Paper>

          </Stack>
        </Grid.Col>

      </Grid>
    </Box>
  );
}

export default SettingsPage;
