import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, setDoc, updateDoc, arrayRemove, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../firebase";
import { LinkButton } from "../components/LinkElements";
import showAlert from "../components/ShowAlert";
import {
  Title, Text, Button, Group, Stack, Avatar, Badge, Divider,
  Paper, Code, ScrollArea, Image, Box, Grid, ActionIcon, Loader, Menu,
} from "@mantine/core";
import { ArrowLeft, Share2, Mail, MessageSquare, ChevronDown } from "lucide-react";
import RichContentView from "../components/RichContentView";

function ListingDetailPage() {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const [listingData, setListingData] = useState(null);
  const [ownerData, setOwnerData]     = useState(null);
  const [loading, setLoading]         = useState(true);
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

            {/* Rich additional info */}
            {listingData.richContent && (
              <>
                <Divider />
                <Stack gap="xs">
                  <Text fw={600} size="sm" c="dimmed" tt="uppercase" style={{ letterSpacing: '0.05em' }}>
                    Additional Info
                  </Text>
                  <RichContentView content={listingData.richContent} />
                </Stack>
              </>
            )}

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
              {listingData.zipCode && (
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <Stack gap={2}>
                    <Text size="xs" c="dimmed" fw={500}>Location</Text>
                    <Text size="sm">{listingData.zipCode}</Text>
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
                {/* Inquire submenu */}
                <Menu position="bottom" withArrow withinPortal>
                  <Menu.Target>
                    <Button fullWidth rightSection={<ChevronDown size={14} />}>
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
                        const chatId = [user.uid, listingData.owner].sort().join('_');
                        const chatRef = doc(db, 'chats', chatId);
                        try {
                          const existing = await getDoc(chatRef);
                          if (!existing.exists()) {
                            await setDoc(chatRef, {
                              participants: [user.uid, listingData.owner].sort(),
                              initiatedBy: user.uid,
                              status: 'active',
                              requestSource: 'listing',
                              lastAt: serverTimestamp(),
                              lastMessage: '',
                              hiddenBy: [],
                              blockedBy: [],
                              unread: {},
                            });
                          } else {
                            const data = existing.data();
                            const updates = {};
                            if (data.status === 'pending' && data.initiatedBy !== user.uid) {
                              updates.status = 'active';
                            }
                            if ((data.hiddenBy ?? []).includes(user.uid)) {
                              await updateDoc(chatRef, { hiddenBy: arrayRemove(user.uid), ...updates });
                            } else if (Object.keys(updates).length > 0) {
                              await updateDoc(chatRef, updates);
                            }
                          }
                        } catch (e) { /* continue even if setDoc fails */ }
                        navigate(`/chat/${listingData.owner}`);
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
                  onClick={() => {
                    const url = "https://skill-mesa.web.app/share/" + listingData.id;
                    copyTextToClipboard(url);
                    showAlert(<p>Copied share link! <br /><Code>{url}</Code></p>);
                  }}
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
    </Stack>
  );
}

export default ListingDetailPage;
