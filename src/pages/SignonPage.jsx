import React from 'react';
import { Center } from '@mantine/core';
import SignonComponent from '../components/SignonComponent.jsx';

function SignonPage() {
  return (
    <Center style={{ minHeight: '70vh' }}>
      <title>sign on | skillmesa</title>
      <SignonComponent width="400px" />
    </Center>
  );
}

export default SignonPage;
