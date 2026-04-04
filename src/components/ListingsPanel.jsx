import React, { useEffect, useState, useRef } from "react";
import ListingComponent from "./ListingComponent.jsx";
import { getDocs, query as makeQuery, limit, startAfter } from "firebase/firestore";
import { Group, Button, Text, ScrollArea, Stack, Loader } from "@mantine/core";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
    e.preventDefault();
    if (!lastDoc || !hasNextPage) return;
    setPageCursors((prev) => [...prev, lastDoc]);
    setCurrentPage((prev) => prev + 1);
    await fetchPage(lastDoc);
  };

  const handlePrevPage = async (e) => {
    e.preventDefault();
    if (currentPage <= 1) return;
    const prevCursors = [...pageCursors];
    prevCursors.pop();
    const prevCursor = prevCursors[prevCursors.length - 1] || null;
    setPageCursors(prevCursors);
    setCurrentPage((prev) => prev - 1);
    await fetchPage(prevCursor);
  };

  if (loading) {
    return (
      <Group justify="center" py="xl">
        <Loader color="cyan" />
        <Text c="dimmed">Loading listings...</Text>
      </Group>
    );
  }

  if (listings.length === 0) {
    return <Text ta="center" c="dimmed" py="xl">{emptyMessage}</Text>;
  }

  return (
    <Stack gap="md" style={{ width: "100%" }}>
      <ScrollArea type="hover" offsetScrollbars scrollbarSize={8}>
        <Group gap="md" wrap="nowrap" align="flex-start" py="sm">
          {listings.map((listing) => (
            <ListingComponent key={listing.id} id={listing.id} {...listing} />
          ))}
        </Group>
      </ScrollArea>

      {paginated && (
        <Group justify="center" gap="sm">
          <Button
            variant="light"
            color="cyan"
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            size="sm"
          >
            <ChevronLeft size={16} />
          </Button>
          <Text size="sm" fw={500}>Page {currentPage}</Text>
          <Button
            variant="light"
            color="cyan"
            onClick={handleNextPage}
            disabled={!hasNextPage}
            size="sm"
          >
            <ChevronRight size={16} />
          </Button>
        </Group>
      )}
    </Stack>
  );
}

export default ListingsPanel;
