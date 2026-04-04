import React from 'react';
import { Title, Stack, Text } from '@mantine/core';
import { LinkButton } from '../components/LinkElements.jsx';
import ListingsPanel from '../components/ListingsPanel.jsx';
import { auth, db } from '../firebase';
import { collection, query, where } from 'firebase/firestore';

const listingsCollection = collection(db, "listings");

function HomePage() {
  const user = auth.currentUser;

  if (!user) {
    return (
      <Stack align="center" gap="md" py="xl">
        <title>home | skillmesa</title>
        <Title order={1}>Your listings</Title>
        <LinkButton to="/create">Create new</LinkButton>
        <Text c="dimmed">Please sign in to view your listings.</Text>
      </Stack>
    );
  }

  const userListingsQuery = query(listingsCollection, where("owner", "==", user.uid));

  return (
    <Stack align="center" gap="md" py="xl">
      <title>home | skillmesa</title>
      <Title order={1}>Your listings</Title>
      <LinkButton to="/create">Create new</LinkButton>
      <ListingsPanel
        query={userListingsQuery}
        size={5}
        paginated={true}
        emptyMessage="You have no listings yet."
      />
    </Stack>
  );
}

export default HomePage;
