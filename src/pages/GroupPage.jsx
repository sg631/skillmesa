import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Stack, Group, Text, Button, Avatar, Paper, Loader, Box, ActionIcon,
  Badge, Divider, SimpleGrid,
} from '@mantine/core';
import { ArrowLeft, MessageSquare, Settings, Users, Plus, Crown, Shield, UserCheck, User } from 'lucide-react';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase';
import ListingComponent from '../components/ListingComponent';

const ROLE_ICONS = {
  owner: <Crown size={12} />,
  admin: <Shield size={12} />,
  editor: <UserCheck size={12} />,
  member: <User size={12} />,
};
const ROLE_COLORS = { owner: 'yellow', admin: 'blue', editor: 'teal', member: 'gray' };
const ROLE_ORDER  = { owner: 0, admin: 1, editor: 2, member: 3 };

function MemberRow({ uid, role }) {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    getDoc(doc(db, 'users', uid))
      .then(snap => { if (snap.exists()) setUserData(snap.data()); })
      .catch(console.error);
  }, [uid]);

  return (
    <Group gap="sm" wrap="nowrap" style={{ cursor: 'pointer' }} onClick={() => navigate(`/profile/${uid}`)}>
      <Avatar src={userData?.profilePic?.currentUrl || null} size={36} radius="xl" style={{ flexShrink: 0 }} />
      <Box style={{ flex: 1, minWidth: 0 }}>
        <Text size="sm" fw={500} truncate>{userData?.displayName || '…'}</Text>
        {userData?.username && <Text size="xs" c="dimmed">@{userData.username}</Text>}
      </Box>
      <Badge
        size="xs"
        color={ROLE_COLORS[role] || 'gray'}
        variant="light"
        leftSection={ROLE_ICONS[role]}
        style={{ flexShrink: 0, textTransform: 'capitalize' }}
      >
        {role}
      </Badge>
    </Group>
  );
}

export default function GroupPage() {
  const { groupId } = useParams();
  const navigate    = useNavigate();
  const currentUser = auth.currentUser;

  const [group, setGroup]     = useState(null);
  const [members, setMembers] = useState([]);
  const [myRole, setMyRole]   = useState(null);
  const [listingIds, setListingIds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!groupId) return;
    async function load() {
      setLoading(true);
      try {
        const [groupSnap, membersSnap] = await Promise.all([
          getDoc(doc(db, 'groups', groupId)),
          getDocs(collection(db, 'groups', groupId, 'members')),
        ]);
        if (!groupSnap.exists()) { setLoading(false); return; }

        const g = { id: groupSnap.id, ...groupSnap.data() };
        setGroup(g);
        setListingIds(g.listingIds || []);

        const memberList = membersSnap.docs.map(d => ({ uid: d.id, ...d.data() }));
        setMembers(memberList);

        if (currentUser) {
          const me = memberList.find(m => m.uid === currentUser.uid);
          setMyRole(me?.role || null);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [groupId, currentUser?.uid]);

  if (loading) return (
    <Box py="xl" style={{ display: 'flex', justifyContent: 'center' }}>
      <Loader color="gray" size="sm" />
    </Box>
  );

  if (!group) return <Text ta="center" py="xl" c="dimmed">Group not found.</Text>;

  const chatId     = group.chatId || `group_${groupId}`;
  const canManage  = myRole === 'owner' || myRole === 'admin';
  const canEdit    = myRole === 'owner' || myRole === 'admin' || myRole === 'editor';

  const sortedMembers = [...members].sort(
    (a, b) => (ROLE_ORDER[a.role] ?? 4) - (ROLE_ORDER[b.role] ?? 4)
  );

  return (
    <Stack gap={0} py="xl" px={{ base: 'md', sm: 'xl' }} maw={1000} mx="auto" className="page-enter">
      <title>{group.name} | skillmesa</title>

      <Group gap="xs" mb="xl">
        <ActionIcon variant="subtle" color="gray" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} />
        </ActionIcon>
        <Text size="sm" c="dimmed" style={{ cursor: 'pointer' }} onClick={() => navigate(-1)}>Back</Text>
      </Group>

      {/* ── Group header ── */}
      <Paper withBorder p="xl" radius="md" mb="xl">
        <Group gap="lg" wrap="nowrap" align="flex-start">
          <Avatar
            src={group.avatarURL || null} size={72} radius="md"
            style={{ background: 'var(--mantine-color-indigo-6)', flexShrink: 0 }}
          >
            <Users size={36} color="white" />
          </Avatar>
          <Box style={{ flex: 1, minWidth: 0 }}>
            <Group gap="xs" mb={4}>
              <Text size="xl" fw={700}>{group.name}</Text>
              {myRole && (
                <Badge size="xs" color={ROLE_COLORS[myRole]} variant="light" leftSection={ROLE_ICONS[myRole]}>
                  {myRole}
                </Badge>
              )}
            </Group>
            {group.description && <Text size="sm" c="dimmed" mb="sm">{group.description}</Text>}
            <Text size="xs" c="dimmed">{members.length} member{members.length !== 1 ? 's' : ''}</Text>
          </Box>
          <Group gap="xs" style={{ flexShrink: 0 }} wrap="nowrap">
            <Button
              leftSection={<MessageSquare size={14} />}
              onClick={() => navigate(`/inbox/${chatId}`)}
            >
              Open Chat
            </Button>
            {canManage && (
              <ActionIcon
                variant="default" size="lg"
                onClick={() => navigate(`/groups/${groupId}/manage`)}
                aria-label="Manage group"
              >
                <Settings size={16} />
              </ActionIcon>
            )}
          </Group>
        </Group>
      </Paper>

      {/* ── Listings ── */}
      <Paper withBorder p="xl" radius="md" mb="xl">
        <Group justify="space-between" mb="md">
          <Box>
            <Text fw={600}>Listings</Text>
            <Text size="xs" c="dimmed">Listings owned by this group</Text>
          </Box>
          {canEdit && (
            <Button
              size="xs" variant="default" leftSection={<Plus size={13} />}
              onClick={() => navigate(`/create?group=${groupId}`)}
            >
              New listing
            </Button>
          )}
        </Group>

        {listingIds.length === 0 ? (
          <Box py="md" ta="center">
            <Text size="sm" c="dimmed">No listings yet.</Text>
            {canEdit && (
              <Button
                size="xs" variant="subtle" mt="xs"
                onClick={() => navigate(`/create?group=${groupId}`)}
              >
                Create the first listing
              </Button>
            )}
          </Box>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
            {listingIds.map(id => (
              <ListingComponent key={id} id={id} />
            ))}
          </SimpleGrid>
        )}
      </Paper>

      {/* ── Members ── */}
      <Paper withBorder p="xl" radius="md">
        <Group justify="space-between" mb="md">
          <Text fw={600}>Members</Text>
          {canManage && (
            <Button
              size="xs" variant="default" leftSection={<Plus size={13} />}
              onClick={() => navigate(`/groups/${groupId}/manage`)}
            >
              Add member
            </Button>
          )}
        </Group>
        <Stack gap="sm">
          {sortedMembers.map((m, i) => (
            <React.Fragment key={m.uid}>
              <MemberRow uid={m.uid} role={m.role} />
              {i < sortedMembers.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </Stack>
      </Paper>
    </Stack>
  );
}
