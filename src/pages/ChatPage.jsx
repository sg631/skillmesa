import React from 'react';
import { useParams } from 'react-router-dom';
import { Box } from '@mantine/core';
import ChatView from '../components/ChatView';

export default function ChatPage() {
  const { otherUID } = useParams();
  return (
    <Box style={{ height: 'calc(100dvh - 112px)' }}>
      <ChatView otherUID={otherUID} showBackButton />
    </Box>
  );
}
