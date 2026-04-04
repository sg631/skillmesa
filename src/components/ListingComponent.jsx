import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDoc } from "firebase/firestore";
import { LinkButton } from "./LinkElements.jsx";
import { Card, Image, Text, Badge, Group, Stack, Avatar, Divider, ScrollArea } from "@mantine/core";

function ListingComponent({ id }) {
  const listings = collection(db, "listings");

  const [currentUser, setCurrentUser] = useState(null);
  const [title, setTitle] = useState("Loading...");
  const [description, setDescription] = useState("Loading...");
  const [ownerUID, setOwnerUID] = useState(null);
  const [ownerName, setOwnerName] = useState("Loading...");
  const [profilePicUrl, setProfilePicUrl] = useState("");
  const [tags, setTags] = useState([]);
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [type, setType] = useState("");
  const [online, setOnline] = useState("");
  const [zipCode, setZipCode] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setCurrentUser(u);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function fetchListing() {
      try {
        const listingDoc = doc(listings, id);
        const listingSnap = await getDoc(listingDoc);

        if (listingSnap.exists()) {
          const data = listingSnap.data();
          setTitle(data.title);
          setDescription(data.description);
          setTags(data.tags || []);
          setOwnerUID(data.owner || null);
          setThumbnailUrl(data.thumbnailURL || "");
          setType(data.type);
          setOnline(data.online);
          setZipCode(data.zipCode);
        } else {
          setTitle("Listing not found");
          setDescription("");
          setTags([]);
        }
      } catch (error) {
        console.error("Error fetching listing:", error);
      }
    }

    fetchListing();
  }, [id]);

  useEffect(() => {
    async function fetchOwnerData() {
      if (!ownerUID) return;
      try {
        const userDocRef = doc(db, "users", ownerUID);
        const userSnap = await getDoc(userDocRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          setOwnerName(userData.displayName || "Unnamed User");
          setProfilePicUrl(userData.profilePic?.currentUrl || "");
        } else {
          setOwnerName("Unknown User");
          setProfilePicUrl("");
        }
      } catch (error) {
        console.error("Error fetching owner data:", error);
      }
    }

    fetchOwnerData();
  }, [ownerUID]);

  const isOwner = Boolean(currentUser && ownerUID && currentUser.uid === ownerUID);

  return (
    <Card shadow="md" padding={0} radius="lg" withBorder style={{ width: 350, minHeight: 700, display: 'flex', flexDirection: 'column' }}>
      {/* Full-width stacked label banners with gaps */}
      <Card.Section>
        <Stack gap={5} p={5}>
          <Badge
            fullWidth
            radius={0}
            size="xl"
            color={type === "service" ? "yellow" : "cyan"}
            variant="light"
            styles={{ root: { fontWeight: 700, borderRadius: 'var(--mantine-radius-lg) var(--mantine-radius-lg) 0 0' } }}
          >
            {type}
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
          {zipCode && (
            <Badge fullWidth radius={0} size="lg" color="gray" variant="light">
              {zipCode}
            </Badge>
          )}
        </Stack>
      </Card.Section>

      <Divider />

      {/* Thumbnail with padding and rounded corners */}
      <Card.Section p="sm">
        <Image
          src={thumbnailUrl}
          height={200}
          radius="lg"
          alt="Listing thumbnail"
          fallbackSrc="https://placehold.co/350x200?text=No+Image"
        />
      </Card.Section>

      <Stack gap="xs" px="md" pb="md" style={{ flex: 1 }}>
        <Text fw={600} size="lg" ta="center" lineClamp={2} style={{ minHeight: 52 }}>
          {title}
        </Text>

        <Text size="sm" c="dimmed" lineClamp={3}>
          {description}
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
          onClick={() => window.location = "/profile/" + ownerUID}
        >
          <Avatar src={profilePicUrl || null} size="sm" radius="xl" />
          <Text size="sm" truncate style={{ maxWidth: 200 }}>{ownerName}</Text>
        </Group>

        <Divider />

        <Stack gap={6}>
          <LinkButton to={`/listing/${id}`} fullWidth variant="light" color="cyan">
            View Listing
          </LinkButton>
          <LinkButton disabled={!isOwner} to={`/manage/${id}`} fullWidth variant="subtle" color="gray">
            Manage Listing
          </LinkButton>
        </Stack>
      </Stack>
    </Card>
  );
}

export default ListingComponent;
