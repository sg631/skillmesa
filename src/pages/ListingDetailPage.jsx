import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, setDoc, updateDoc, arrayRemove, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../firebase";
import { LinkButton } from "../components/LinkElements";
import {
  Title, Text, Button, Group, Stack, Avatar, Badge, Divider,
  Paper, ScrollArea, Image, Box, Grid, ActionIcon, Loader, Menu, Tabs,
} from "@mantine/core";
import { ArrowLeft, Share2, Mail, MessageSquare, ChevronDown } from "lucide-react";
import RichContentView from "../components/RichContentView";
import ShareModal from "../components/ShareModal";
import ListingFeedback from "../components/ListingFeedback";
import ListingFiles from "../components/ListingFiles";

function ListingDetailPage() {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const [listingData, setListingData] = useState(null);
  const [ownerData, setOwnerData]     = useState(null);
  const [loading, setLoading]         = useState(true);
  const [shareOpen, setShareOpen]     = useState(false);
  const [isEnrolled, setIsEnrolled]   = useState(false);
  const user = auth.currentUser;

  useEffect(() => {
    if (!listingId) return;
    let isMounted = true;

    async function fetchListing() {
      setLoading(true);
      try {
        const listingSnap = await getDoc(doc(db, "listings", listingId));
        if (!listingSnap.exists()) {
          if (isMounted) setListingData(null);
          return;
        }
        const listing = { id: listingSnap.id, ...listingSnap.data() };
        if (isMounted) setListingData(listing);

        if (listing.owner) {
          const ownerSnap = await getDoc(doc(db, "users", listing.owner));
          if (isMounted) setOwnerData(ownerSnap.exists() ? ownerSnap.data() : null);
        }
        if (user) {
          const enrollSnap = await getDoc(doc(db, "listings", listingSnap.id, "enrollments", user.uid));
          if (isMounted) setIsEnrolled(enrollSnap.exists());
        }
      } catch (err) {
        console.error("Error fetching listing:", err);
        if (isMounted) { setListingData(null); setOwnerData(null); }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchListing();
    return () => { isMounted = false; };
  }, [listingId]);

  if (loading) {
    return (
      <Box py="xl" style={{ display: 'flex', justifyContent: 'center' }}>
        <Loader color="gray" size="sm" />
      </Box>
    );
  }

  if (!listingData) {
    return <Text ta="center" py="xl" c="dimmed">Listing not found.</Text>;
  }

  const ownerName    = ownerData?.displayName || "Unknown User";
  const profilePicUrl = ownerData?.profilePic?.currentUrl || null;
  const isOwner      = Boolean(user && listingData.owner && user.uid === listingData.owner);
  const isEditor     = Boolean(user && (listingData.editors || []).includes(user.uid));
  const isArchived   = listingData.archived === true;
  const price        = listingData.price ? `$${parseFloat(listingData.price).toFixed(2)}` : null;
  const tags         = listingData.tags || [];
  const online       = listingData.online;
  const typeLabel    = listingData.type || null;
  const typeClass    = typeLabel === "service" ? "banner-service" : "banner-class";
  const modalClass   = online ? "banner-online" : "banner-offline";

  const bannerBase = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 10px',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'capitalize',
    letterSpacing: '0.01em',
  };

  const thumbnailSrc = listingData.thumbnailURL || null;
  const extraImages  = listingData.images?.filter(img => img.currentUrl || img.url) || [];

  return (
    <Stack gap={0} py="xl" px={{ base: 'md', sm: 'xl' }} maw={1200} mx="auto" className="page-enter">
      <title>view listing | skillmesa</title>

      {/* Back row */}
      <Group gap="xs" mb="lg">
        <ActionIcon variant="subtle" color="gray" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} />
        </ActionIcon>
        <Text size="sm" c="dimmed" style={{ cursor: 'pointer' }} onClick={() => navigate(-1)}>
          Back
        </Text>
      </Group>

      <Grid gutter="xl" align="flex-start">

        {/* ── Main content ───────────────────────────── */}
        <Grid.Col span={{ base: 12, md: 7 }}>
          <Stack gap="lg">
            {/* Thumbnail */}
            {thumbnailSrc && (
              <Image
                src={thumbnailSrc}
                alt="Listing thumbnail"
                radius="md"
                style={{ width: '100%', maxHeight: 400, objectFit: 'cover' }}
              />
            )}

            {/* Extra images */}
            {extraImages.length > 0 && (
              <Stack gap="sm">
                {extraImages.map((img, i) => (
                  <Image
                    key={i}
                    src={img.currentUrl || img.url}
                    alt={`Listing image ${i + 1}`}
                    radius="md"
                  />
                ))}
              </Stack>
            )}

            {/* Description */}
            <Stack gap="xs">
              <Text fw={600} size="sm" c="dimmed" tt="uppercase" style={{ letterSpacing: '0.05em' }}>
                Description
              </Text>
              <Text size="sm" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                {listingData.description || "No description provided."}
              </Text>
            </Stack>

            {/* Tabbed additional info */}
            <Tabs defaultValue="details" keepMounted={false}>
              <Tabs.List>
                <Tabs.Tab value="details">Details</Tabs.Tab>
                <Tabs.Tab value="files">Files</Tabs.Tab>
                <Tabs.Tab value="image-editor" disabled>
                  <Text size="xs" c="dimmed">Image Editor <Badge size="xs" variant="light" color="gray" ml={4}>Soon</Badge></Text>
                </Tabs.Tab>
                <Tabs.Tab value="ai" disabled>
                  <Text size="xs" c="dimmed">AI <Badge size="xs" variant="light" color="gray" ml={4}>Soon</Badge></Text>
                </Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="details" pt="md">
                {listingData.richContent ? (
                  <RichContentView content={listingData.richContent} />
                ) : (
                  <Text size="sm" c="dimmed">No additional details provided.</Text>
                )}
              </Tabs.Panel>

              <Tabs.Panel value="files" pt="md">
                <ListingFiles
                  listingId={listingId}
                  ownerId={listingData.owner}
                  editors={listingData.editors || []}
                  editorMode={false}
                />
              </Tabs.Panel>
            </Tabs>

            <Divider />

            {/* Metadata grid */}
            <Grid gutter="md">
              {listingData.category && (
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <Stack gap={2}>
                    <Text size="xs" c="dimmed" fw={500}>Category</Text>
                    <Text size="sm">{listingData.category}</Text>
                  </Stack>
                </Grid.Col>
              )}
              {(listingData.location || listingData.zipCode) && (
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <Stack gap={2}>
                    <Text size="xs" c="dimmed" fw={500}>Location</Text>
                    <Text size="sm">{listingData.location?.display || listingData.zipCode}</Text>
                  </Stack>
                </Grid.Col>
              )}
              {typeLabel && (
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <Stack gap={2}>
                    <Text size="xs" c="dimmed" fw={500}>Type</Text>
                    <Text size="sm" tt="capitalize">{typeLabel}</Text>
                  </Stack>
                </Grid.Col>
              )}
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Stack gap={2}>
                  <Text size="xs" c="dimmed" fw={500}>Format</Text>
                  <Text size="sm">{online ? 'Online' : 'In-Person'}</Text>
                </Stack>
              </Grid.Col>
            </Grid>

            {/* Tags */}
            {tags.length > 0 && (
              <ScrollArea scrollbarSize={4} type="hover" offsetScrollbars>
                <Group gap={6} wrap="wrap">
                  {tags.map((tag, i) => (
                    <Badge key={i} variant="light" color="gray" size="sm">{tag}</Badge>
                  ))}
                </Group>
              </ScrollArea>
            )}
          </Stack>
        </Grid.Col>

        {/* ── Sidebar ────────────────────────────────── */}
        <Grid.Col span={{ base: 12, md: 5 }}>
          <Paper
            withBorder
            p="xl"
            radius="md"
            className="sticky-sidebar"
          >
            <Stack gap="md">
              {/* Type + modality badges */}
              <Group gap="xs">
                {typeLabel && (
                  <Box className={typeClass} style={bannerBase}>{typeLabel}</Box>
                )}
                <Box className={modalClass} style={bannerBase}>
                  {online ? 'Online' : 'In-Person'}
                </Box>
                {isArchived && (
                  <Badge color="orange" variant="light" size="sm">Archived</Badge>
                )}
                {isEnrolled && (
                  <Badge color="teal" variant="light" size="sm">Enrolled</Badge>
                )}
              </Group>

              {/* Title */}
              <Title order={2} style={{ lineHeight: 1.3 }}>
                {listingData.title || "Untitled Listing"}
              </Title>

              {/* Price */}
              {price && (
                <Text size="xl" fw={700}>{price}</Text>
              )}

              <Divider />

              {/* Owner */}
              <Group
                gap="sm"
                style={{ cursor: 'pointer' }}
                onClick={() => (window.location = "/profile/" + listingData.owner)}
              >
                <Avatar src={profilePicUrl} size={32} radius="xl" />
                <Stack gap={0}>
                  <Text size="xs" c="dimmed">Offered by</Text>
                  <Text size="sm" fw={500}>{ownerName}</Text>
                </Stack>
              </Group>

              <Divider />

              {/* Actions */}
              <Stack gap="xs">
                {/* Archived notice */}
                {isArchived && (
                  <Text size="xs" c="dimmed" ta="center">
                    This listing is archived and not accepting new inquiries.
                  </Text>
                )}
                {/* Inquire submenu */}
                <Menu position="bottom" withArrow withinPortal>
                  <Menu.Target>
                    <Button fullWidth rightSection={<ChevronDown size={14} />} disabled={isArchived && !isOwner && !isEditor}>
                      Inquire
                    </Button>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item
                      leftSection={<Mail size={14} />}
                      disabled={!ownerData?.contact?.email}
                      onClick={() => { window.open(`mailto:${ownerData?.contact?.email}`); }}
                    >
                      Send Email
                    </Menu.Item>
                    <Menu.Item
                      leftSection={<MessageSquare size={14} />}
                      onClick={async () => {
                        if (!user) { navigate('/signon'); return; }
                        // Inquiry chat: buyer → listing owner, tied to this listing
                        const chatId  = `inquiry_${listingData.id}_${user.uid}`;
                        const chatRef = doc(db, 'chats', chatId);
                        try {
                          const existing = await getDoc(chatRef);
                          if (!existing.exists()) {
                            await setDoc(chatRef, {
                              type: 'inquiry',
                              listingId: listingData.id,
                              participants: [user.uid, listingData.owner],
                              initiatedBy: user.uid,
                              status: 'active',
                              lastAt: serverTimestamp(),
                              lastMessage: '',
                              hiddenBy: [],
                              blockedBy: [],
                              unread: {},
                            });
                          } else {
                            const data = existing.data();
                            if ((data.hiddenBy ?? []).includes(user.uid)) {
                              await updateDoc(chatRef, { hiddenBy: arrayRemove(user.uid) });
                            }
                          }
                        } catch (e) { /* continue even if setDoc fails */ }
                        navigate(`/inbox/${chatId}`);
                      }}
                    >
                      Start Chat
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
                <Button
                  variant="default"
                  fullWidth
                  leftSection={<Share2 size={14} />}
                  onClick={() => setShareOpen(true)}
                >
                  Share
                </Button>
                {isOwner && (
                  <LinkButton to={`/manage/${listingId}`} fullWidth variant="default">
                    Manage
                  </LinkButton>
                )}
                <Button variant="subtle" color="gray" fullWidth disabled>
                  Resource Page (Coming Soon)
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Grid.Col>

      </Grid>

      <ShareModal
        opened={shareOpen}
        onClose={() => setShareOpen(false)}
        url={`${window.location.origin}/share/${listingData.id}`}
        title={listingData.title || 'Skillmesa listing'}
      />

      <Divider mt="xl" />

      <Box maw={860} w="100%">
        <ListingFeedback
          listingId={listingId}
          ownerId={listingData.owner}
          reviewCount={listingData.reviewCount ?? 0}
          isEnrolled={isEnrolled}
        />
      </Box>
    </Stack>
  );
}

export default ListingDetailPage;
