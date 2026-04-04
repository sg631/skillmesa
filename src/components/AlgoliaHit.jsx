import React, { useState, useEffect } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Highlight } from "react-instantsearch";
import { LinkButton } from "./LinkElements.jsx";
import { Card, Image, Text, Badge, Group, Stack, Avatar, Divider, ScrollArea } from "@mantine/core";

function AlgoliaHit({ hit }) {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setCurrentUser(u);
    });
    return () => unsubscribe();
  }, []);

  const isOwner = Boolean(currentUser && hit.owner && currentUser.uid === hit.owner);
  const tags = hit.tags || [];
  const online = hit.online;

  return (
    <Card shadow="md" padding={0} radius="lg" withBorder style={{ width: 350, minHeight: 700, display: 'flex', flexDirection: 'column' }}>
      {/* Full-width stacked label banners with gaps */}
      <Card.Section>
        <Stack gap={5} p={5}>
          <Badge
            fullWidth
            radius={0}
            size="xl"
            color={hit.type === "service" ? "yellow" : "cyan"}
            variant="light"
            styles={{ root: { fontWeight: 700, borderRadius: 'var(--mantine-radius-lg) var(--mantine-radius-lg) 0 0' } }}
          >
            {hit.type}
          </Badge>
          <Badge
            fullWidth
            radius={0}
            size="xl"
            color={online ? "violet" : "green"}
            variant="light"
            styles={{ root: { fontWeight: 700 } }}
          >
            {online ? "online" : "in-person"}
          </Badge>
          {hit.zipCode && (
            <Badge fullWidth radius={0} size="lg" color="gray" variant="light">
              {hit.zipCode}
            </Badge>
          )}
        </Stack>
      </Card.Section>

      <Divider />

      {/* Thumbnail with padding and rounded corners */}
      <Card.Section p="sm">
        <Image
          src={hit.thumbnailURL}
          height={200}
          radius="lg"
          alt="Listing thumbnail"
          fallbackSrc="https://placehold.co/350x200?text=No+Image"
        />
      </Card.Section>

      <Stack gap="xs" px="md" pb="md" style={{ flex: 1 }}>
        <Text fw={600} size="lg" ta="center" lineClamp={2} style={{ minHeight: 52 }}>
          <Highlight attribute="title" hit={hit} />
        </Text>

        <Text size="sm" c="dimmed" lineClamp={3}>
          <Highlight attribute="description" hit={hit} />
        </Text>

        <ScrollArea scrollbarSize={4} type="hover" offsetScrollbars>
          <Group gap={6} wrap="nowrap">
            {tags.map((tag, index) => (
              <Badge key={index} variant="light" color="gray" size="sm" style={{ flexShrink: 0 }}>
                {tag}
              </Badge>
            ))}
          </Group>
        </ScrollArea>

        <Divider />

        <Group
          gap="sm"
          style={{ cursor: "pointer" }}
          onClick={() => window.location = "/profile/" + hit.owner}
        >
          <Avatar src={hit.ownerProfilePicUrl || null} size="sm" radius="xl" />
          <Text size="sm" truncate style={{ maxWidth: 200 }}>{hit.ownerDisplayName || "Unknown"}</Text>
        </Group>

        <Divider />

        <Stack gap={6}>
          <LinkButton to={`/listing/${hit.objectID}`} fullWidth variant="light" color="cyan">
            View Listing
          </LinkButton>
          <LinkButton disabled={!isOwner} to={`/manage/${hit.objectID}`} fullWidth variant="subtle" color="gray">
            Manage Listing
          </LinkButton>
        </Stack>
      </Stack>
    </Card>
  );
}

export default AlgoliaHit;
