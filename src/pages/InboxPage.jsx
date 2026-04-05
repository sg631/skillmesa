import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Text, Group, Avatar, Badge, Stack, ActionIcon,
  ScrollArea, Loader, Tooltip, useComputedColorScheme, Tabs,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { Edit, X, MessageSquare, Tag, Users } from 'lucide-react';
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

// ── DM Conversation Item ──────────────────────────────────────────────
function DmConversationItem({ chat, currentUserId, isSelected, onClick, onHide }) {
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
  const bg         = isSelected ? selectedBg : hovered ? hoverBg : 'transparent';

  return (
    <Box
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ padding: '10px 12px', cursor: 'pointer', borderRadius: 8, background: bg, transition: 'background 0.1s ease' }}
    >
      <Group gap="sm" wrap="nowrap">
        <Avatar src={otherUser?.profilePic?.currentUrl || null} size={40} radius="xl" style={{ flexShrink: 0 }} />
        <Box style={{ flex: 1, minWidth: 0 }}>
          <Group gap={4} justify="space-between" wrap="nowrap">
            <Text size="sm" fw={unread > 0 ? 700 : 500} truncate style={{ flex: 1, minWidth: 0 }}>
              {otherUser?.displayName || '…'}
            </Text>
            <Group gap={2} style={{ flexShrink: 0 }}>
              {chat.lastAt && !hovered && <Text size="xs" c="dimmed">{timeAgo(chat.lastAt)}</Text>}
              {hovered && (
                <Tooltip label="Hide conversation" openDelay={400}>
                  <ActionIcon size="xs" variant="subtle" color="gray"
                    onClick={e => { e.stopPropagation(); onHide(); }}>
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

// ── Inquiry Conversation Item ────────────────────────────────────────
function InquiryConversationItem({ chat, currentUserId, isSelected, onClick, onHide }) {
  const otherUID = chat.participants?.find(p => p !== currentUserId);
  const [otherUser, setOtherUser]     = React.useState(null);
  const [listingTitle, setListingTitle] = React.useState(null);
  const [hovered, setHovered]          = React.useState(false);
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

  const selectedBg = isDark ? 'rgba(165,180,252,0.08)' : 'var(--mantine-color-gray-1)';
  const hoverBg    = isDark ? 'rgba(255,255,255,0.04)' : 'var(--mantine-color-gray-0)';
  const bg         = isSelected ? selectedBg : hovered ? hoverBg : 'transparent';

  return (
    <Box
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ padding: '10px 12px', cursor: 'pointer', borderRadius: 8, background: bg, transition: 'background 0.1s ease' }}
    >
      <Group gap="sm" wrap="nowrap">
        <Avatar src={otherUser?.profilePic?.currentUrl || null} size={40} radius="xl" style={{ flexShrink: 0 }} />
        <Box style={{ flex: 1, minWidth: 0 }}>
          <Group gap={4} justify="space-between" wrap="nowrap">
            <Text size="sm" fw={unread > 0 ? 700 : 500} truncate style={{ flex: 1, minWidth: 0 }}>
              {otherUser?.displayName || '…'}
            </Text>
            <Group gap={2} style={{ flexShrink: 0 }}>
              {chat.lastAt && !hovered && <Text size="xs" c="dimmed">{timeAgo(chat.lastAt)}</Text>}
              {hovered && (
                <Tooltip label="Hide" openDelay={400}>
                  <ActionIcon size="xs" variant="subtle" color="gray"
                    onClick={e => { e.stopPropagation(); onHide(); }}>
                    <X size={12} />
                  </ActionIcon>
                </Tooltip>
              )}
            </Group>
          </Group>
          <Group gap={4} justify="space-between" wrap="nowrap" mt={2}>
            <Box style={{ flex: 1, minWidth: 0 }}>
              {listingTitle && (
                <Text size="xs" c="dimmed" truncate style={{ fontStyle: 'italic' }}>
                  Re: {listingTitle}
                </Text>
              )}
              <Text size="xs" c="dimmed" truncate>{chat.lastMessage || 'No messages yet'}</Text>
            </Box>
            {unread > 0 && (
              <Badge size="xs" color="red" circle style={{ flexShrink: 0 }}>{unread > 9 ? '9+' : unread}</Badge>
            )}
          </Group>
        </Box>
      </Group>
    </Box>
  );
}

// ── Group Conversation Item ──────────────────────────────────────────
function GroupConversationItem({ chat, currentUserId, isSelected, onClick }) {
  const [groupData, setGroupData] = React.useState(null);
  const [hovered, setHovered]     = React.useState(false);
  const isDark = useComputedColorScheme('light') === 'dark';

  const unread = chat.unread?.[currentUserId] || 0;

  React.useEffect(() => {
    if (!chat.groupId) return;
    getDoc(doc(db, 'groups', chat.groupId)).then(s => { if (s.exists()) setGroupData({ id: s.id, ...s.data() }); }).catch(() => {});
  }, [chat.groupId]);

  const selectedBg = isDark ? 'rgba(165,180,252,0.08)' : 'var(--mantine-color-gray-1)';
  const hoverBg    = isDark ? 'rgba(255,255,255,0.04)' : 'var(--mantine-color-gray-0)';
  const bg         = isSelected ? selectedBg : hovered ? hoverBg : 'transparent';

  return (
    <Box
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ padding: '10px 12px', cursor: 'pointer', borderRadius: 8, background: bg, transition: 'background 0.1s ease' }}
    >
      <Group gap="sm" wrap="nowrap">
        <Avatar
          src={groupData?.avatarURL || null} size={40} radius="xl"
          style={{ flexShrink: 0, background: 'var(--mantine-color-indigo-6)' }}
        >
          <Users size={18} color="white" />
        </Avatar>
        <Box style={{ flex: 1, minWidth: 0 }}>
          <Group gap={4} justify="space-between" wrap="nowrap">
            <Text size="sm" fw={unread > 0 ? 700 : 500} truncate style={{ flex: 1, minWidth: 0 }}>
              {groupData?.name || 'Group'}
            </Text>
            {chat.lastAt && <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>{timeAgo(chat.lastAt)}</Text>}
          </Group>
          <Group gap={4} justify="space-between" wrap="nowrap" mt={2}>
            <Text size="xs" c="dimmed" truncate style={{ flex: 1, minWidth: 0 }}>
              {chat.lastMessage || 'No messages yet'}
            </Text>
            {unread > 0 && (
              <Badge size="xs" color="red" circle style={{ flexShrink: 0 }}>{unread > 9 ? '9+' : unread}</Badge>
            )}
          </Group>
        </Box>
      </Group>
    </Box>
  );
}

// ── Main InboxPage ───────────────────────────────────────────────────
export default function InboxPage() {
  const { chatId: selectedChatId } = useParams();
  const navigate    = useNavigate();
  const currentUser = auth.currentUser;
  const isMobile    = useMediaQuery('(max-width: 768px)');

  const [chats, setChats]         = React.useState([]);
  const [loadingChats, setLoading] = React.useState(true);
  const [newChatOpen, setNewChat]  = React.useState(false);
  const [activeTab, setActiveTab]  = React.useState('dms');

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

  // Auto-select tab based on selected chatId
  React.useEffect(() => {
    if (!selectedChatId) return;
    if (selectedChatId.startsWith('inquiry_')) setActiveTab('inquiries');
    else if (selectedChatId.startsWith('group_')) setActiveTab('groups');
    else setActiveTab('dms');
  }, [selectedChatId]);

  async function hideChat(chatId) {
    try {
      await updateDoc(doc(db, 'chats', chatId), { hiddenBy: arrayUnion(currentUser.uid) });
    } catch (err) {
      console.error('Failed to hide chat:', err);
    }
  }

  if (!currentUser) {
    return (
      <Box style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100dvh - 112px)' }}>
        <Text c="dimmed">Sign in to view your inbox.</Text>
      </Box>
    );
  }

  const visibleChats = chats.filter(c => !(c.hiddenBy ?? []).includes(currentUser.uid));

  // Partition chats by type
  const dmChats      = visibleChats.filter(c => !c.type || c.type === 'dm');
  const inquiryChats = visibleChats.filter(c => c.type === 'inquiry');
  const groupChats   = visibleChats.filter(c => c.type === 'group');

  const totalUnreadDms      = dmChats.reduce((sum, c) => sum + (c.unread?.[currentUser.uid] || 0), 0);
  const totalUnreadInquiries = inquiryChats.reduce((sum, c) => sum + (c.unread?.[currentUser.uid] || 0), 0);
  const totalUnreadGroups   = groupChats.reduce((sum, c) => sum + (c.unread?.[currentUser.uid] || 0), 0);

  // On mobile: show sidebar when no chat selected, show chat when one is selected
  const showSidebar = !isMobile || !selectedChatId;
  const showChat    = !isMobile || !!selectedChatId;

  function renderConversationList() {
    if (loadingChats) {
      return (
        <Box p="md" style={{ display: 'flex', justifyContent: 'center' }}>
          <Loader color="gray" size="sm" />
        </Box>
      );
    }

    if (activeTab === 'dms') {
      if (dmChats.length === 0) return (
        <Box p="md">
          <Text size="sm" c="dimmed" ta="center">No direct messages yet.</Text>
          <Text size="xs" c="dimmed" ta="center" mt={4}>Use the compose button to start one.</Text>
        </Box>
      );
      return (
        <Stack gap={2} p="xs">
          {dmChats.map(chat => (
            <DmConversationItem
              key={chat.id}
              chat={chat}
              currentUserId={currentUser.uid}
              isSelected={chat.id === selectedChatId}
              onClick={() => navigate(`/inbox/${chat.id}`)}
              onHide={() => hideChat(chat.id)}
            />
          ))}
        </Stack>
      );
    }

    if (activeTab === 'inquiries') {
      if (inquiryChats.length === 0) return (
        <Box p="md">
          <Text size="sm" c="dimmed" ta="center">No inquiry threads yet.</Text>
          <Text size="xs" c="dimmed" ta="center" mt={4}>Inquiries appear when someone messages about a listing.</Text>
        </Box>
      );
      return (
        <Stack gap={2} p="xs">
          {inquiryChats.map(chat => (
            <InquiryConversationItem
              key={chat.id}
              chat={chat}
              currentUserId={currentUser.uid}
              isSelected={chat.id === selectedChatId}
              onClick={() => navigate(`/inbox/${chat.id}`)}
              onHide={() => hideChat(chat.id)}
            />
          ))}
        </Stack>
      );
    }

    if (activeTab === 'groups') {
      if (groupChats.length === 0) return (
        <Box p="md">
          <Text size="sm" c="dimmed" ta="center">No group chats yet.</Text>
          <Text size="xs" c="dimmed" ta="center" mt={4}>Create or join a group to get started.</Text>
        </Box>
      );
      return (
        <Stack gap={2} p="xs">
          {groupChats.map(chat => (
            <GroupConversationItem
              key={chat.id}
              chat={chat}
              currentUserId={currentUser.uid}
              isSelected={chat.id === selectedChatId}
              onClick={() => navigate(`/inbox/${chat.id}`)}
            />
          ))}
        </Stack>
      );
    }
  }

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
          {/* Header */}
          <Group px="md" py="sm" style={{ borderBottom: sidebarBorder, flexShrink: 0 }}>
            <Text fw={600} size="sm" style={{ flex: 1 }}>Inbox</Text>
            <ActionIcon variant="subtle" color="gray" size="sm" onClick={() => setNewChat(true)} aria-label="New conversation">
              <Edit size={14} />
            </ActionIcon>
          </Group>

          {/* Tabs */}
          <Tabs value={activeTab} onChange={setActiveTab} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            <Tabs.List style={{ flexShrink: 0, borderBottom: sidebarBorder, padding: '0 8px' }}>
              <Tabs.Tab
                value="dms"
                leftSection={<MessageSquare size={13} />}
                rightSection={totalUnreadDms > 0 ? <Badge size="xs" color="red" circle>{totalUnreadDms > 9 ? '9+' : totalUnreadDms}</Badge> : null}
              >
                Messages
              </Tabs.Tab>
              <Tabs.Tab
                value="inquiries"
                leftSection={<Tag size={13} />}
                rightSection={totalUnreadInquiries > 0 ? <Badge size="xs" color="red" circle>{totalUnreadInquiries > 9 ? '9+' : totalUnreadInquiries}</Badge> : null}
              >
                Inquiries
              </Tabs.Tab>
              <Tabs.Tab
                value="groups"
                leftSection={<Users size={13} />}
                rightSection={totalUnreadGroups > 0 ? <Badge size="xs" color="red" circle>{totalUnreadGroups > 9 ? '9+' : totalUnreadGroups}</Badge> : null}
              >
                Groups
              </Tabs.Tab>
            </Tabs.List>

            <ScrollArea style={{ flex: 1 }}>
              {renderConversationList()}
            </ScrollArea>
          </Tabs>
        </Box>
      )}

      {/* ── Chat panel ── */}
      {showChat && (
        <Box style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <ChatView chatId={selectedChatId} showBackButton={isMobile} />
        </Box>
      )}

      <NewChatModal opened={newChatOpen} onClose={() => setNewChat(false)} currentUserId={currentUser.uid} />
    </Box>
  );
}
