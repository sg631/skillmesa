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
  const [loading, setLoading]   = useState(true);
  const [pageCursors, setPageCursors] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastDoc, setLastDoc]         = useState(null);
  const [hasNextPage, setHasNextPage] = useState(false);

  const fetchGenRef = useRef(0);

  async function fetchPage(afterDoc = null, generation = 0) {
    if (!query) return;
    setLoading(true);
    try {
      let q = query;
      if (paginated) {
        // Fetch size+1 so we can detect a next page without loading an empty one
        const fetchLimit = size + 1;
        q = afterDoc
          ? makeQuery(query, startAfter(afterDoc), limit(fetchLimit))
          : makeQuery(query, limit(fetchLimit));
      }

      const snap = await getDocs(q);
      if (generation !== fetchGenRef.current) return;

      const allDocs     = snap.docs;
      const hasMore     = allDocs.length > size;
      const displayDocs = hasMore ? allDocs.slice(0, size) : allDocs;

      setHasNextPage(hasMore);
      setListings(displayDocs.map(d => ({ id: d.id, ...d.data() })));
      // Cursor sits at the last *displayed* doc, not the lookahead one
      setLastDoc(displayDocs[displayDocs.length - 1] ?? null);
    } catch (err) {
      if (generation !== fetchGenRef.current) return;
      console.error("Error fetching listings:", err);
      setListings([]);
      setHasNextPage(false);
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

  async function handleNextPage(e) {
    e.preventDefault();
    if (!lastDoc || !hasNextPage) return;
    const gen = ++fetchGenRef.current;
    setPageCursors(prev => [...prev, lastDoc]);
    setCurrentPage(prev => prev + 1);
    await fetchPage(lastDoc, gen);
  }

  async function handlePrevPage(e) {
    e.preventDefault();
    if (currentPage <= 1) return;
    const gen = ++fetchGenRef.current;
    const prevCursors = pageCursors.slice(0, -1);
    const prevCursor  = prevCursors[prevCursors.length - 1] ?? null;
    setPageCursors(prevCursors);
    setCurrentPage(prev => prev - 1);
    await fetchPage(prevCursor, gen);
  }

  const showPagination = paginated && (currentPage > 1 || hasNextPage);

  if (loading) {
    return (
      <Group justify="center" py="xl">
        <Loader color="gray" />
        <Text c="dimmed">Loading listings...</Text>
      </Group>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      {listings.length === 0 ? (
        <Text ta="center" c="dimmed" py="xl">{emptyMessage}</Text>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
          {listings.map(listing => (
            <ListingComponent key={listing.id} id={listing.id} />
          ))}
        </SimpleGrid>
      )}

      {showPagination && (
        <Group justify="center" gap="sm" mt="md">
          <Button variant="default" size="sm" onClick={handlePrevPage} disabled={currentPage === 1}>
            <ChevronLeft size={16} />
          </Button>
          <Text size="sm" fw={500}>Page {currentPage}</Text>
          <Button variant="default" size="sm" onClick={handleNextPage} disabled={!hasNextPage}>
            <ChevronRight size={16} />
          </Button>
        </Group>
      )}
    </div>
  );
}

export default ListingsPanel;
