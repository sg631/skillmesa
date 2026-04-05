import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, TextInput, Stack, Text, Paper, Group, Avatar, Box, Button, Loader } from '@mantine/core';
import { Search } from 'lucide-react';
import { collection, query, where, limit, getDocs, doc, getDoc, setDoc, updateDoc, arrayRemove, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export default function NewChatModal({ opened, onClose, currentUserId }) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [results, setResults]       = React.useState([]);
  const [searching, setSearching]   = React.useState(false);
  const [starting, setStarting]     = React.useState(null);

  React.useEffect(() => {
    if (!opened) { setSearchTerm(''); setResults([]); }
  }, [opened]);

  React.useEffect(() => {
    if (!searchTerm.trim()) { setResults([]); return; }
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const term = searchTerm.trim();
        const [snap1, snap2] = await Promise.all([
          getDocs(query(collection(db, 'users'), where('displayName', '>=', term), where('displayName', '<=', term + '\uf8ff'), limit(8))),
          getDocs(query(collection(db, 'users'), where('username', '>=', term.toLowerCase()), where('username', '<=', term.toLowerCase() + '\uf8ff'), limit(8))),
        ]);
        const seen = new Set();
        const users = [];
        for (const snap of [snap1, snap2]) {
          for (const d of snap.docs) {
            if (!seen.has(d.id) && d.id !== currentUserId) {
              seen.add(d.id);
              users.push({ uid: d.id, ...d.data() });
            }
          }
        }
        setResults(users.slice(0, 8));
      } catch (err) {
        console.error('User search failed:', err);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, currentUserId]);

  async function startChat(targetUID) {
    if (!currentUserId) return;
    setStarting(targetUID);
    try {
      const chatId  = [currentUserId, targetUID].sort().join('_');
      const chatRef = doc(db, 'chats', chatId);
      const existing = await getDoc(chatRef);
      if (!existing.exists()) {
        await setDoc(chatRef, {
          participants:  [currentUserId, targetUID].sort(),
          initiatedBy:   currentUserId,
          status:        'pending',
          requestSource: 'direct',
          lastAt:        serverTimestamp(),
          lastMessage:   '',
          hiddenBy:      [],
          blockedBy:     [],
          unread:        {},
        });
      } else if ((existing.data().hiddenBy ?? []).includes(currentUserId)) {
        // Re-initiating a previously hidden conversation — unhide it
        await updateDoc(chatRef, { hiddenBy: arrayRemove(currentUserId) });
      }
      onClose();
      navigate(`/inbox/${targetUID}`);
    } catch (err) {
      console.error('Failed to start chat:', err);
    } finally {
      setStarting(null);
    }
  }

  return (
    <Modal opened={opened} onClose={onClose} title="New conversation" size="sm">
      <Stack gap="sm">
        <TextInput
          placeholder="Search by name or username…"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          leftSection={<Search size={14} />}
          autoFocus
        />

        {searching && <Loader color="gray" size="xs" mx="auto" />}

        {!searching && searchTerm.trim() && results.length === 0 && (
          <Text size="sm" c="dimmed" ta="center" py="sm">No users found.</Text>
        )}

        {results.map(user => (
          <Paper key={user.uid} withBorder p="xs" radius="md">
            <Group gap="sm">
              <Avatar src={user.profilePic?.currentUrl || null} size={36} radius="xl" />
              <Box style={{ flex: 1, minWidth: 0 }}>
                <Text size="sm" fw={500} truncate>{user.displayName || '(No name)'}</Text>
                {user.username && <Text size="xs" c="dimmed">@{user.username}</Text>}
              </Box>
              <Button size="xs" variant="default" loading={starting === user.uid} onClick={() => startChat(user.uid)}>
                Message
              </Button>
            </Group>
          </Paper>
        ))}

        {!searchTerm.trim() && (
          <Text size="xs" c="dimmed" ta="center" py="xs">
            Search by display name or @username.
          </Text>
        )}
      </Stack>
    </Modal>
  );
}
