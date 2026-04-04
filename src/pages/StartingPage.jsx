import React from 'react';
import { Title, Text, Stack, Image, Space } from '@mantine/core';
import { LinkButton } from '../components/LinkElements.jsx';
import CarouselElement from '../components/CarouselElement.jsx';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from "../firebase";

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

  return (
    <Stack align="center" gap="lg" py="xl">
      <title>skillmesa</title>
      <Image src="/assets/logos/skillmesa-large.png" alt="Skillmesa Logo" w={465} h={110} fit="contain" />
      <Stack align="center" gap="xs" ta="center">
        <Text size="xl" fw={500}>
          Whether you're looking for opportunities, services, or knowledge in
        </Text>
        <CarouselElement>
          <li><Title order={1} fz="3rem">coding</Title></li>
          <li><Title order={1} fz="3rem">design</Title></li>
          <li><Title order={1} fz="3rem">writing</Title></li>
          <li><Title order={1} fz="3rem">music</Title></li>
        </CarouselElement>
        <Text>or more, Skillmesa is your platform to connect and thrive.</Text>
        <Space h="xl" />
        <Text size="xl" fw={500}>
          From babysitting to garden tending, and from homework help to SAT prep, we're here.
        </Text>
      </Stack>
      <LinkButton to={getStartedLink} size="lg">
        Get Started
      </LinkButton>
    </Stack>
  );
}

export default StartingPage;
