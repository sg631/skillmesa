import React from 'react';
import { Title, Text, Stack } from '@mantine/core';
import { LinkButton } from '../components/LinkElements.jsx';

function NotFoundPage() {
  return (
    <Stack align="center" gap="md" py="xl">
      <title>uh-oh! 404 | skillmesa</title>
      <Title order={1} style={{ fontSize: '4rem' }}>Uh-oh!</Title>
      <Title order={2}>404: Page Not Found</Title>
      <Text size="lg">We couldn't find the page you were looking for.</Text>
      <LinkButton to="/home">Go Back</LinkButton>
    </Stack>
  );
}

export default NotFoundPage;
