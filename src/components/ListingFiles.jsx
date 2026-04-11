import React, { useState, useEffect, useRef } from 'react';
import {
  Stack, Group, Text, Button, Progress, ActionIcon, Tooltip,
  Badge, Select, Box, Paper, Loader, Modal, ScrollArea,
} from '@mantine/core';
import {
  Globe, Lock, ShieldCheck,
  Upload, Trash2, Download, Eye,
} from 'lucide-react';
import {
  collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, serverTimestamp, updateDoc,
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage, auth } from '../firebase';
import FilePreviewModal, { previewKind, formatBytes, FileIcon } from './FilePreviewModal';

// ── Privacy tier definitions ─────────────────────────────────────────
const PRIVACY = [
  { value: 'public',   label: 'Public',   Icon: Globe,        color: 'green',  desc: 'Anyone can download' },
  { value: 'enroll',   label: 'Enrolled', Icon: Lock,         color: 'blue',   desc: 'Enrolled users only' },
  { value: 'managers', label: 'Managers', Icon: ShieldCheck,  color: 'orange', desc: 'Owner and editors only' },
];

function privacyMeta(value) {
  return PRIVACY.find(p => p.value === value) ?? PRIVACY[0];
}

function canAccess(file, user, ownerId, editors, isEnrolled = false) {
  if (file.privacy === 'public') return true;
  if (!user) return false;
  if (user.uid === ownerId || editors.includes(user.uid)) return true;
  if (file.privacy === 'enroll') return isEnrolled;
  return false;
}

// ── Main component ───────────────────────────────────────────────────
export default function ListingFiles({ listingId, ownerId, editors = [], editorMode = false, isEnrolled = false }) {
  const user  = auth.currentUser;
  const isMgr = Boolean(user && (user.uid === ownerId || editors.includes(user.uid)));

  const [files, setFiles]                   = useState([]);
  const [loading, setLoading]               = useState(true);
  const [uploading, setUploading]           = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadName, setUploadName]         = useState('');
  const [previewFile, setPreviewFile]       = useState(null);
  const fileInputRef = useRef(null);

  async function loadFiles() {
    setLoading(true);
    try {
      const snap = await getDocs(
        query(collection(db, 'listings', listingId, 'files'), orderBy('uploadedAt', 'desc'))
      );
      setFiles(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error('loadFiles:', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadFiles(); }, [listingId]);

  async function handleUpload(file) {
    if (!file || !user) return;
    setUploading(true);
    setUploadProgress(0);
    setUploadName(file.name);
    try {
      const path = `listings/${listingId}/files/${Date.now()}_${file.name}`;
      const task = uploadBytesResumable(ref(storage, path), file);
      await new Promise((resolve, reject) => {
        task.on(
          'state_changed',
          snap => setUploadProgress(Math.round(snap.bytesTransferred / snap.totalBytes * 100)),
          reject,
          resolve,
        );
      });
      const url = await getDownloadURL(ref(storage, path));
      await addDoc(collection(db, 'listings', listingId, 'files'), {
        name:        file.name,
        url,
        storagePath: path,
        size:        file.size,
        mimeType:    file.type,
        privacy:     'managers',
        uploadedBy:  user.uid,
        uploadedAt:  serverTimestamp(),
      });
      await loadFiles();
    } catch (e) {
      console.error('handleUpload:', e);
    } finally {
      setUploading(false);
      setUploadName('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleDelete(file) {
    try {
      await deleteDoc(doc(db, 'listings', listingId, 'files', file.id));
      if (file.storagePath) {
        await deleteObject(ref(storage, file.storagePath)).catch(() => {});
      }
      setFiles(prev => prev.filter(f => f.id !== file.id));
    } catch (e) {
      console.error('handleDelete:', e);
    }
  }

  async function handlePrivacyChange(fileId, privacy) {
    try {
      await updateDoc(doc(db, 'listings', listingId, 'files', fileId), { privacy });
      setFiles(prev => prev.map(f => f.id === fileId ? { ...f, privacy } : f));
    } catch (e) {
      console.error('handlePrivacyChange:', e);
    }
  }

  const visibleFiles = editorMode
    ? files
    : files.filter(f => canAccess(f, user, ownerId, editors, isEnrolled));

  if (loading) {
    return <Group justify="center" py="lg"><Loader color="gray" size="sm" /></Group>;
  }

  return (
    <>
      <Stack gap="md">
        {/* Upload controls — editor mode only */}
        {editorMode && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              style={{ display: 'none' }}
              onChange={e => handleUpload(e.target.files?.[0])}
            />
            {uploading ? (
              <Stack gap={6}>
                <Text size="xs" c="dimmed" truncate>Uploading {uploadName}…</Text>
                <Progress value={uploadProgress} size="sm" radius="xl" animated />
              </Stack>
            ) : (
              <Button
                variant="default"
                size="xs"
                leftSection={<Upload size={13} />}
                onClick={() => fileInputRef.current?.click()}
                w="fit-content"
              >
                Upload file
              </Button>
            )}
            {/* Privacy legend */}
            <Group gap="xs" wrap="wrap">
              {PRIVACY.map(p => (
                <Group key={p.value} gap={4} align="center">
                  <Badge size="xs" color={p.color} variant="light" leftSection={<p.Icon size={9} />}>
                    {p.label}
                  </Badge>
                  <Text size="xs" c="dimmed">{p.desc}</Text>
                </Group>
              ))}
            </Group>
          </>
        )}

        {/* File list */}
        {visibleFiles.length === 0 ? (
          <Text size="sm" c="dimmed" ta="center" py="lg">
            {editorMode ? 'No files yet — upload one above.' : 'No files available.'}
          </Text>
        ) : (
          <Stack gap="xs">
            {visibleFiles.map(file => {
              const meta       = privacyMeta(file.privacy);
              const accessible = canAccess(file, user, ownerId, editors, isEnrolled);
              const kind       = previewKind(file.mimeType);
              const canPreview = accessible && kind !== null;

              return (
                <Paper
                  key={file.id}
                  withBorder
                  radius="md"
                  p="sm"
                  style={!editorMode && canPreview ? { cursor: 'pointer' } : undefined}
                  onClick={!editorMode && canPreview ? () => setPreviewFile(file) : undefined}
                >
                  <Group gap="sm" wrap="nowrap" justify="space-between">
                    <Group gap="xs" wrap="nowrap" style={{ minWidth: 0, flex: 1 }}>
                      <Box c="dimmed" style={{ flexShrink: 0, display: 'flex' }}>
                        <FileIcon mimeType={file.mimeType} />
                      </Box>
                      <Box style={{ minWidth: 0 }}>
                        <Text size="sm" fw={500} truncate title={file.name}>
                          {file.name}
                        </Text>
                        <Group gap="xs" mt={2}>
                          <Text size="xs" c="dimmed">{formatBytes(file.size)}</Text>
                          {editorMode ? (
                            <Select
                              size="xs"
                              value={file.privacy}
                              onChange={v => v && handlePrivacyChange(file.id, v)}
                              data={PRIVACY.map(p => ({ value: p.value, label: p.label }))}
                              styles={{ input: { fontSize: 11, height: 22, minHeight: 22, paddingTop: 0, paddingBottom: 0 } }}
                              w={106}
                              withCheckIcon={false}
                              allowDeselect={false}
                              onClick={e => e.stopPropagation()}
                            />
                          ) : (
                            <Badge
                              size="xs"
                              color={meta.color}
                              variant="light"
                              leftSection={<meta.Icon size={9} />}
                            >
                              {meta.label}
                            </Badge>
                          )}
                        </Group>
                      </Box>
                    </Group>

                    <Group gap={4} style={{ flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                      {accessible ? (
                        canPreview ? (
                          <Tooltip label="Preview" withArrow>
                            <ActionIcon
                              variant="subtle"
                              color="gray"
                              size="sm"
                              onClick={() => setPreviewFile(file)}
                            >
                              <Eye size={13} />
                            </ActionIcon>
                          </Tooltip>
                        ) : (
                          <Tooltip label="Download" withArrow>
                            <ActionIcon
                              variant="subtle"
                              color="gray"
                              size="sm"
                              component="a"
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Download size={13} />
                            </ActionIcon>
                          </Tooltip>
                        )
                      ) : (
                        <Tooltip label="Requires enrollment" withArrow>
                          <ActionIcon variant="subtle" color="gray" size="sm" disabled>
                            <Lock size={13} />
                          </ActionIcon>
                        </Tooltip>
                      )}
                      {editorMode && (
                        <Tooltip label="Delete file" withArrow>
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            size="sm"
                            onClick={() => handleDelete(file)}
                          >
                            <Trash2 size={13} />
                          </ActionIcon>
                        </Tooltip>
                      )}
                    </Group>
                  </Group>
                </Paper>
              );
            })}
          </Stack>
        )}
      </Stack>

      {/* Preview modal */}
      <FilePreviewModal
        file={previewFile}
        onClose={() => setPreviewFile(null)}
      />
    </>
  );
}
