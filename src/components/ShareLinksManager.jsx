import React, { useState, useEffect } from 'react';
import {
  Stack, Group, Text, TextInput, Button, Paper, Badge, Box,
  ActionIcon, Divider, Loader, Tooltip, Progress,
} from '@mantine/core';
import { Link2, Copy, Trash2, Check, X, ExternalLink } from 'lucide-react';
import {
  collection, query, where, onSnapshot, doc, getDoc, setDoc,
  deleteDoc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

const BASE_URL = `${window.location.origin}/s/`;

const ALIAS_RE = /^[a-z0-9][a-z0-9\-_]{1,48}[a-z0-9]$|^[a-z0-9]{2}$/;

const SOURCE_COLORS = {
  direct:    'gray',
  facebook:  'blue',
  instagram: 'pink',
  twitter:   'cyan',
  whatsapp:  'green',
  reddit:    'orange',
  tiktok:    'dark',
  youtube:   'red',
  google:    'violet',
  linkedin:  'indigo',
  other:     'gray',
};

function sourceColor(key) {
  return SOURCE_COLORS[key] ?? 'gray';
}

function SourceBreakdown({ sources, total }) {
  if (!sources || total === 0) return null;

  const sorted = Object.entries(sources)
    .filter(([, n]) => n > 0)
    .sort(([, a], [, b]) => b - a);

  if (sorted.length === 0) return null;

  return (
    <Stack gap={4} mt={4}>
      {sorted.map(([source, count]) => (
        <Box key={source}>
          <Group justify="space-between" mb={2}>
            <Badge size="xs" color={sourceColor(source)} variant="light" tt="capitalize">
              {source}
            </Badge>
            <Text size="xs" c="dimmed">{count} ({Math.round(count / total * 100)}%)</Text>
          </Group>
          <Progress
            value={(count / total) * 100}
            size="xs"
            color={sourceColor(source)}
            radius="xl"
          />
        </Box>
      ))}
    </Stack>
  );
}

function AliasCard({ link, onDelete, onCopy }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(BASE_URL + link.alias).catch(() => {});
    setCopied(true);
    onCopy?.();
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Paper withBorder radius="md" p="sm">
      <Group justify="space-between" wrap="nowrap" mb={4}>
        <Text size="sm" fw={500} truncate style={{ fontFamily: 'monospace' }}>
          /s/{link.alias}
        </Text>
        <Group gap={4} style={{ flexShrink: 0 }}>
          <Tooltip label={copied ? 'Copied!' : 'Copy link'}>
            <ActionIcon variant="subtle" color="gray" size="sm" onClick={handleCopy}>
              {copied ? <Check size={13} /> : <Copy size={13} />}
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Open link">
            <ActionIcon
              variant="subtle" color="gray" size="sm"
              component="a" href={BASE_URL + link.alias} target="_blank" rel="noopener noreferrer"
            >
              <ExternalLink size={13} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Delete alias">
            <ActionIcon variant="subtle" color="red" size="sm" onClick={() => onDelete(link.alias)}>
              <Trash2 size={13} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>

      <Text size="xs" c="dimmed" mb={2}>
        {link.totalClicks ?? 0} click{link.totalClicks !== 1 ? 's' : ''}
        {link.lastClickAt?.toDate && (
          <> · last {link.lastClickAt.toDate().toLocaleDateString()}</>
        )}
      </Text>

      <SourceBreakdown sources={link.sources} total={link.totalClicks ?? 0} />
    </Paper>
  );
}

export default function ShareLinksManager({ listingId, currentUserId }) {
  const [links, setLinks]         = useState([]);
  const [loadingLinks, setLoading] = useState(true);
  const [alias, setAlias]         = useState('');
  const [availability, setAvail]  = useState(null); // null | 'checking' | 'available' | 'taken' | 'invalid'
  const [creating, setCreating]   = useState(false);

  // Live list of aliases for this listing
  useEffect(() => {
    const q = query(collection(db, 'shareLinks'), where('listingId', '==', listingId));
    return onSnapshot(q, snap => {
      setLinks(snap.docs.map(d => d.data()).sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0)));
      setLoading(false);
    }, () => setLoading(false));
  }, [listingId]);

  // Debounced availability check
  useEffect(() => {
    const trimmed = alias.trim();
    if (!trimmed) { setAvail(null); return; }
    if (!ALIAS_RE.test(trimmed)) { setAvail('invalid'); return; }

    setAvail('checking');
    const timer = setTimeout(async () => {
      try {
        const snap = await getDoc(doc(db, 'shareLinks', trimmed));
        setAvail(snap.exists() ? 'taken' : 'available');
      } catch {
        setAvail(null);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [alias]);

  function handleAliasInput(value) {
    // auto-lowercase, replace spaces with hyphens
    setAlias(value.toLowerCase().replace(/\s+/g, '-'));
  }

  async function createAlias() {
    const trimmed = alias.trim();
    if (!trimmed || availability !== 'available' || creating) return;
    setCreating(true);
    try {
      await setDoc(doc(db, 'shareLinks', trimmed), {
        alias:       trimmed,
        listingId,
        createdBy:   currentUserId,
        createdAt:   serverTimestamp(),
        totalClicks: 0,
        sources:     {},
        lastClickAt: null,
      });
      setAlias('');
      setAvail(null);
    } catch (err) {
      console.error('Failed to create alias:', err);
    } finally {
      setCreating(false);
    }
  }

  async function deleteAlias(aliasKey) {
    if (!window.confirm(`Delete alias "${aliasKey}"? This cannot be undone.`)) return;
    try {
      await deleteDoc(doc(db, 'shareLinks', aliasKey));
    } catch (err) {
      console.error('Failed to delete alias:', err);
    }
  }

  const availIcon = {
    checking:  <Loader size={12} color="gray" />,
    available: <Check size={13} color="var(--mantine-color-green-6)" />,
    taken:     <X size={13} color="var(--mantine-color-red-6)" />,
    invalid:   <X size={13} color="var(--mantine-color-red-6)" />,
  }[availability] ?? null;

  const availText = {
    checking:  'Checking…',
    available: 'Available',
    taken:     'Already taken',
    invalid:   'Use lowercase letters, numbers, hyphens, underscores (min 3 chars)',
  }[availability] ?? null;

  const availColor = {
    available: 'green',
    taken:     'red',
    invalid:   'red',
  }[availability] ?? 'dimmed';

  return (
    <Stack gap="md">
      <Group gap="xs">
        <Link2 size={15} />
        <Text size="sm" fw={600}>Share Links</Text>
      </Group>

      <Text size="xs" c="dimmed">
        Create memorable aliases for this listing. Each link tracks click counts and traffic sources.
      </Text>

      {/* Creator */}
      <Paper withBorder radius="md" p="sm">
        <Stack gap="xs">
          <Text size="xs" c="dimmed" fw={500}>New alias</Text>
          <Group gap="xs" wrap="nowrap">
            <Text size="xs" c="dimmed" style={{ flexShrink: 0, fontFamily: 'monospace' }}>
              {window.location.host}/s/
            </Text>
            <TextInput
              style={{ flex: 1 }}
              size="xs"
              placeholder="my-cool-class"
              value={alias}
              onChange={e => handleAliasInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') createAlias(); }}
              rightSection={availIcon}
              styles={{ input: { fontFamily: 'monospace' } }}
            />
            <Button
              size="xs"
              disabled={availability !== 'available'}
              loading={creating}
              onClick={createAlias}
              style={{ flexShrink: 0 }}
            >
              Create
            </Button>
          </Group>
          {availText && (
            <Text size="xs" c={availColor}>{availText}</Text>
          )}
        </Stack>
      </Paper>

      {/* Existing links */}
      {loadingLinks ? (
        <Loader size="xs" color="gray" mx="auto" />
      ) : links.length === 0 ? (
        <Text size="xs" c="dimmed" ta="center" py="xs">No aliases yet.</Text>
      ) : (
        <Stack gap="sm">
          {links.map(link => (
            <AliasCard
              key={link.alias}
              link={link}
              onDelete={deleteAlias}
            />
          ))}
        </Stack>
      )}
    </Stack>
  );
}
