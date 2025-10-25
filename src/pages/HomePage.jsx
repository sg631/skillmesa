import React from 'react';
import { LinkButton } from '../components/LinkElements.jsx';
import ListingsPanel from '../components/ListingsPanel.jsx';
import { auth, db } from '../firebase';
import { collection, query, where } from 'firebase/firestore';

const listingsCollection = collection(db, "listings");

function HomePage() {
  const user = auth.currentUser;

  if (!user) {
    return (
      <>
        <title>home | skillmesa</title>
        <h1>Your listings</h1>
        <LinkButton to="/create" className="textcenter">Create new</LinkButton>
        <p>Please sign in to view your listings.</p>
      </>
    );
  }

  const userListingsQuery = query(listingsCollection, where("owner", "==", user.uid));

  return (
    <>
      <title>home | skillmesa</title>
      <h1>Your listings</h1>
      <LinkButton to="/create" className="textcenter">Create new</LinkButton>
      <ListingsPanel
        query={userListingsQuery}
        size={20}
        emptyMessage="You have no listings yet."
      />
    </>
  );
}

export default HomePage;
