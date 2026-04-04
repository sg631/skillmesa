import React, { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { LinkButton } from "../components/LinkElements";
import showAlert from "../components/ShowAlert";
import { TabBarElement, TabContainerElement } from "../components/TabElements";
import TextEditor from "../components/TextEditor";
import { Title, Text, Textarea, Button, Group, Stack, Avatar, Badge, Divider, Paper, Code, ScrollArea, Image, TagsInput, Box } from "@mantine/core";

function ManagePage() {
  const { listingId } = useParams();
  const [listingData, setListingData] = useState(null);
  const [ownerData, setOwnerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [thumbnailURL, setThumbnailUrl] = useState("");
  const [price, setPrice] = useState("");
  const [zipCode, setZipCode] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState([]);

  const user = auth.currentUser;

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
        if (isMounted) {
          setListingData(listing);
          setTitle(listing.title || "");
          setDescription(listing.description || "");
          setTags(listing.tags || []);
          setThumbnailUrl(listing.thumbnailURL || "");
          setPrice(listing.price || "");
          setZipCode(listing.zipCode || "");
        }

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

  const handleSaveAll = async () => {
    try {
      await setDoc(
        doc(db, "listings", listingId),
        {
          title,
          description,
          thumbnailURL,
          tags,
          price: Number(parseFloat(price.toString().replace(/[^0-9.]/g, '')).toFixed(2)),
          zipCode,
        },
        { merge: true }
      );
      showAlert("Listing saved successfully!");
    } catch (err) {
      console.error("Failed to save listing:", err);
      showAlert("Failed to save listing.");
    }
  };

  async function copyTextToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  }

  if (loading) return <Text ta="center" py="xl">Loading listing...</Text>;
  if (!listingData) return <Text ta="center" py="xl">Listing not found.</Text>;

  const ownerName = ownerData?.displayName || "Unknown User";
  const profilePicUrl = ownerData?.profilePic?.currentUrl || null;

  if (listingData.owner != user.uid) return (<Navigate to={"/listing/" + listingId}></Navigate>);

  return (
    <Box style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      display: 'flex', background: 'var(--mantine-color-dark-light)', backdropFilter: 'blur(6px)',
      zIndex: 100,
    }}>
      <title>manage | skillmesa</title>

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
          <Textarea
            variant="unstyled"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autosize
            styles={{ input: { fontSize: '1.8rem', fontWeight: 600, textAlign: 'center' } }}
          />

          {listingData.thumbnailURL && (
            <Image
              src={listingData.thumbnailURL}
              alt="Listing Thumbnail"
              radius="md"
              maw={560}
              mx="auto"
            />
          )}

          <Textarea
            variant="unstyled"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            autosize
            minRows={2}
            styles={{ input: { maxWidth: 560, margin: '0 auto' } }}
          />

          <Group gap="sm" justify="center">
            <Text fw={600}>Price:</Text>
            <Textarea
              variant="unstyled"
              value={price}
              placeholder="Type price in USD in format '3.65', no dollar sign!"
              onChange={(e) => setPrice(e.target.value)}
              autosize
              minRows={1}
              style={{ width: 200 }}
            />
          </Group>

          <Group gap="sm" justify="center">
            <Text fw={600}>Zip Code:</Text>
            <Textarea
              variant="unstyled"
              value={zipCode}
              placeholder="Zip code as integer: e.g. '95630'"
              onChange={(e) => setZipCode(e.target.value)}
              autosize
              minRows={1}
              style={{ width: 200 }}
            />
          </Group>

          <Group
            gap="sm"
            style={{ cursor: "pointer" }}
            onClick={() => (window.location = "/profile/" + listingData.owner)}
          >
            <Avatar src={profilePicUrl} size="sm" radius="xl" />
            <Text size="sm">{ownerName}</Text>
          </Group>

          <TagsInput
            label="Tags"
            value={tags}
            onChange={setTags}
            placeholder="Type a tag and press Enter"
            clearable
            acceptValueOnBlur
            splitChars={[',']}
          />

          <Divider />
          <LinkButton to={"/listing/" + listingId} fullWidth>View</LinkButton>
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
          <TabBarElement onTabChange={setActiveTab}>
            <li>Attached Info</li>
            <li>Images</li>
            <li>Excalidraw Editor</li>
            <li>Files</li>
            <li>Manage</li>
          </TabBarElement>

          <TabContainerElement tabIndex={activeTab}>
            <li>
              <Title order={2}>We apologize for the inconvenience</Title>
              <Code>Temporarily removed extra info panel</Code>
            </li>

            <li>
              <Title order={2}>We apologize for the inconvenience</Title>
              <Text><Code>Temporarily removed image addition.</Code> For thumbnail modification, visit the "Manage" tab.</Text>
            </li>

            <li>
              <Title order={2}>Image editor</Title>
              <Text>Warning, it is currently experimental and may not function as expected.</Text>
            </li>

            <li>
              <Title order={2}>Sharing files is coming soon</Title>
              <Text>Use other methods of sharing files with collaborators or participants for now.</Text>
            </li>

            <li>
              <Stack gap="sm" style={{ width: '100%' }}>
                <Title order={2}>Actions</Title>
                <Button fullWidth color="cyan" onClick={handleSaveAll}>Save</Button>
                <Divider />
                <Button fullWidth variant="light" disabled onClick={() => showAlert("Sorry, but skillmesa does not currently support additional collaborators.")}>
                  Add Collaborators
                </Button>
                <Button fullWidth variant="light" onClick={() => showAlert("Due to firebase handling you currently cannot change the thumbnail. Sorry, this will be updated soon.")}>
                  Change Thumbnail
                </Button>
                <Button fullWidth variant="light" disabled>Change Type</Button>
                <Divider />
                <Title order={3} c="red">Dangerous Actions</Title>
                <Button fullWidth variant="light" color="red" disabled>Change Owner</Button>
                <Button fullWidth variant="light" color="red" disabled>Archive</Button>
                <Button fullWidth variant="light" color="red" onClick={() => showAlert("You currently cannot set listings private, we will change this very very soon.")}>
                  Change Visibility
                </Button>
                <Button
                  fullWidth
                  variant="filled"
                  color="red"
                  onClick={async () => {
                    try {
                      await deleteDoc(doc(db, "listings", listingId));
                      showAlert("Listing deleted.");
                      window.location = "/";
                    } catch (err) {
                      console.error("Failed to delete listing:", err);
                      showAlert("Failed to delete listing.");
                    }
                  }}
                >
                  Delete
                </Button>
              </Stack>
            </li>
          </TabContainerElement>
        </Stack>
      </Paper>
    </Box>
  );
}

export default ManagePage;
