import React, { useEffect, useState } from "react";
import ListingComponent from "./ListingComponent.jsx";
import { getDocs } from "firebase/firestore";

function ListingsPanel({
  query,
  size = 5,               // number of listings per page
  maxResults = null,       // optional: limit total number of results
  paginated = true,        // whether to paginate or show all at once
  className = "listings-panel",
  emptyMessage = "No listings found."
}) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

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
        const querySnapshot = await getDocs(query);
        let fetchedListings = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        if (maxResults) {
          fetchedListings = fetchedListings.slice(0, maxResults);
        }

        if (isMounted) {
          setListings(fetchedListings);
          setLoading(false);
          setCurrentPage(1); // reset pagination
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
  }, [query, maxResults]);

  if (loading) return <p>Loading listings...</p>;
  if (listings.length === 0) return <p>{emptyMessage}</p>;

  // Pagination calculation
  const totalPages = Math.ceil(listings.length / size);
  const startIndex = (currentPage - 1) * size;
  const endIndex = startIndex + size;
  const currentListings = paginated ? listings.slice(startIndex, endIndex) : listings.slice(0, maxResults || listings.length);

  const handlePrevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const handleNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));

  return (
    <div className={className}>
      {currentListings.map(listing => (
        <ListingComponent key={listing.id} id={listing.id} {...listing} />
      ))}

      {paginated && totalPages > 1 && (
        <div className="pagination-controls" style={{ marginTop: "1em" }}>
          <button onClick={handlePrevPage} disabled={currentPage === 1}>
            Prev
          </button>
          <span style={{ margin: "0 0.5em" }}>
            Page {currentPage} of {totalPages}
          </span>
          <button onClick={handleNextPage} disabled={currentPage === totalPages}>
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default ListingsPanel;
