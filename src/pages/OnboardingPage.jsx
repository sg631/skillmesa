import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Stack, Title, Text, Avatar, Button, Textarea, Group,
  Center, Box, ActionIcon, Loader,
} from '@mantine/core';
import { Camera } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
import { auth, db, storage } from '../firebase';

function OnboardingPage() {
  const navigate = useNavigate();
  const user = auth.currentUser;

  const [bio, setBio]               = useState('');
  const [picUrl, setPicUrl]         = useState(user?.photoURL || null);
  const [uploading, setUploading]   = useState(false);
  const [saving, setSaving]         = useState(false);
  const fileInputRef                = useRef(null);

  useEffect(() => {
    document.title = 'Welcome | skillmesa';
    if (!user) navigate('/signon', { replace: true });
  }, []);

  async function handlePicSelect(file) {
    if (!file || !user) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const storageRef = ref(storage, `users/${user.uid}/profilePic.${ext}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await updateDoc(doc(db, 'users', user.uid), { 'profilePic.currentUrl': url });
      await updateProfile(user, { photoURL: url });
      setPicUrl(url);
    } catch (err) {
      console.error('Pic upload failed:', err);
    } finally {
      setUploading(false);
    }
  }

  async function handleContinue() {
    if (!user) return navigate('/home', { replace: true });
    setSaving(true);
    try {
      if (bio.trim()) {
        await updateDoc(doc(db, 'users', user.uid), { bio: bio.trim() });
      }
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
      navigate('/home', { replace: true });
    }
  }

  return (
    <Center style={{ minHeight: '80vh', padding: '2rem' }}>
      <Stack gap="xl" align="center" style={{ width: '100%', maxWidth: 440 }}>

        <Stack gap={4} align="center">
          <Title order={2}>Welcome to Skillmesa</Title>
          <Text size="sm" c="dimmed" ta="center">
            Set up your profile to get started. You can update these anytime in Settings.
          </Text>
        </Stack>

        {/* Profile picture */}
        <Stack gap="xs" align="center">
          <Box style={{ position: 'relative', display: 'inline-block' }}>
            <Avatar src={picUrl} size={100} radius="xl" />
            <ActionIcon
              size="sm"
              radius="xl"
              variant="filled"
              style={{
                position: 'absolute', bottom: 0, right: 0,
                border: '2px solid var(--mantine-color-body)',
              }}
              onClick={() => fileInputRef.current?.click()}
              loading={uploading}
              aria-label="Upload profile picture"
            >
              <Camera size={12} />
            </ActionIcon>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={e => handlePicSelect(e.target.files?.[0])}
            />
          </Box>
          <Text size="xs" c="dimmed">
            {uploading ? 'Uploading…' : 'Click to add a photo'}
          </Text>
        </Stack>

        {/* Bio */}
        <Textarea
          label="Bio"
          placeholder="Tell people a little about yourself…"
          value={bio}
          onChange={e => setBio(e.target.value)}
          minRows={3}
          autosize
          style={{ width: '100%' }}
        />

        {/* Actions */}
        <Stack gap="xs" style={{ width: '100%' }}>
          <Button fullWidth loading={saving} onClick={handleContinue}>
            Get started
          </Button>
          <Button
            fullWidth
            variant="subtle"
            color="gray"
            onClick={() => navigate('/home', { replace: true })}
          >
            Skip for now
          </Button>
        </Stack>

      </Stack>
    </Center>
  );
}

export default OnboardingPage;
