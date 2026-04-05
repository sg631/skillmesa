import React, { useState, useEffect } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Highlight } from "react-instantsearch";
import { Link } from "react-router-dom";
import { Card, Image, Text, Badge, Group, Stack, Avatar, Button, Box } from "@mantine/core";

const bannerBase = {
  flex: 1,
  padding: '7px 12px',
  textAlign: 'center',
  fontSize: 13,
  fontWeight: 600,
  textTransform: 'capitalize',
  letterSpacing: '0.01em',
};

function AlgoliaHit({ hit }) {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setCurrentUser(u));
    return () => unsubscribe();
  }, []);

  const isOwner = Boolean(currentUser && hit.owner && currentUser.uid === hit.owner);
  const tags   = hit.tags || [];
  const online = hit.online;

  const typeClass  = hit.type === "service" ? "banner-service" : "banner-class";
  const modalClass = online ? "banner-online" : "banner-offline";

  return (
    <Card
      className="listing-card"
      style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      {/* Top banners */}
      <Card.Section>
        <Box style={{ display: 'flex' }}>
          <Box
            className={typeClass}
            style={{ ...bannerBase, borderRight: '1px solid rgba(128,128,128,0.15)' }}
          >
            {hit.type || '—'}
          </Box>
          <Box className={modalClass} style={bannerBase}>
            {online ? 'Online' : 'In-Person'}
          </Box>
        </Box>
        {hit.zipCode && (
          <Box
            className="banner-zip"
            style={{
              padding: '3px 12px',
              textAlign: 'center',
              fontSize: 12,
              fontWeight: 500,
              borderBottom: '1px solid rgba(128,128,128,0.10)',
            }}
          >
            {hit.zipCode}
          </Box>
        )}
      </Card.Section>

      {/* Thumbnail */}
      <Card.Section>
        <Image
          src={hit.thumbnailURL || null}
          h={{ base: 150, sm: 180 }}
          alt="Listing thumbnail"
          fallbackSrc="https://placehold.co/400x180/f4f4f5/a1a1aa?text=No+Image"
        />
      </Card.Section>

      {/* Content */}
      <Stack gap="xs" p="md" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Text fw={600} size="md" lineClamp={2}>
          <Highlight attribute="title" hit={hit} />
        </Text>

        <Text size="sm" c="dimmed" lineClamp={3} style={{ flex: 1 }}>
          <Highlight attribute="description" hit={hit} />
        </Text>

        <Box>
          {tags.length > 0 && (
            <Group gap={4} wrap="wrap">
              {tags.slice(0, 5).map((tag, i) => (
                <Badge key={i} variant="light" size="xs" color="gray">{tag}</Badge>
              ))}
            </Group>
          )}
        </Box>

        <Stack gap="xs" mt="auto" pt="xs" style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}>
          <Group
            gap="xs"
            style={{ cursor: "pointer" }}
            onClick={() => (window.location = "/profile/" + hit.owner)}
          >
            <Avatar src={hit.ownerProfilePicUrl || null} size={24} radius="xl" />
            <Text size="xs" c="dimmed" truncate>
              {hit.ownerDisplayName || "Unknown"}
            </Text>
          </Group>

          <Group gap="xs">
            <Button component={Link} to={`/listing/${hit.objectID}`} variant="default" size="xs" style={{ flex: 1 }}>
              View
            </Button>
            {isOwner && (
              <Button component={Link} to={`/manage/${hit.objectID}`} variant="default" size="xs">
                Manage
              </Button>
            )}
          </Group>
        </Stack>
      </Stack>
    </Card>
  );
}

export default AlgoliaHit;
