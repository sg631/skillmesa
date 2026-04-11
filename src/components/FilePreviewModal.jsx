import React, { useState, useEffect } from 'react';
import { Modal, Box, Text, Group, Stack, ScrollArea, Loader, Button } from '@mantine/core';
import { FileText, FileImage, File, FileAudio, FileVideo, Download } from 'lucide-react';

export function previewKind(mimeType = '') {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.includes('pdf'))      return 'pdf';
  if (mimeType.startsWith('text/'))  return 'text';
  return null;
}

export function formatBytes(b = 0) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileIcon({ mimeType = '', size = 15 }) {
  if (mimeType.startsWith('image/'))  return <FileImage size={size} />;
  if (mimeType.startsWith('video/'))  return <FileVideo size={size} />;
  if (mimeType.startsWith('audio/'))  return <FileAudio size={size} />;
  if (mimeType.includes('pdf') || mimeType.startsWith('text/')) return <FileText size={size} />;
  return <File size={size} />;
}

export default function FilePreviewModal({ file, onClose }) {
  const [textContent, setTextContent] = useState(null);
  const [textLoading, setTextLoading] = useState(false);
  const [textError, setTextError]     = useState(false);

  const kind = file ? previewKind(file.mimeType) : null;

  useEffect(() => {
    if (!file || kind !== 'text') return;
    setTextContent(null);
    setTextError(false);
    setTextLoading(true);
    fetch(file.url)
      .then(r => { if (!r.ok) throw new Error('fetch failed'); return r.text(); })
      .then(t => setTextContent(t))
      .catch(() => setTextError(true))
      .finally(() => setTextLoading(false));
  }, [file?.url]); // eslint-disable-line react-hooks/exhaustive-deps

  function renderContent() {
    if (!file) return null;
    switch (kind) {
      case 'image':
        return (
          <Box style={{ display: 'flex', justifyContent: 'center', background: 'var(--mantine-color-dark-7)' }}>
            <img src={file.url} alt={file.name} style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain', display: 'block' }} />
          </Box>
        );
      case 'video':
        return (
          <Box style={{ background: '#000', display: 'flex', justifyContent: 'center' }}>
            <video src={file.url} controls autoPlay={false} style={{ maxWidth: '100%', maxHeight: '75vh', display: 'block' }} />
          </Box>
        );
      case 'audio':
        return (
          <Box p="lg">
            <audio src={file.url} controls style={{ width: '100%' }} />
          </Box>
        );
      case 'pdf':
        return (
          <Box style={{ height: '78vh', position: 'relative' }}>
            <iframe src={file.url} title={file.name} style={{ width: '100%', height: '100%', border: 'none', display: 'block' }} />
            <Text size="xs" c="dimmed" ta="center" pt="xs">
              If the PDF doesn't load,{' '}
              <Text component="a" href={file.url} target="_blank" rel="noopener noreferrer" size="xs" c="cyan">open it directly</Text>.
            </Text>
          </Box>
        );
      case 'text':
        if (textLoading) return <Group justify="center" py="xl"><Loader size="sm" color="gray" /></Group>;
        if (textError)   return <Text size="sm" c="dimmed" ta="center" py="xl">Could not load file preview.</Text>;
        return (
          <ScrollArea style={{ maxHeight: '72vh' }} offsetScrollbars>
            <Box p="md" style={{ background: 'var(--mantine-color-dark-8)', borderRadius: 4 }}>
              <pre style={{ margin: 0, fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontFamily: 'monospace', color: 'var(--mantine-color-gray-3)' }}>
                {textContent}
              </pre>
            </Box>
          </ScrollArea>
        );
      default:
        return (
          <Stack align="center" py="xl" gap="md">
            <FileIcon mimeType={file.mimeType} size={48} />
            <Text size="sm" c="dimmed">No preview available for this file type.</Text>
          </Stack>
        );
    }
  }

  const modalSize = kind === 'audio' ? 'md' : kind === 'pdf' ? '90%' : 'xl';

  return (
    <Modal
      opened={!!file}
      onClose={onClose}
      title={
        <Group gap="xs" wrap="nowrap" style={{ minWidth: 0 }}>
          <Box c="dimmed" style={{ flexShrink: 0, display: 'flex' }}>
            <FileIcon mimeType={file?.mimeType} size={14} />
          </Box>
          <Text size="sm" fw={500} truncate title={file?.name}>{file?.name}</Text>
          {file?.size != null && <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>{formatBytes(file.size)}</Text>}
        </Group>
      }
      size={modalSize}
      padding={0}
      styles={{ header: { padding: 'var(--mantine-spacing-md)' }, body: { padding: 0 } }}
      centered
    >
      {renderContent()}
      <Group px="md" py="sm" justify="flex-end" style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}>
        <Button component="a" href={file?.url} target="_blank" rel="noopener noreferrer" variant="default" size="xs" leftSection={<Download size={13} />}>
          Download
        </Button>
      </Group>
    </Modal>
  );
}
