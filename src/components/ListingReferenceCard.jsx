import React, { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Paper, Group, Image, Text, Stack, Box, Skeleton, Button } from '@mantine/core';
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';

/**
 * Compact listing card for use inside chat messages.
 * Props: listingId (string)
 */
export default function ListingReferenceCard({ listingId }) {
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!listingId) return;
    getDoc(doc(db, 'listings', listingId))
      .then(snap => { if (snap.exists()) setListing({ id: snap.id, ...snap.data() }); })
      .finally(() => setLoading(false));
  }, [listingId]);

  if (loading) {
    return (
      <Paper withBorder radius="md" p="sm" style={{ width: '100%', maxWidth: 280 }}>
        <Skeleton height={12} mb={6} radius="sm" />
        <Skeleton height={10} width="60%" radius="sm" />
      </Paper>
    );
  }

  if (!listing) {
    return (
      <Paper withBorder radius="md" p="sm" style={{ width: '100%', maxWidth: 280 }}>
        <Text size="xs" c="dimmed">Listing not found</Text>
      </Paper>
    );
  }

  const price = listing.price ? `$${parseFloat(listing.price).toFixed(2)}` : null;
  const typeClass  = listing.type === 'service' ? 'banner-service' : 'banner-class';
  const modalClass = listing.online ? 'banner-online' : 'banner-offline';

  const badgeBase = {
    display: 'inline-flex', alignItems: 'center',
    padding: '2px 7px', borderRadius: 5,
    fontSize: 11, fontWeight: 600,
    textTransform: 'capitalize',
  };

  return (
    <Paper withBorder radius="md" style={{ width: 280, overflow: 'hidden' }}>
      {listing.thumbnailURL && (
        <Image
          src={listing.thumbnailURL}
          height={110}
          alt="Listing thumbnail"
          style={{ objectFit: 'cover', display: 'block' }}
        />
      )}
      <Stack gap="xs" p="sm">
        <Group gap={4}>
          {listing.type && (
            <Box className={typeClass} style={badgeBase}>{listing.type}</Box>
          )}
          <Box className={modalClass} style={badgeBase}>
            {listing.online ? 'Online' : 'In-Person'}
          </Box>
        </Group>
        <Text size="sm" fw={600} lineClamp={2} style={{ lineHeight: 1.3 }}>
          {listing.title || 'Untitled'}
        </Text>
        {price && <Text size="sm" fw={700}>{price}</Text>}
        <Button
          component={Link}
          to={`/listing/${listingId}`}
          variant="default"
          size="xs"
          fullWidth
          rightSection={<ExternalLink size={12} />}
        >
          View listing
        </Button>
      </Stack>
    </Paper>
  );
}
