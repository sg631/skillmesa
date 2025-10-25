import React, { useEffect, useState } from "react";
import ListingComponent from "./ListingComponent.jsx";
import { getDocs } from "firebase/firestore"; // modular v9

function ListingsPanel({ query, size = 10, className = "listings-panel", emptyMessage = "No listings found." }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchListings() {
      if (!query) {
        if (isMounted) {
          setListings([]);
          setLoading(false);
        }
        return;
      }

      try {
        const querySnapshot = await getDocs(query); // ✅ v9 modular syntax
        const fetchedListings = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        if (isMounted) {
          setListings(fetchedListings);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching listings:", error);
        if (isMounted) {
          setListings([]);
          setLoading(false);
        }
      }
    }

    fetchListings();

    return () => { isMounted = false; };
  }, [query]);

  if (loading) return <p>Loading listings...</p>;
  if (listings.length === 0) return <p>{emptyMessage}</p>;

  return (
    <div className={className}>
      {listings.slice(0, size).map(listing => (
        <ListingComponent key={listing.id} id={listing.id} {...listing} />
      ))}
    </div>
  );
}

export default ListingsPanel;
