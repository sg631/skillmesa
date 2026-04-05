import React from 'react';
import {
  Title, Text, Stack, Group, Paper, Avatar, Badge, Box, Loader, Divider, ActionIcon, Tooltip,
} from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { LinkButton } from '../components/LinkElements.jsx';
import ListingsPanel from '../components/ListingsPanel.jsx';
import NewChatModal from '../components/NewChatModal.jsx';
import { auth, db } from '../firebase';
import {
  collection, query, where, orderBy, limit, onSnapshot, doc, getDoc,
  updateDoc, arrayUnion,
} from 'firebase/firestore';
import { MessageSquare, Edit, Plus, X } from 'lucide-react';

const listingsCollection = collection(db, 'listings');

function timeAgo(ts) {
  if (!ts?.toDate) return '';
  const diff = (Date.now() - ts.toDate().getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function ChatRow({ chat, currentUserId, onHide }) {
  const navigate = useNavigate();
  const otherUID = chat.participants?.find(p => p !== currentUserId);
  const [otherUser, setOtherUser] = React.useState(null);
  const [hovered, setHovered]     = React.useState(false);
  const unread           = chat.unread?.[currentUserId] || 0;
  const isPendingRequest = chat.status === 'pending' && chat.initiatedBy !== currentUserId;
  const isWaiting        = chat.status === 'pending' && chat.initiatedBy === currentUserId;
  const isBlocked        = (chat.blockedBy?.length ?? 0) > 0;

  React.useEffect(() => {
    if (!otherUID) return;
    getDoc(doc(db, 'users', otherUID))
      .then(snap => { if (snap.exists()) setOtherUser(snap.data()); })
      .catch(() => {});
  }, [otherUID]);

  return (
    <Group
      gap="sm" px="sm" py="xs"
      style={{ cursor: 'pointer', borderRadius: 8, transition: 'background 0.12s ease' }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--mantine-color-default-hover)'; setHovered(true); }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; setHovered(false); }}
      onClick={() => navigate(`/inbox/${otherUID}`)}
    >
      <Avatar src={otherUser?.profilePic?.currentUrl || null} size={36} radius="xl" />
      <Box style={{ flex: 1, minWidth: 0 }}>
        <Text size="sm" fw={unread > 0 ? 700 : 400} truncate>{otherUser?.displayName || '…'}</Text>
        <Text size="xs" c="dimmed" truncate>{chat.lastMessage || 'No messages yet'}</Text>
      </Box>
      <Stack gap={2} align="flex-end" style={{ flexShrink: 0 }}>
        {chat.lastAt && !hovered && <Text size="xs" c="dimmed">{timeAgo(chat.lastAt)}</Text>}
        {hovered ? (
          <Tooltip label="Hide conversation" openDelay={400}>
            <ActionIcon
              size="xs" variant="subtle" color="gray"
              onClick={e => { e.stopPropagation(); onHide(); }}
            >
              <X size={12} />
            </ActionIcon>
          </Tooltip>
        ) : (
          <Group gap={4}>
            {isPendingRequest && <Badge size="xs" color="orange" variant="light">Request</Badge>}
            {isWaiting        && <Badge size="xs" color="gray"   variant="light">Pending</Badge>}
            {isBlocked        && <Badge size="xs" color="red"    variant="light">Blocked</Badge>}
            {unread > 0 && !isPendingRequest && !isBlocked && (
              <Badge size="xs" color="red" circle>{unread > 9 ? '9+' : unread}</Badge>
            )}
          </Group>
        )}
      </Stack>
    </Group>
  );
}

function ChatsContent({ chats, loading, userId, hideChat }) {
  if (loading) {
    return (
      <Box p="md" style={{ display: 'flex', justifyContent: 'center' }}>
        <Loader color="gray" size="sm" />
      </Box>
    );
  }
  const visibleChats = chats.filter(c => !(c.hiddenBy ?? []).includes(userId));
  if (visibleChats.length === 0) {
    return (
      <Box p="md">
        <Text size="sm" c="dimmed" ta="center">No conversations yet.</Text>
        <Text size="xs" c="dimmed" ta="center" mt={4}>
          Use the compose button above or start a chat from any listing.
        </Text>
      </Box>
    );
  }
  return (
    <Stack gap={0} p="xs">
      {visibleChats.slice(0, 5).map(chat => (
        <ChatRow key={chat.id} chat={chat} currentUserId={userId} onHide={() => hideChat(chat.id)} />
      ))}
    </Stack>
  );
}

function ChatsOverview({ userId }) {
  const navigate = useNavigate();
  const [chats, setChats]             = React.useState([]);
  const [loading, setLoading]         = React.useState(true);
  const [newChatOpen, setNewChatOpen] = React.useState(false);

  React.useEffect(() => {
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', userId),
      orderBy('lastAt', 'desc'),
      limit(10)
    );
    const unsub = onSnapshot(q, snap => {
      setChats(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, err => {
      console.warn('Chats query failed (index may be missing):', err.message);
      setLoading(false);
    });
    return () => unsub();
  }, [userId]);

  async function hideChat(chatId) {
    try {
      await updateDoc(doc(db, 'chats', chatId), { hiddenBy: arrayUnion(userId) });
    } catch (err) {
      console.error('Failed to hide chat:', err);
    }
  }

  return (
    <>
      <Paper withBorder radius="md" w="100%" maw={700}>
        <Group px="md" py="sm" style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
          <MessageSquare size={16} />
          <Text fw={600} size="sm">Messages</Text>
          <Box style={{ flex: 1 }} />
          <ActionIcon variant="subtle" color="gray" size="sm" onClick={() => navigate('/inbox')} aria-label="Open inbox">
            <MessageSquare size={13} />
          </ActionIcon>
          <ActionIcon variant="subtle" color="gray" size="sm" onClick={() => setNewChatOpen(true)} aria-label="New conversation">
            <Edit size={14} />
          </ActionIcon>
        </Group>

        <ChatsContent chats={chats} loading={loading} userId={userId} hideChat={hideChat} />
      </Paper>

      <NewChatModal opened={newChatOpen} onClose={() => setNewChatOpen(false)} currentUserId={userId} />
    </>
  );
}

function HomePage() {
  const user = auth.currentUser;

  const userListingsQuery = React.useMemo(
    () => user ? query(listingsCollection, where('owner', '==', user.uid)) : null,
    [user?.uid]
  );

  if (!user) {
    return (
      <Stack align="center" gap="md" py="xl">
        <title>home | skillmesa</title>
        <Title order={1}>Your dashboard</Title>
        <LinkButton to="/create">Create new listing</LinkButton>
        <Text c="dimmed">Please sign in to view your dashboard.</Text>
      </Stack>
    );
  }

  return (
    <Stack align="center" gap="xl" py="xl" px={{ base: 'sm', sm: 0 }}>
      <title>home | skillmesa</title>
      <Title order={1}>Dashboard</Title>

      <ChatsOverview userId={user.uid} />

      <Divider w="100%" maw={700} />

      <Group w="100%" maw={700} justify="space-between" align="center">
        <Text fw={600} size="sm" c="dimmed" tt="uppercase" style={{ letterSpacing: '0.05em' }}>
          Your Listings
        </Text>
        <LinkButton to="/create" size="xs" variant="default">
          <Group gap={4}><Plus size={12} />New listing</Group>
        </LinkButton>
      </Group>

      <ListingsPanel query={userListingsQuery} size={5} paginated emptyMessage="You have no listings yet." />
    </Stack>
  );
}

export default HomePage;
