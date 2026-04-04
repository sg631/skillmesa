import React from 'react';
import { Title, Text, Stack } from '@mantine/core';
import { LinkButton } from '../components/LinkElements.jsx';

function ComingSoonPage() {
  return (
    <Stack align="center" gap="md" py="xl">
      <title>coming soon | skillmesa</title>
      <Title order={1} style={{ fontSize: '4rem' }}>Coming Soon</Title>
      <Text size="lg" fw={500}>Making things better..</Text>
      <Text size="sm" c="dimmed">This page is a work in progress (or in active development). Check again later.</Text>
      <LinkButton to="/home">Okay!</LinkButton>
    </Stack>
  );
}

export default ComingSoonPage;
