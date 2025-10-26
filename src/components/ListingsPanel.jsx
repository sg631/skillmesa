import React, { useEffect, useState, useRef } from "react";
import ListingComponent from "./ListingComponent.jsx";
import { getDocs, query as makeQuery, limit, startAfter } from "firebase/firestore";

function ListingsPanel({
  query,
  size = 5,
  paginated = true,
  className = "listings-panel",
  emptyMessage = "No listings found.",
}) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageCursors, setPageCursors] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const scrollRef = useRef(null);

  async function fetchPage(afterDoc = null) {
    if (!query) return;

    setLoading(true);
    try {
      let q = query;
      if (paginated) {
        q = afterDoc
          ? makeQuery(query, startAfter(afterDoc), limit(size))
          : makeQuery(query, limit(size));
      }

      const snap = await getDocs(q);
      const fetched = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const last = snap.docs[snap.docs.length - 1] || null;

      setHasNextPage(snap.size === size);
      setListings(fetched);
      setLastDoc(last);
    } catch (err) {
      console.error("Error fetching paginated listings:", err);
      setListings([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (query) {
      setPageCursors([]);
      setCurrentPage(1);
      fetchPage(null);
    }
  }, [query]);

  const handleNextPage = async (e) => {
    e.preventDefault(); // ✅ prevent page jump
    if (!lastDoc || !hasNextPage) return;
    setPageCursors((prev) => [...prev, lastDoc]);
    setCurrentPage((prev) => prev + 1);
    await fetchPage(lastDoc);
  };

  const handlePrevPage = async (e) => {
    e.preventDefault(); // ✅ prevent page jump
    if (currentPage <= 1) return;
    const prevCursors = [...pageCursors];
    prevCursors.pop();
    const prevCursor = prevCursors[prevCursors.length - 1] || null;
    setPageCursors(prevCursors);
    setCurrentPage((prev) => prev - 1);
    await fetchPage(prevCursor);
  };

  if (loading) return <p>Loading listings...</p>;
  if (listings.length === 0) return <p>{emptyMessage}</p>;

  return (
    <div
      className="listings-panel-wrapper"
      style={{ height: "800px", overflow: "hidden", position: "relative" }}
    >
      <div className={className} style={{ height: "100%", position: "relative" }}>
        <div
          className="listings-scroll"
          ref={scrollRef}
          style={{
            display: "flex",
            flexDirection: "row",
            gap: "16px",
            overflowX: "auto",
            overflowY: "hidden",
            height: "100%",
            scrollBehavior: "smooth",
          }}
        >
          {listings.map((listing) => (
            <ListingComponent key={listing.id} id={listing.id} {...listing} />
          ))}
        </div>

        {paginated && (
          <div
            className="pagination-controls"
          >
            <button onClick={handlePrevPage} disabled={currentPage === 1}>
              ←
            </button>
            <span>Page {currentPage}</span>
            <button onClick={handleNextPage} disabled={!hasNextPage}>
              →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ListingsPanel;
