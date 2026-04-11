import React from 'react';
import {
  Title, Text, Stack, Group, Paper, Avatar, Badge, Box, Loader, Divider, ActionIcon, Tooltip,
  SimpleGrid, Image, useComputedColorScheme,
} from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { LinkButton } from '../components/LinkElements.jsx';
import ListingsPanel from '../components/ListingsPanel.jsx';
import NewChatModal from '../components/NewChatModal.jsx';
import { auth, db } from '../firebase';
import {
  collection, query, where, orderBy, limit, onSnapshot, doc, getDoc,
  updateDoc, arrayUnion, collectionGroup, getDocs,
} from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { MessageSquare, Edit, Plus, X, Tag, Users } from 'lucide-react';

const listingsCollection = collection(db, 'listings');

function timeAgo(ts) {
  if (!ts?.toDate) return '';
  const diff = (Date.now() - ts.toDate().getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

// ── DM row ──────────────────────────────────────────────────────────
function DmChatRow({ chat, currentUserId, onHide }) {
  const navigate = useNavigate();
  const otherUID = chat.participants?.find(p => p !== currentUserId);
  const [otherUser, setOtherUser] = React.useState(null);
  const [hovered, setHovered]     = React.useState(false);
  const isDark = useComputedColorScheme('light') === 'dark';

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

  const hoverBg = isDark ? 'rgba(255,255,255,0.04)' : 'var(--mantine-color-gray-0)';

  return (
    <Group
      gap="sm" px="sm" py="xs"
      style={{ cursor: 'pointer', borderRadius: 8, transition: 'background 0.12s ease', background: hovered ? hoverBg : 'transparent' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => navigate(`/inbox/${chat.id}`)}
    >
      <Avatar src={otherUser?.profilePic?.currentUrl || null} size={36} radius="xl" style={{ flexShrink: 0 }} />
      <Box style={{ flex: 1, minWidth: 0 }}>
        <Text size="sm" fw={unread > 0 ? 700 : 400} truncate>{otherUser?.displayName || '…'}</Text>
        <Text size="xs" c="dimmed" truncate>{chat.lastMessage || 'No messages yet'}</Text>
      </Box>
      <Stack gap={2} align="flex-end" style={{ flexShrink: 0 }}>
        {chat.lastAt && !hovered && <Text size="xs" c="dimmed">{timeAgo(chat.lastAt)}</Text>}
        {hovered ? (
          <Tooltip label="Hide" openDelay={400}>
            <ActionIcon size="xs" variant="subtle" color="gray"
              onClick={e => { e.stopPropagation(); onHide(); }}>
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

// ── Inquiry row ──────────────────────────────────────────────────────
function InquiryChatRow({ chat, currentUserId, onHide }) {
  const navigate = useNavigate();
  const otherUID = chat.participants?.find(p => p !== currentUserId);
  const [otherUser, setOtherUser]       = React.useState(null);
  const [listingTitle, setListingTitle] = React.useState(null);
  const [hovered, setHovered]           = React.useState(false);
  const isDark = useComputedColorScheme('light') === 'dark';

  const unread = chat.unread?.[currentUserId] || 0;

  React.useEffect(() => {
    if (!otherUID) return;
    getDoc(doc(db, 'users', otherUID)).then(s => { if (s.exists()) setOtherUser(s.data()); }).catch(() => {});
  }, [otherUID]);

  React.useEffect(() => {
    if (!chat.listingId) return;
    getDoc(doc(db, 'listings', chat.listingId))
      .then(s => { if (s.exists()) setListingTitle(s.data().title || null); })
      .catch(() => {});
  }, [chat.listingId]);

  const hoverBg = isDark ? 'rgba(255,255,255,0.04)' : 'var(--mantine-color-gray-0)';

  return (
    <Group
      gap="sm" px="sm" py="xs"
      style={{ cursor: 'pointer', borderRadius: 8, transition: 'background 0.12s ease', background: hovered ? hoverBg : 'transparent' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => navigate(`/inbox/${chat.id}`)}
    >
      <Avatar src={otherUser?.profilePic?.currentUrl || null} size={36} radius="xl" style={{ flexShrink: 0 }} />
      <Box style={{ flex: 1, minWidth: 0 }}>
        <Group gap={4} wrap="nowrap" align="center">
          <Text size="sm" fw={unread > 0 ? 700 : 400} truncate style={{ minWidth: 0 }}>
            {otherUser?.displayName || '…'}
          </Text>
          <Badge size="xs" color="violet" variant="light" leftSection={<Tag size={9} />} style={{ flexShrink: 0 }}>
            Inquiry
          </Badge>
        </Group>
        <Text size="xs" c="dimmed" truncate>
          {listingTitle ? `Re: ${listingTitle}` : chat.lastMessage || 'No messages yet'}
        </Text>
      </Box>
      <Stack gap={2} align="flex-end" style={{ flexShrink: 0 }}>
        {chat.lastAt && !hovered && <Text size="xs" c="dimmed">{timeAgo(chat.lastAt)}</Text>}
        {hovered ? (
          <Tooltip label="Hide" openDelay={400}>
            <ActionIcon size="xs" variant="subtle" color="gray"
              onClick={e => { e.stopPropagation(); onHide(); }}>
              <X size={12} />
            </ActionIcon>
          </Tooltip>
        ) : (
          unread > 0 && <Badge size="xs" color="red" circle>{unread > 9 ? '9+' : unread}</Badge>
        )}
      </Stack>
    </Group>
  );
}

// ── Group row ────────────────────────────────────────────────────────
function GroupChatRow({ chat, currentUserId }) {
  const navigate = useNavigate();
  const [groupData, setGroupData] = React.useState(null);
  const [hovered, setHovered]     = React.useState(false);
  const isDark = useComputedColorScheme('light') === 'dark';

  const unread = chat.unread?.[currentUserId] || 0;

  React.useEffect(() => {
    if (!chat.groupId) return;
    getDoc(doc(db, 'groups', chat.groupId)).then(s => { if (s.exists()) setGroupData({ id: s.id, ...s.data() }); }).catch(() => {});
  }, [chat.groupId]);

  const hoverBg = isDark ? 'rgba(255,255,255,0.04)' : 'var(--mantine-color-gray-0)';

  return (
    <Group
      gap="sm" px="sm" py="xs"
      style={{ cursor: 'pointer', borderRadius: 8, transition: 'background 0.12s ease', background: hovered ? hoverBg : 'transparent' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => navigate(`/inbox/${chat.id}`)}
    >
      <Avatar
        src={groupData?.avatarURL || null} size={36} radius="md"
        style={{ background: 'var(--mantine-color-indigo-6)', flexShrink: 0 }}
      >
        <Users size={18} color="white" />
      </Avatar>
      <Box style={{ flex: 1, minWidth: 0 }}>
        <Group gap={4} wrap="nowrap" align="center">
          <Text size="sm" fw={unread > 0 ? 700 : 400} truncate style={{ minWidth: 0 }}>
            {groupData?.name || 'Group'}
          </Text>
          <Badge size="xs" color="indigo" variant="light" leftSection={<Users size={9} />} style={{ flexShrink: 0 }}>
            Group
          </Badge>
        </Group>
        <Text size="xs" c="dimmed" truncate>{chat.lastMessage || 'No messages yet'}</Text>
      </Box>
      <Stack gap={2} align="flex-end" style={{ flexShrink: 0 }}>
        {chat.lastAt && <Text size="xs" c="dimmed">{timeAgo(chat.lastAt)}</Text>}
        {unread > 0 && <Badge size="xs" color="red" circle>{unread > 9 ? '9+' : unread}</Badge>}
      </Stack>
    </Group>
  );
}

// ── Dispatch to correct row type ─────────────────────────────────────
function ChatRow({ chat, currentUserId, onHide }) {
  const type = chat.type || 'dm';
  if (type === 'inquiry') return <InquiryChatRow chat={chat} currentUserId={currentUserId} onHide={onHide} />;
  if (type === 'group')   return <GroupChatRow   chat={chat} currentUserId={currentUserId} />;
  return <DmChatRow chat={chat} currentUserId={currentUserId} onHide={onHide} />;
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
      {visibleChats.slice(0, 6).map(chat => (
        <ChatRow key={chat.id} chat={chat} currentUserId={userId} onHide={() => hideChat(chat.id)} />
      ))}
      {visibleChats.length > 6 && (
        <Text
          size="xs" c="dimmed" ta="center" py="xs"
          style={{ cursor: 'pointer' }}
          onClick={() => {}}
        >
          {/* rendered by ChatsOverview with navigate — passed as prop */}
        </Text>
      )}
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
      limit(12)
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

  const visibleChats = chats.filter(c => !(c.hiddenBy ?? []).includes(userId));
  const hasMore = visibleChats.length > 6;

  return (
    <>
      <Paper withBorder radius="md" w="100%" maw={700}>
        <Group px="md" py="sm" style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}>
          <MessageSquare size={16} />
          <Text fw={600} size="sm" style={{ flex: 1 }}>Chats</Text>
          <ActionIcon variant="subtle" color="gray" size="sm" onClick={() => navigate('/inbox')} aria-label="Open inbox">
            <MessageSquare size={13} />
          </ActionIcon>
          <ActionIcon variant="subtle" color="gray" size="sm" onClick={() => setNewChatOpen(true)} aria-label="New conversation">
            <Edit size={14} />
          </ActionIcon>
        </Group>

        <ChatsContent chats={chats} loading={loading} userId={userId} hideChat={hideChat} />

        {!loading && hasMore && (
          <Box
            px="md" py="xs"
            style={{ borderTop: '1px solid var(--mantine-color-default-border)', cursor: 'pointer' }}
            onClick={() => navigate('/inbox')}
          >
            <Text size="xs" c="dimmed" ta="center">
              View all in Inbox →
            </Text>
          </Box>
        )}
      </Paper>

      <NewChatModal opened={newChatOpen} onClose={() => setNewChatOpen(false)} currentUserId={userId} />
    </>
  );
}

function EnrolledSection({ userId }) {
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = React.useState([]);
  const [loading, setLoading]         = React.useState(true);

  React.useEffect(() => {
    if (!userId) return;
    const unsub = onSnapshot(
      query(collectionGroup(db, 'enrollments'), where('userId', '==', userId)),
      (snap) => { setEnrollments(snap.docs.map(d => d.data())); setLoading(false); },
      (err) => { console.error('enrollments query:', err); setLoading(false); }
    );
    return () => unsub();
  }, [userId]);

  if (loading) {
    return <Group justify="center" py="sm"><Loader size="xs" color="gray" /></Group>;
  }

  if (enrollments.length === 0) {
    return (
      <Text size="sm" c="dimmed" ta="center" py="sm">
        Not enrolled in any listings.{' '}
        <Text component={Link} to="/explore" c="cyan" size="sm">Browse Explore</Text> to find something.
      </Text>
    );
  }

  return (
    <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="sm" w="100%">
      {enrollments.map(e => (
        <Paper
          key={e.listingId}
          withBorder
          radius="md"
          style={{ cursor: 'pointer', overflow: 'hidden' }}
          onClick={() => navigate(`/listing/${e.listingId}`)}
        >
          <Image
            src={e.listingThumbnailURL || null}
            h={72}
            fallbackSrc="https://placehold.co/400x72/f4f4f5/a1a1aa?text=No+Image"
            style={{ objectFit: 'cover' }}
          />
          <Box p="xs">
            <Text size="sm" fw={500} truncate title={e.listingTitle}>{e.listingTitle || 'Listing'}</Text>
            <Badge size="xs" color="teal" variant="light" mt={4}>Enrolled</Badge>
          </Box>
        </Paper>
      ))}
    </SimpleGrid>
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

      <Stack w="100%" maw={700} gap="sm">
        <Text fw={600} size="sm" c="dimmed" tt="uppercase" style={{ letterSpacing: '0.05em' }}>
          Enrolled
        </Text>
        <EnrolledSection userId={user.uid} />
      </Stack>

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
