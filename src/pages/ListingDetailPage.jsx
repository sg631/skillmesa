import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { LinkButton } from "../components/LinkElements";
import showAlert from "../components/ShowAlert";
import { Title, Text, Button, Group, Stack, Avatar, Badge, Divider, Paper, Code, ScrollArea, Image, Overlay, Box } from "@mantine/core";

function ListingDetailPage() {
  const { listingId } = useParams();
  const [listingData, setListingData] = useState(null);
  const [ownerData, setOwnerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  async function copyTextToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  }

  useEffect(() => {
    if (!listingId) return;
    let isMounted = true;

    async function fetchListing() {
      setLoading(true);
      try {
        const listingRef = doc(db, "listings", listingId);
        const listingSnap = await getDoc(listingRef);

        if (!listingSnap.exists()) {
          if (isMounted) setListingData(null);
          return;
        }

        const listing = { id: listingSnap.id, ...listingSnap.data() };
        if (isMounted) setListingData(listing);

        if (listing.owner) {
          const ownerRef = doc(db, "users", listing.owner);
          const ownerSnap = await getDoc(ownerRef);
          if (ownerSnap.exists()) {
            if (isMounted) setOwnerData(ownerSnap.data());
          } else {
            if (isMounted) setOwnerData(null);
          }
        }
      } catch (err) {
        console.error("Error fetching listing:", err);
        if (isMounted) {
          setListingData(null);
          setOwnerData(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchListing();
    return () => { isMounted = false; };
  }, [listingId]);

  if (loading) return <Text ta="center" py="xl">Loading listing...</Text>;
  if (!listingData) return <Text ta="center" py="xl">Listing not found.</Text>;

  const ownerName = ownerData?.displayName || "Unknown User";
  const profilePicUrl = ownerData?.profilePic?.currentUrl || null;

  return (
    <Box style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      display: 'flex', background: 'var(--mantine-color-dark-light)', backdropFilter: 'blur(6px)',
      zIndex: 100,
    }}>
      <title>view listing | skillmesa</title>

      {/* Left panel */}
      <Paper
        radius={0}
        p="xl"
        style={{
          width: 700, height: '100%', overflowY: 'auto',
          borderRight: '3px solid rgba(208, 208, 208, 0.5)',
        }}
      >
        <Stack gap="md" pt="xl">
          <Title order={1} ta="center">{listingData.title || "Untitled Listing"}</Title>

          {listingData.images && listingData.images.length > 0 && (
            <div>
              {listingData.images.map((img, index) => (
                <Image key={index} src={img.currentUrl || img.url} alt={`Listing Image ${index + 1}`} radius="md" />
              ))}
            </div>
          )}

          {listingData.thumbnailURL && (
            <Image
              src={listingData.thumbnailURL}
              alt="Listing Thumbnail"
              radius="md"
              maw={560}
              mx="auto"
            />
          )}

          <Text>{listingData.description || "No description."}</Text>
          <Text><strong>Price:</strong> {listingData.price ? `$${parseFloat(listingData.price).toFixed(2)}` : "Not specified"}</Text>
          <Text><strong>Zip Code:</strong> <Code>{listingData.zipCode || "Not specified"}</Code></Text>
          <Text><strong>Category:</strong> <Code>{listingData.category || "Not specified"}</Code></Text>
          <Text><strong>Type:</strong> <Code>{listingData.type || "Not specified"}</Code></Text>
          <Text><strong>Online:</strong> {listingData.type ? (listingData.type === "online" ? "No" : "Yes") : "Not specified"}</Text>

          <Group
            gap="sm"
            style={{ cursor: "pointer" }}
            onClick={() => (window.location = "/profile/" + listingData.owner)}
          >
            <Avatar src={profilePicUrl} size="sm" radius="xl" />
            <Text size="sm">{ownerName}</Text>
          </Group>

          <ScrollArea scrollbarSize={4} type="hover" offsetScrollbars>
            <Group gap={6} wrap="nowrap">
              {listingData.tags.map((tag, index) => (
                <Badge key={index} variant="light" color="gray" size="sm" style={{ flexShrink: 0 }}>
                  {tag}
                </Badge>
              ))}
            </Group>
          </ScrollArea>

          <Divider />
          <Button disabled fullWidth variant="light">Locked Resource Page (COMING SOON)</Button>
          <LinkButton to={`/manage/${listingId}`} disabled={user ? user.uid !== listingData.owner : true} fullWidth variant="light">
            Manage
          </LinkButton>
          <LinkButton to={`/contact/${listingData.owner}`} fullWidth variant="light">
            Inquire
          </LinkButton>
          <Button
            variant="light"
            color="cyan"
            fullWidth
            onClick={() => {
              copyTextToClipboard("https://skill-mesa.web.app/share/" + listingData.id);
              showAlert(<p>Copied share link! <br /><Code>{"https://skill-mesa.web.app/share/" + listingData.id}</Code></p>);
            }}
          >
            Share
          </Button>
        </Stack>
      </Paper>

      {/* Right panel */}
      <Paper
        radius={0}
        p="xl"
        style={{ flex: 1, height: '100%', overflowY: 'auto' }}
      >
        <Stack pt="xl">
          <Title order={2}>We apologize for the inconvenience</Title>
          <Code>Temporarily removed extra info panel</Code>
        </Stack>
      </Paper>
    </Box>
  );
}

export default ListingDetailPage;
