import React, { useEffect, useState, useRef } from "react";
import ListingComponent from "./ListingComponent.jsx";
import { getDocs, query as makeQuery, limit, startAfter } from "firebase/firestore";
import { Group, Button, Text, SimpleGrid, Loader } from "@mantine/core";
import { ChevronLeft, ChevronRight } from "lucide-react";

function ListingsPanel({
  query,
  size = 6,
  paginated = true,
  emptyMessage = "No listings found.",
}) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageCursors, setPageCursors] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasNextPage, setHasNextPage] = useState(false);

  const fetchGenRef = useRef(0);

  async function fetchPage(afterDoc = null, generation = 0) {
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
      if (generation !== fetchGenRef.current) return;
      const fetched = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setHasNextPage(snap.size === size);
      setListings(fetched);
      setLastDoc(snap.docs[snap.docs.length - 1] || null);
    } catch (err) {
      if (generation !== fetchGenRef.current) return;
      console.error("Error fetching listings:", err);
      setListings([]);
    } finally {
      if (generation === fetchGenRef.current) setLoading(false);
    }
  }

  useEffect(() => {
    if (!query) return;
    const gen = ++fetchGenRef.current;
    setPageCursors([]);
    setCurrentPage(1);
    fetchPage(null, gen);
  }, [query]);

  const handleNextPage = async (e) => {
    e.preventDefault();
    if (!lastDoc || !hasNextPage) return;
    const gen = ++fetchGenRef.current;
    setPageCursors((prev) => [...prev, lastDoc]);
    setCurrentPage((prev) => prev + 1);
    await fetchPage(lastDoc, gen);
  };

  const handlePrevPage = async (e) => {
    e.preventDefault();
    if (currentPage <= 1) return;
    const gen = ++fetchGenRef.current;
    const prevCursors = [...pageCursors];
    prevCursors.pop();
    const prevCursor = prevCursors[prevCursors.length - 1] || null;
    setPageCursors(prevCursors);
    setCurrentPage((prev) => prev - 1);
    await fetchPage(prevCursor, gen);
  };

  if (loading) {
    return (
      <Group justify="center" py="xl">
        <Loader color="gray" />
        <Text c="dimmed">Loading listings...</Text>
      </Group>
    );
  }

  if (listings.length === 0) {
    return <Text ta="center" c="dimmed" py="xl">{emptyMessage}</Text>;
  }

  return (
    <div style={{ width: '100%' }}>
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
        {listings.map((listing) => (
          <ListingComponent key={listing.id} id={listing.id} />
        ))}
      </SimpleGrid>

      {paginated && (
        <Group justify="center" gap="sm" mt="md">
          <Button variant="default" onClick={handlePrevPage} disabled={currentPage === 1} size="sm">
            <ChevronLeft size={16} />
          </Button>
          <Text size="sm" fw={500}>Page {currentPage}</Text>
          <Button variant="default" onClick={handleNextPage} disabled={!hasNextPage} size="sm">
            <ChevronRight size={16} />
          </Button>
        </Group>
      )}
    </div>
  );
}

export default ListingsPanel;
