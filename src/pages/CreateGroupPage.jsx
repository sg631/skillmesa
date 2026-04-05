import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Stack, Group, Text, TextInput, Textarea, Button, Box, ActionIcon, Paper, Loader,
} from '@mantine/core';
import { ArrowLeft, Users } from 'lucide-react';
import { collection, doc, setDoc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import showAlert from '../components/ShowAlert';

export default function CreateGroupPage() {
  const navigate    = useNavigate();
  const currentUser = auth.currentUser;

  const [name, setName]           = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting]   = useState(false);

  async function handleCreate() {
    if (!currentUser) { navigate('/signon'); return; }
    if (!name.trim()) { showAlert('Please enter a group name.'); return; }

    setSubmitting(true);
    try {
      const groupRef = doc(collection(db, 'groups'));
      const groupId  = groupRef.id;
      const chatId   = `group_${groupId}`;

      // Create group doc
      await setDoc(groupRef, {
        name:        name.trim(),
        description: description.trim(),
        createdBy:   currentUser.uid,
        memberCount: 1,
        chatId,
        avatarURL:   null,
        createdAt:   serverTimestamp(),
      });

      // Add creator as owner in members subcollection
      await setDoc(doc(db, 'groups', groupId, 'members', currentUser.uid), {
        role:       'owner',
        joinedAt:   serverTimestamp(),
      });

      // Create group chat doc
      await setDoc(doc(db, 'chats', chatId), {
        type:        'group',
        groupId,
        participants: [currentUser.uid],
        lastMessage: '',
        lastAt:      serverTimestamp(),
        unread:      {},
      });

      // Add groupId to user's groupIds array
      await updateDoc(doc(db, 'users', currentUser.uid), {
        groupIds: arrayUnion(groupId),
      });

      navigate(`/groups/${groupId}`);
    } catch (err) {
      console.error('Failed to create group:', err);
      showAlert('Failed to create group. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Stack gap={0} py="xl" px={{ base: 'md', sm: 'xl' }} maw={600} mx="auto" className="page-enter">
      <title>create group | skillmesa</title>

      <Group gap="xs" mb="xl">
        <ActionIcon variant="subtle" color="gray" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} />
        </ActionIcon>
        <Text size="sm" c="dimmed" style={{ cursor: 'pointer' }} onClick={() => navigate(-1)}>Back</Text>
      </Group>

      <Text size="xl" fw={700} mb="xs">Create a Group</Text>
      <Text size="sm" c="dimmed" mb="xl">Groups let you collaborate, chat, and manage listings together.</Text>

      <Paper withBorder p="xl" radius="md">
        <Stack gap="md">
          <TextInput
            label="Group name"
            placeholder="e.g. Coding Club, Art Squad…"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
          <Textarea
            label="Description"
            placeholder="What is this group about?"
            value={description}
            onChange={e => setDescription(e.target.value)}
            autosize
            minRows={3}
          />
          <Button
            fullWidth
            size="md"
            leftSection={<Users size={16} />}
            loading={submitting}
            onClick={handleCreate}
          >
            {submitting ? 'Creating…' : 'Create group'}
          </Button>
        </Stack>
      </Paper>
    </Stack>
  );
}
