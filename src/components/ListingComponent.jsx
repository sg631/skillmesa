import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDoc } from "firebase/firestore";
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

function ListingComponent({ id }) {
  const listings = collection(db, "listings");

  const [currentUser, setCurrentUser] = useState(null);
  const [title, setTitle]             = useState("Loading...");
  const [description, setDescription] = useState("");
  const [ownerUID, setOwnerUID]       = useState(null);
  const [ownerName, setOwnerName]     = useState("Loading...");
  const [profilePicUrl, setProfilePicUrl] = useState("");
  const [tags, setTags]               = useState([]);
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [type, setType]               = useState("");
  const [online, setOnline]           = useState(null);
  const [zipCode, setZipCode]         = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setCurrentUser(u));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function fetchListing() {
      try {
        const snap = await getDoc(doc(listings, id));
        if (snap.exists()) {
          const data = snap.data();
          setTitle(data.title);
          setDescription(data.description || "");
          setTags(data.tags || []);
          setOwnerUID(data.owner || null);
          setThumbnailUrl(data.thumbnailURL || "");
          setType(data.type || "");
          setOnline(data.online);
          setZipCode(data.zipCode || "");
        } else {
          setTitle("Listing not found");
        }
      } catch (err) {
        console.error("Error fetching listing:", err);
      }
    }
    fetchListing();
  }, [id]);

  useEffect(() => {
    async function fetchOwner() {
      if (!ownerUID) return;
      try {
        const snap = await getDoc(doc(db, "users", ownerUID));
        if (snap.exists()) {
          const d = snap.data();
          setOwnerName(d.displayName || "Unnamed User");
          setProfilePicUrl(d.profilePic?.currentUrl || "");
        } else {
          setOwnerName("Unknown User");
        }
      } catch (err) {
        console.error("Error fetching owner:", err);
      }
    }
    fetchOwner();
  }, [ownerUID]);

  const isOwner = Boolean(currentUser && ownerUID && currentUser.uid === ownerUID);

  const typeClass  = type === "service" ? "banner-service" : "banner-class";
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
            {type || '—'}
          </Box>
          <Box className={modalClass} style={bannerBase}>
            {online === null ? '—' : online ? 'Online' : 'In-Person'}
          </Box>
        </Box>
        {zipCode && (
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
            {zipCode}
          </Box>
        )}
      </Card.Section>

      {/* Thumbnail */}
      <Card.Section>
        <Image
          src={thumbnailUrl || null}
          h={{ base: 150, sm: 180 }}
          alt="Listing thumbnail"
          fallbackSrc="https://placehold.co/400x180/f4f4f5/a1a1aa?text=No+Image"
        />
      </Card.Section>

      {/* Content */}
      <Stack gap="xs" p="md" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Text fw={600} size="md" lineClamp={2}>
          {title}
        </Text>

        <Text size="sm" c="dimmed" lineClamp={3} style={{ flex: 1 }}>
          {description || '\u00a0'}
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
            onClick={() => (window.location = "/profile/" + ownerUID)}
          >
            <Avatar src={profilePicUrl || null} size={24} radius="xl" />
            <Text size="xs" c="dimmed" truncate>{ownerName}</Text>
          </Group>

          <Group gap="xs">
            <Button component={Link} to={`/listing/${id}`} variant="default" size="xs" style={{ flex: 1 }}>
              View
            </Button>
            {isOwner && (
              <Button component={Link} to={`/manage/${id}`} variant="default" size="xs">
                Manage
              </Button>
            )}
          </Group>
        </Stack>
      </Stack>
    </Card>
  );
}

export default ListingComponent;
