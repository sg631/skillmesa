import React, { useEffect, useState } from 'react';
import { LinkButton } from '../components/LinkElements.jsx';
import ListingComponent from '../components/ListingComponent.jsx';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const listingsCollection = collection(db, "listings");

function HomePage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchUserListings() {
      if (!auth.currentUser) {
        setListings([]);
        setLoading(false);
        return;
      }

      const q = query(listingsCollection, where("owner", "==", auth.currentUser.uid));
      const querySnapshot = await getDocs(q);
      const userListings = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (isMounted) {
        setListings(userListings);
        setLoading(false);
      }
    }

    fetchUserListings();

    return () => { isMounted = false; };
  }, []);

  return (
    <>
      <title>home | skillmesa</title>
      <h1>Your listings</h1>
      <LinkButton to="/profile" className="textcenter">Create new</LinkButton>
      <br /><br />

      {loading ? (
        <p>Loading your listings...</p>
      ) : listings.length > 0 ? (
        listings.map(listing => (
          <ListingComponent key={listing.id} id={listing.id} {...listing} />
        ))
      ) : (
        <p>You have no listings yet.</p>
      )}
    </>
  );
}

export default HomePage;
