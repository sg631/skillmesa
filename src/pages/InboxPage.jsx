import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Text, Group, Avatar, Badge, Stack, ActionIcon,
  ScrollArea, Loader, Tooltip, useComputedColorScheme,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { Edit, X } from 'lucide-react';
import {
  collection, query, where, orderBy, onSnapshot, doc, getDoc,
  updateDoc, arrayUnion,
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import ChatView from '../components/ChatView';
import NewChatModal from '../components/NewChatModal';

function timeAgo(ts) {
  if (!ts?.toDate) return '';
  const diff = (Date.now() - ts.toDate().getTime()) / 1000;
  if (diff < 60) return 'now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function ConversationItem({ chat, currentUserId, isSelected, onClick, onHide }) {
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

  const selectedBg = isDark ? 'rgba(165,180,252,0.08)' : 'var(--mantine-color-gray-1)';
  const hoverBg    = isDark ? 'rgba(255,255,255,0.04)' : 'var(--mantine-color-gray-0)';

  const bg = isSelected ? selectedBg : hovered ? hoverBg : 'transparent';

  return (
    <Box
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ padding: '10px 12px', cursor: 'pointer', borderRadius: 8, background: bg, transition: 'background 0.1s ease', position: 'relative' }}
    >
      <Group gap="sm" wrap="nowrap">
        <Avatar src={otherUser?.profilePic?.currentUrl || null} size={40} radius="xl" style={{ flexShrink: 0 }} />
        <Box style={{ flex: 1, minWidth: 0 }}>
          <Group gap={4} justify="space-between" wrap="nowrap">
            <Text size="sm" fw={unread > 0 ? 700 : 500} truncate style={{ flex: 1, minWidth: 0 }}>
              {otherUser?.displayName || '…'}
            </Text>
            <Group gap={2} style={{ flexShrink: 0 }}>
              {chat.lastAt && !hovered && (
                <Text size="xs" c="dimmed">{timeAgo(chat.lastAt)}</Text>
              )}
              {hovered && (
                <Tooltip label="Hide conversation" openDelay={400}>
                  <ActionIcon
                    size="xs" variant="subtle" color="gray"
                    onClick={e => { e.stopPropagation(); onHide(); }}
                  >
                    <X size={12} />
                  </ActionIcon>
                </Tooltip>
              )}
            </Group>
          </Group>
          <Group gap={4} justify="space-between" wrap="nowrap" mt={2}>
            <Text size="xs" c="dimmed" truncate style={{ flex: 1, minWidth: 0 }}>
              {chat.lastMessage || 'No messages yet'}
            </Text>
            <Group gap={4} style={{ flexShrink: 0 }}>
              {isPendingRequest && <Badge size="xs" color="orange" variant="light">Request</Badge>}
              {isWaiting        && <Badge size="xs" color="gray"   variant="light">Pending</Badge>}
              {isBlocked        && <Badge size="xs" color="red"    variant="light">Blocked</Badge>}
              {unread > 0 && !isPendingRequest && !isBlocked && (
                <Badge size="xs" color="red" circle>{unread > 9 ? '9+' : unread}</Badge>
              )}
            </Group>
          </Group>
        </Box>
      </Group>
    </Box>
  );
}

export default function InboxPage() {
  const { otherUID }  = useParams();
  const navigate      = useNavigate();
  const currentUser   = auth.currentUser;
  const isMobile      = useMediaQuery('(max-width: 768px)');

  const [chats, setChats]          = React.useState([]);
  const [loadingChats, setLoading] = React.useState(true);
  const [newChatOpen, setNewChat]  = React.useState(false);

  const sidebarBorder = `1px solid var(--mantine-color-default-border)`;

  React.useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', currentUser.uid),
      orderBy('lastAt', 'desc')
    );
    return onSnapshot(q, snap => {
      setChats(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, err => {
      console.warn('Inbox chats query failed:', err.message);
      setLoading(false);
    });
  }, [currentUser?.uid]);

  async function hideChat(chatId) {
    try {
      await updateDoc(doc(db, 'chats', chatId), {
        hiddenBy: arrayUnion(currentUser.uid),
      });
    } catch (err) {
      console.error('Failed to hide chat:', err);
    }
  }

  if (!currentUser) {
    return (
      <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 112px)' }}>
        <Text c="dimmed">Sign in to view your inbox.</Text>
      </Box>
    );
  }

  const visibleChats = chats.filter(c => !(c.hiddenBy ?? []).includes(currentUser.uid));

  // On mobile: show sidebar when no conversation selected, show chat when one is selected
  const showSidebar = !isMobile || !otherUID;
  const showChat    = !isMobile || !!otherUID;

  return (
    <Box style={{ display: 'flex', height: 'calc(100dvh - 112px)', overflow: 'hidden' }}>

      {/* ── Sidebar ── */}
      {showSidebar && (
        <Box style={{
          width: isMobile ? '100%' : 300,
          flexShrink: 0,
          borderRight: isMobile ? 'none' : sidebarBorder,
          display: 'flex',
          flexDirection: 'column',
        }}>
          <Group px="md" py="sm" style={{ borderBottom: sidebarBorder, flexShrink: 0 }}>
            <Text fw={600} size="sm" style={{ flex: 1 }}>Inbox</Text>
            <ActionIcon variant="subtle" color="gray" size="sm" onClick={() => setNewChat(true)} aria-label="New conversation">
              <Edit size={14} />
            </ActionIcon>
          </Group>

          <ScrollArea style={{ flex: 1 }}>
            {loadingChats ? (
              <Box p="md" style={{ display: 'flex', justifyContent: 'center' }}>
                <Loader color="gray" size="sm" />
              </Box>
            ) : visibleChats.length === 0 ? (
              <Box p="md">
                <Text size="sm" c="dimmed" ta="center">No conversations yet.</Text>
                <Text size="xs" c="dimmed" ta="center" mt={4}>Use the compose button to start one.</Text>
              </Box>
            ) : (
              <Stack gap={2} p="xs">
                {visibleChats.map(chat => {
                  const chatOtherUID = chat.participants?.find(p => p !== currentUser.uid);
                  return (
                    <ConversationItem
                      key={chat.id}
                      chat={chat}
                      currentUserId={currentUser.uid}
                      isSelected={chatOtherUID === otherUID}
                      onClick={() => navigate(`/inbox/${chatOtherUID}`)}
                      onHide={() => hideChat(chat.id)}
                    />
                  );
                })}
              </Stack>
            )}
          </ScrollArea>
        </Box>
      )}

      {/* ── Chat panel ── */}
      {showChat && (
        <Box style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <ChatView otherUID={otherUID} showBackButton={isMobile} />
        </Box>
      )}

      <NewChatModal opened={newChatOpen} onClose={() => setNewChat(false)} currentUserId={currentUser.uid} />
    </Box>
  );
}
