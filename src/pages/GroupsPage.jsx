import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box, Stack, Group, Text, Button, Avatar, Paper, Loader, SimpleGrid, ActionIcon,
} from '@mantine/core';
import { Plus, Users, ArrowLeft } from 'lucide-react';
import { collection, query, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';

function GroupCard({ groupId }) {
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);

  useEffect(() => {
    getDoc(doc(db, 'groups', groupId))
      .then(snap => { if (snap.exists()) setGroup({ id: snap.id, ...snap.data() }); })
      .catch(console.error);
  }, [groupId]);

  if (!group) return null;

  return (
    <Paper withBorder p="md" radius="md" style={{ cursor: 'pointer' }} onClick={() => navigate(`/groups/${group.id}`)}>
      <Group gap="md" wrap="nowrap">
        <Avatar
          src={group.avatarURL || null} size={48} radius="md"
          style={{ background: 'var(--mantine-color-indigo-6)', flexShrink: 0 }}
        >
          <Users size={22} color="white" />
        </Avatar>
        <Box style={{ flex: 1, minWidth: 0 }}>
          <Text fw={600} size="sm" truncate>{group.name}</Text>
          {group.description && (
            <Text size="xs" c="dimmed" lineClamp={2}>{group.description}</Text>
          )}
          <Text size="xs" c="dimmed" mt={4}>{group.memberCount || 1} member{(group.memberCount || 1) !== 1 ? 's' : ''}</Text>
        </Box>
      </Group>
    </Paper>
  );
}

export default function GroupsPage() {
  const navigate    = useNavigate();
  const currentUser = auth.currentUser;
  const [groupIds, setGroupIds] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    // Find all groups where this user is a member
    async function loadGroups() {
      try {
        // Query all groups and check membership subcollection
        // Simpler: store groupIds on user doc (users/{uid}.groupIds)
        const userSnap = await getDoc(doc(db, 'users', currentUser.uid));
        const ids = userSnap.exists() ? (userSnap.data().groupIds || []) : [];
        setGroupIds(ids);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadGroups();
  }, [currentUser?.uid]);

  return (
    <Stack gap={0} py="xl" px={{ base: 'md', sm: 'xl' }} maw={900} mx="auto" className="page-enter">
      <title>groups | skillmesa</title>

      <Group justify="space-between" mb="xl">
        <Box>
          <Text size="xl" fw={700}>Groups</Text>
          <Text size="sm" c="dimmed">Collaborate and communicate with your teams.</Text>
        </Box>
        <Button
          leftSection={<Plus size={15} />}
          onClick={() => navigate('/groups/create')}
        >
          New Group
        </Button>
      </Group>

      {!currentUser ? (
        <Text c="dimmed" ta="center" py="xl">Sign in to view your groups.</Text>
      ) : loading ? (
        <Box style={{ display: 'flex', justifyContent: 'center' }} py="xl">
          <Loader color="gray" size="sm" />
        </Box>
      ) : groupIds.length === 0 ? (
        <Paper withBorder p="xl" radius="md" ta="center">
          <Avatar size={56} radius="xl" mx="auto" mb="md" style={{ background: 'var(--mantine-color-indigo-6)' }}>
            <Users size={28} color="white" />
          </Avatar>
          <Text fw={600} mb="xs">No groups yet</Text>
          <Text size="sm" c="dimmed" mb="lg">Create a group to start collaborating with others.</Text>
          <Button leftSection={<Plus size={15} />} onClick={() => navigate('/groups/create')}>
            Create your first group
          </Button>
        </Paper>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          {groupIds.map(id => <GroupCard key={id} groupId={id} />)}
        </SimpleGrid>
      )}
    </Stack>
  );
}
