import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  collection, doc, getDoc, getDocs, addDoc, setDoc, updateDoc,
  query, orderBy, onSnapshot, serverTimestamp, increment, where,
  arrayUnion, arrayRemove,
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import {
  Box, Stack, Group, Text, Avatar, Textarea, Button, ActionIcon,
  Paper, ScrollArea, Divider, Loader, Modal, Tooltip, Menu,
  useComputedColorScheme,
} from '@mantine/core';
import { ArrowLeft, Send, Paperclip, MoreVertical, ShieldOff, Shield, Check, X, Clock, ExternalLink } from 'lucide-react';
import ListingReferenceCard from './ListingReferenceCard';

const LISTING_URL_RE = /https?:\/\/skill-mesa\.web\.app\/listing\/([a-zA-Z0-9]+)/;
// Matches any http/https URL; trailing punctuation trimmed below
const ANY_URL_RE = /https?:\/\/[^\s]+/g;

// Split text into {type:'text'}, {type:'listing', listingId}, {type:'link', url} parts
function parseMessageParts(text) {
  const parts = [];
  let lastIndex = 0;
  const re = new RegExp(ANY_URL_RE.source, 'g');
  let match;
  while ((match = re.exec(text)) !== null) {
    const raw = match[0].replace(/[.,!?;:)>\]]+$/, ''); // strip trailing punctuation
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }
    const listingMatch = raw.match(LISTING_URL_RE);
    if (listingMatch) {
      parts.push({ type: 'listing', url: raw, listingId: listingMatch[1] });
    } else {
      parts.push({ type: 'link', url: raw });
    }
    lastIndex = match.index + raw.length;
  }
  if (lastIndex < text.length) parts.push({ type: 'text', content: text.slice(lastIndex) });
  return parts.length ? parts : [{ type: 'text', content: text }];
}

function LinkPreview({ url }) {
  const isDark = useComputedColorScheme('light') === 'dark';
  let domain = url;
  try { domain = new URL(url).hostname.replace(/^www\./, ''); } catch {}

  const cardBg = isDark ? 'var(--mantine-color-dark-5)' : 'var(--mantine-color-gray-0)';

  return (
    <Paper withBorder radius="md" p="xs" style={{ background: cardBg, minWidth: 180 }}>
      <Text size="xs" c="dimmed" truncate mb={6}>{domain}</Text>
      <Button
        component="a" href={url} target="_blank" rel="noopener noreferrer"
        size="xs" variant="default" leftSection={<ExternalLink size={11} />}
      >
        Open link
      </Button>
    </Paper>
  );
}

// Renders inline text with clickable URL anchors (no card previews — handled in MessageBubble)
function MessageContent({ parts }) {
  const inlineParts = parts.filter(p => p.type !== 'listing');
  const hasText = inlineParts.some(p => p.type === 'link' || p.content?.trim());
  if (!hasText) return null;
  return (
    <Text size="sm" component="div" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
      {inlineParts.map((part, i) =>
        part.type === 'text' ? (
          <span key={i}>{part.content}</span>
        ) : (
          <a key={i} href={part.url} target="_blank" rel="noopener noreferrer"
            style={{ color: 'var(--accent-hex)', textDecoration: 'underline', wordBreak: 'break-all' }}>
            {part.url}
          </a>
        )
      )}
    </Text>
  );
}

function formatTime(ts) {
  if (!ts?.toDate) return '';
  return ts.toDate().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function formatDateLabel(ts) {
  if (!ts?.toDate) return null;
  const d = ts.toDate();
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function DateDivider({ label }) {
  return (
    <Group gap="xs" my="xs">
      <Divider style={{ flex: 1 }} />
      <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>{label}</Text>
      <Divider style={{ flex: 1 }} />
    </Group>
  );
}

function MessageBubble({ msg, isOwn }) {
  const isDark = useComputedColorScheme('light') === 'dark';
  const ownBg    = isDark ? 'rgba(165,180,252,0.14)' : 'var(--mantine-color-dark-8)';
  const ownColor = isDark ? 'var(--accent-hex)' : '#ffffff';
  const otherBg  = isDark ? 'var(--mantine-color-dark-5)' : 'var(--mantine-color-gray-1)';

  // Explicitly-shared listing (via picker)
  if (msg.type === 'listing') {
    return (
      <Box style={{ display: 'flex', justifyContent: isOwn ? 'flex-end' : 'flex-start' }}>
        <Box>
          <ListingReferenceCard listingId={msg.listingId} />
          <Text size="xs" c="dimmed" ta={isOwn ? 'right' : 'left'} mt={2}>{formatTime(msg.sentAt)}</Text>
        </Box>
      </Box>
    );
  }

  const parts        = parseMessageParts(msg.text || '');
  const listingParts = parts.filter(p => p.type === 'listing');
  const linkParts    = parts.filter(p => p.type === 'link');
  const hasText      = parts.some(p => p.type === 'link' || (p.type === 'text' && p.content?.trim()));

  return (
    <Box style={{ display: 'flex', justifyContent: isOwn ? 'flex-end' : 'flex-start' }}>
      <Box style={{
        maxWidth: 'min(72%, 480px)', display: 'flex', flexDirection: 'column',
        alignItems: isOwn ? 'flex-end' : 'flex-start', gap: 4,
      }}>
        {/* Text bubble */}
        {hasText && (
          <Paper px="sm" py="xs" radius="md" style={{ background: isOwn ? ownBg : otherBg, color: isOwn ? ownColor : 'inherit' }}>
            <MessageContent parts={parts} />
          </Paper>
        )}
        {/* Listing cards embedded in text */}
        {listingParts.map((p, i) => <ListingReferenceCard key={`l-${i}`} listingId={p.listingId} />)}
        {/* Link previews */}
        {linkParts.map((p, i) => <LinkPreview key={`p-${i}`} url={p.url} />)}
        <Text size="xs" c="dimmed" ta={isOwn ? 'right' : 'left'}>{formatTime(msg.sentAt)}</Text>
      </Box>
    </Box>
  );
}

// ChatView — renders the full chat UI for a given otherUID.
// showBackButton: show ← arrow in header (for standalone ChatPage)
export default function ChatView({ otherUID, showBackButton = false }) {
  const navigate    = useNavigate();
  const currentUser = auth.currentUser;

  const [otherUser, setOtherUser]             = useState(null);
  const [currentUserData, setCurrentUserData] = useState(null);
  const [chatData, setChatData]               = useState(undefined);
  const [messages, setMessages]               = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [messageText, setMessageText]         = useState('');
  const [sending, setSending]                 = useState(false);
  const [pickerOpen, setPickerOpen]           = useState(false);
  const [pickerListings, setPickerListings]   = useState([]);
  const [actionLoading, setActionLoading]     = useState(false);

  const viewportRef = useRef(null);
  const textareaRef = useRef(null);

  const chatId = currentUser && otherUID
    ? [currentUser.uid, otherUID].sort().join('_')
    : null;

  const blockedBy        = chatData?.blockedBy ?? [];
  const isBlockedByMe    = blockedBy.includes(currentUser?.uid);
  const isBlocked        = blockedBy.length > 0;
  const isPendingRequest = chatData?.status === 'pending' && chatData?.initiatedBy !== currentUser?.uid;
  const isWaitingReply   = chatData?.status === 'pending' && chatData?.initiatedBy === currentUser?.uid;
  const isDeclined       = chatData?.status === 'declined';
  const canSend          = !isBlocked && !isPendingRequest && !isDeclined && chatData !== undefined;

  // Reset per conversation
  useEffect(() => {
    setMessages([]);
    setLoading(true);
    setChatData(undefined);
    setOtherUser(null);
    setMessageText('');
  }, [otherUID]);

  useEffect(() => {
    if (!otherUID) return;
    Promise.all([
      getDoc(doc(db, 'users', otherUID)),
      currentUser ? getDoc(doc(db, 'users', currentUser.uid)) : null,
    ]).then(([otherSnap, selfSnap]) => {
      if (otherSnap.exists()) setOtherUser(otherSnap.data());
      if (selfSnap?.exists()) setCurrentUserData(selfSnap.data());
    }).catch(console.error);
  }, [otherUID]);

  useEffect(() => {
    if (!chatId) { setChatData(null); return; }
    return onSnapshot(doc(db, 'chats', chatId), snap => {
      setChatData(snap.exists() ? snap.data() : null);
    }, () => setChatData(null));
  }, [chatId]);

  useEffect(() => {
    if (!chatId) { setLoading(false); return; }
    const q = query(collection(db, 'chats', chatId, 'messages'), orderBy('sentAt'));
    return onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
      setTimeout(() => {
        if (viewportRef.current) viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
      }, 50);
    }, () => setLoading(false));
  }, [chatId]);

  useEffect(() => {
    if (!chatId || !currentUser) return;
    updateDoc(doc(db, 'chats', chatId), { [`unread.${currentUser.uid}`]: 0 }).catch(() => {});
  }, [chatId]);

  async function acceptRequest() {
    setActionLoading(true);
    try { await updateDoc(doc(db, 'chats', chatId), { status: 'active' }); }
    catch (err) { console.error(err); }
    finally { setActionLoading(false); }
  }

  async function declineRequest() {
    setActionLoading(true);
    try { await updateDoc(doc(db, 'chats', chatId), { status: 'declined' }); }
    catch (err) { console.error(err); }
    finally { setActionLoading(false); navigate(-1); }
  }

  async function blockUser() {
    setActionLoading(true);
    try { await updateDoc(doc(db, 'chats', chatId), { blockedBy: arrayUnion(currentUser.uid) }); }
    catch (err) { console.error(err); }
    finally { setActionLoading(false); }
  }

  async function unblockUser() {
    setActionLoading(true);
    try { await updateDoc(doc(db, 'chats', chatId), { blockedBy: arrayRemove(currentUser.uid) }); }
    catch (err) { console.error(err); }
    finally { setActionLoading(false); }
  }

  async function sendMessage(type = 'text', listingId = null) {
    if (!currentUser || !chatId || !canSend) return;
    const text = messageText.trim();
    if (type === 'text' && !text) return;
    setSending(true);
    setMessageText('');
    try {
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        senderId: currentUser.uid, type, sentAt: serverTimestamp(),
        ...(type === 'text' ? { text } : {}),
        ...(type === 'listing' ? { listingId } : {}),
      });
      const preview = type === 'listing' ? '📎 Shared a listing' : text.slice(0, 100);
      await setDoc(doc(db, 'chats', chatId), {
        participants: [currentUser.uid, otherUID].sort(),
        lastMessage: preview, lastAt: serverTimestamp(),
        [`unread.${otherUID}`]: increment(1),
      }, { merge: true });
      const senderName = currentUserData?.displayName || 'Someone';
      const notifMsg = type === 'listing'
        ? `${senderName} shared a listing with you`
        : `${senderName}: ${text.slice(0, 60)}${text.length > 60 ? '…' : ''}`;
      await addDoc(collection(db, 'notifications', otherUID, 'items'), {
        type: 'message', message: notifMsg, read: false,
        createdAt: serverTimestamp(), link: `/inbox/${currentUser.uid}`,
      });
    } catch (err) {
      console.error('Failed to send:', err);
      if (type === 'text') setMessageText(text);
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  }

  async function openPicker() {
    if (!currentUser) return;
    try {
      const snap = await getDocs(query(collection(db, 'listings'), where('owner', '==', currentUser.uid)));
      setPickerListings(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) { console.error(err); }
    setPickerOpen(true);
  }

  if (!currentUser) return <Text ta="center" py="xl" c="dimmed">Sign in to chat.</Text>;
  if (!otherUID) return (
    <Box style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Text c="dimmed" size="sm">Select a conversation to start messaging.</Text>
    </Box>
  );

  const items = [];
  let lastLabel = null;
  for (const msg of messages) {
    const label = formatDateLabel(msg.sentAt);
    if (label && label !== lastLabel) { items.push({ _divider: true, label, key: `d-${msg.id}` }); lastLabel = label; }
    items.push(msg);
  }

  return (
    <Box style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* ── Header ── */}
      <Box style={{
        flexShrink: 0, padding: '10px 16px',
        borderBottom: '1px solid var(--mantine-color-default-border)',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        {showBackButton && (
          <ActionIcon variant="subtle" color="gray" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} />
          </ActionIcon>
        )}
        <Avatar
          src={otherUser?.profilePic?.currentUrl || null} size={36} radius="xl"
          style={{ cursor: 'pointer', flexShrink: 0 }}
          onClick={() => navigate(`/profile/${otherUID}`)}
        />
        <Box style={{ flex: 1, minWidth: 0 }}>
          <Text fw={600} size="sm" truncate>{otherUser?.displayName || '…'}</Text>
          {otherUser?.username && <Text size="xs" c="dimmed" truncate>@{otherUser.username}</Text>}
        </Box>
        <Menu shadow="md" position="bottom-end">
          <Menu.Target>
            <ActionIcon variant="subtle" color="gray" loading={actionLoading}>
              <MoreVertical size={16} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            {isBlockedByMe ? (
              <Menu.Item leftSection={<Shield size={14} />} onClick={unblockUser}>
                Unblock {otherUser?.displayName || 'user'}
              </Menu.Item>
            ) : (
              <Menu.Item color="red" leftSection={<ShieldOff size={14} />} onClick={blockUser}>
                Block {otherUser?.displayName || 'user'}
              </Menu.Item>
            )}
          </Menu.Dropdown>
        </Menu>
      </Box>

      {/* ── Status banners ── */}
      {isPendingRequest && (
        <Box style={{ flexShrink: 0, padding: '10px 16px', borderBottom: '1px solid var(--mantine-color-default-border)', background: 'var(--mantine-color-default-hover)' }}>
          <Group justify="space-between" wrap="nowrap">
            <Box style={{ minWidth: 0 }}>
              <Text size="sm" fw={500}>{otherUser?.displayName || 'Someone'} wants to start a conversation</Text>
              <Text size="xs" c="dimmed">Read their messages below before deciding.</Text>
            </Box>
            <Group gap="xs" style={{ flexShrink: 0 }}>
              <Button size="xs" variant="default" leftSection={<X size={12} />} onClick={declineRequest} loading={actionLoading}>Decline</Button>
              <Button size="xs" leftSection={<Check size={12} />} onClick={acceptRequest} loading={actionLoading}>Accept</Button>
            </Group>
          </Group>
        </Box>
      )}
      {isWaitingReply && (
        <Box style={{ flexShrink: 0, padding: '8px 16px', borderBottom: '1px solid var(--mantine-color-default-border)', background: 'var(--mantine-color-default-hover)' }}>
          <Group gap="xs"><Clock size={13} style={{ opacity: 0.5 }} /><Text size="xs" c="dimmed">Your message request is waiting for acceptance.</Text></Group>
        </Box>
      )}
      {isBlocked && (
        <Box style={{ flexShrink: 0, padding: '8px 16px', borderBottom: '1px solid var(--mantine-color-default-border)', background: 'var(--mantine-color-default-hover)' }}>
          <Group gap="xs" justify="space-between">
            <Group gap="xs">
              <ShieldOff size={13} style={{ opacity: 0.5 }} />
              <Text size="xs" c="dimmed">{isBlockedByMe ? `You have blocked ${otherUser?.displayName || 'this user'}.` : 'This conversation has been restricted.'}</Text>
            </Group>
            {isBlockedByMe && <Button size="xs" variant="subtle" onClick={unblockUser} loading={actionLoading}>Unblock</Button>}
          </Group>
        </Box>
      )}
      {isDeclined && (
        <Box style={{ flexShrink: 0, padding: '8px 16px', borderBottom: '1px solid var(--mantine-color-default-border)', background: 'var(--mantine-color-default-hover)' }}>
          <Group gap="xs"><X size={13} style={{ opacity: 0.5 }} /><Text size="xs" c="dimmed">This message request was declined.</Text></Group>
        </Box>
      )}

      {/* ── Messages ── */}
      <ScrollArea style={{ flex: 1 }} viewportRef={viewportRef}>
        <Stack gap={4} p="md">
          {loading ? (
            <Box style={{ display: 'flex', justifyContent: 'center' }} py="xl"><Loader color="gray" size="sm" /></Box>
          ) : items.length === 0 ? (
            <Text size="sm" c="dimmed" ta="center" py="xl">
              {isPendingRequest ? 'No messages in this request yet.' : 'No messages yet. Say hello!'}
            </Text>
          ) : (
            items.map(item =>
              item._divider
                ? <DateDivider key={item.key} label={item.label} />
                : <MessageBubble key={item.id} msg={item} isOwn={item.senderId === currentUser.uid} />
            )
          )}
        </Stack>
      </ScrollArea>

      {/* ── Input ── */}
      <Box style={{ flexShrink: 0, borderTop: '1px solid var(--mantine-color-default-border)', padding: '10px 16px' }}>
        {isPendingRequest ? (
          <Text size="xs" c="dimmed" ta="center" py="xs">Accept this request to reply.</Text>
        ) : isDeclined ? (
          <Text size="xs" c="dimmed" ta="center" py="xs">This request was declined.</Text>
        ) : isBlocked ? (
          <Text size="xs" c="dimmed" ta="center" py="xs">Messaging is disabled in this conversation.</Text>
        ) : (
          <Group gap="xs" align="flex-end">
            <Textarea
              ref={textareaRef} style={{ flex: 1 }}
              placeholder="Message… (Shift+Enter for new line)"
              value={messageText} onChange={e => setMessageText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              autosize minRows={1} maxRows={5} size="sm"
            />
            <Tooltip label="Share a listing">
              <ActionIcon variant="default" size="lg" onClick={openPicker} style={{ flexShrink: 0 }}>
                <Paperclip size={15} />
              </ActionIcon>
            </Tooltip>
            <Button size="sm" leftSection={<Send size={13} />} onClick={() => sendMessage()} loading={sending} disabled={!messageText.trim()} style={{ flexShrink: 0 }}>
              Send
            </Button>
          </Group>
        )}
      </Box>

      {/* ── Listing picker ── */}
      <Modal opened={pickerOpen} onClose={() => setPickerOpen(false)} title="Share a listing" size="sm">
        {pickerListings.length === 0 ? (
          <Text size="sm" c="dimmed" ta="center" py="md">You have no listings to share.</Text>
        ) : (
          <Stack gap="xs">
            {pickerListings.map(listing => (
              <Paper key={listing.id} withBorder p="sm" radius="md" style={{ cursor: 'pointer' }}
                onClick={() => { setPickerOpen(false); sendMessage('listing', listing.id); }}>
                <Group gap="sm" wrap="nowrap">
                  {listing.thumbnailURL && (
                    <img src={listing.thumbnailURL} alt="" style={{ width: 44, height: 44, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
                  )}
                  <Box style={{ flex: 1, minWidth: 0 }}>
                    <Text size="sm" fw={500} truncate>{listing.title}</Text>
                    <Text size="xs" c="dimmed" tt="capitalize">{listing.type} · {listing.online ? 'Online' : 'In-Person'}</Text>
                  </Box>
                </Group>
              </Paper>
            ))}
          </Stack>
        )}
      </Modal>
    </Box>
  );
}
