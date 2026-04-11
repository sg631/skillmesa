import React from 'react';
import { Title, Text, Stack, Box } from '@mantine/core';
import { LinkButton } from '../components/LinkElements.jsx';
import CarouselElement from '../components/CarouselElement.jsx';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from "../firebase";
import useSEO from '../hooks/useSEO';

function StartingPage() {
  const [user, setUser] = React.useState(null);
  const [checkedAuth, setCheckedAuth] = React.useState(false);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setCheckedAuth(true);
    });
    return () => unsubscribe();
  }, []);

  const getStartedLink = checkedAuth ? (user ? "/home" : "/signon") : "/signon";

  useSEO({ path: '/' });

  return (
    <Box
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1rem',
      }}
      mih={{ base: 0, sm: 'calc(100vh - 112px)' }}
    >
      <Stack align="center" gap="lg" maw={640} ta="center" style={{ width: '100%' }}>
        <Text size="xs" fw={600} tt="uppercase" c="dimmed" style={{ letterSpacing: '0.08em' }}>
          Peer-to-peer skills marketplace
        </Text>

        <Stack align="center" gap="xs">
          <Title order={1} fz={{ base: '2rem', xs: '2.5rem', sm: '3.5rem' }} lh={1.15} fw={700}>
            Find skills in
          </Title>
          <CarouselElement>
            <li>
              <Title order={1} fz={{ base: '2rem', xs: '2.5rem', sm: '3.5rem' }} lh={1.15} fw={700} style={{
                background: 'linear-gradient(to right, #9866f0, #75e4f8)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                minWidth: '4ch',
              }}>coding</Title>
            </li>
            <li>
              <Title order={1} fz={{ base: '2rem', xs: '2.5rem', sm: '3.5rem' }} lh={1.15} fw={700} style={{
                background: 'linear-gradient(to right, #f96fad, #fcc361)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                minWidth: '4ch',
              }}>design</Title>
            </li>
            <li>
              <Title order={1} fz={{ base: '2rem', xs: '2.5rem', sm: '3.5rem' }} lh={1.15} fw={700} style={{
                background: 'linear-gradient(to right, #39e4ae, #73a1ec)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                minWidth: '4ch',
              }}>writing</Title>
            </li>
            <li>
              <Title order={1} fz={{ base: '2rem', xs: '2.5rem', sm: '3.5rem' }} lh={1.15} fw={700} style={{
                background: 'linear-gradient(to right, #ff8d50, #bf86f4)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                minWidth: '4ch',
              }}>music</Title>
            </li>
          </CarouselElement>
          <Title order={1} fz={{ base: '2rem', xs: '2.5rem', sm: '3.5rem' }} lh={1.15} fw={700}>
            and more
          </Title>
        </Stack>

        <Text size={{ base: 'md', sm: 'lg' }} c="dimmed" maw={480} px="sm">
          From babysitting to SAT prep, from lawn care to tutoring — connect with people in your community.
        </Text>

        <LinkButton to={getStartedLink} size="md" variant="filled">
          Get started
        </LinkButton>
      </Stack>
    </Box>
  );
}

export default StartingPage;
