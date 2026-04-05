import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, auth, storage } from "../firebase";
import { LinkButton } from "../components/LinkElements";
import showAlert from "../components/ShowAlert";
import TextEditor from "../components/TextEditor";
import ShareLinksManager from "../components/ShareLinksManager";
import {
  Title, Text, TextInput, Textarea, Button, Group, Stack, Avatar,
  Badge, Divider, Paper, Code, ScrollArea, Image, Box, Grid,
  ActionIcon, Loader, TagsInput,
} from "@mantine/core";
import { ArrowLeft, Share2, Save, Trash2, Upload } from "lucide-react";

const CATEGORIES = [
  { value: "coding",       label: "Coding and Development" },
  { value: "music",        label: "Music" },
  { value: "math",         label: "Math" },
  { value: "art",          label: "Art" },
  { value: "language",     label: "Language" },
  { value: "design",       label: "Design" },
  { value: "writing",      label: "Writing and Editing" },
  { value: "business",     label: "Business and Marketing" },
  { value: "home-services",label: "Home and Personal Services" },
  { value: "health",       label: "Health, Fitness and Wellness" },
  { value: "tutoring",     label: "General Tutoring" },
  { value: "education",    label: "Class (other)" },
  { value: "volunteering", label: "Volunteering Opportunity" },
  { value: "other",        label: "Other" },
];

function ManagePage() {
  const { listingId } = useParams();
  const navigate = useNavigate();

  const [listingData, setListingData] = useState(null);
  const [ownerData, setOwnerData]     = useState(null);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);

  // Editable fields
  const [title, setTitle]             = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags]               = useState([]);
  const [price, setPrice]             = useState("");
  const [zipCode, setZipCode]         = useState("");
  const [richContent, setRichContent] = useState("");

  // Thumbnail
  const [newThumbnail, setNewThumbnail]         = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const thumbInputRef = useRef(null);

  const user = auth.currentUser;

  useEffect(() => {
    if (!listingId) return;
    let isMounted = true;

    async function fetchListing() {
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, "listings", listingId));
        if (!snap.exists()) { if (isMounted) setListingData(null); return; }

        const listing = { id: snap.id, ...snap.data() };
        if (isMounted) {
          setListingData(listing);
          setTitle(listing.title || "");
          setDescription(listing.description || "");
          setTags(listing.tags || []);
          setPrice(listing.price != null ? String(listing.price) : "");
          setZipCode(listing.zipCode || "");
          setRichContent(listing.richContent || "");
        }

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

  function handleThumbnailSelect(file) {
    if (!file) return;
    setNewThumbnail(file);
    setThumbnailPreview(URL.createObjectURL(file));
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = {
        title,
        description,
        tags,
        richContent,
        price: Number(parseFloat(String(price).replace(/[^0-9.]/g, '') || 0).toFixed(2)),
        zipCode,
      };

      // Upload new thumbnail if selected
      if (newThumbnail) {
        const ext = newThumbnail.name.split('.').pop();
        const storageRef = ref(storage, `listings/${listingId}/thumbnail.${ext}`);
        await uploadBytes(storageRef, newThumbnail);
        updates.thumbnailURL = await getDownloadURL(storageRef);
        setNewThumbnail(null);
      }

      await setDoc(doc(db, "listings", listingId), updates, { merge: true });
      showAlert("Listing saved successfully!");
    } catch (err) {
      console.error("Failed to save:", err);
      showAlert("Failed to save listing.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this listing? This cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, "listings", listingId));
      showAlert("Listing deleted.");
      navigate("/home");
    } catch (err) {
      console.error("Failed to delete:", err);
      showAlert("Failed to delete listing.");
    }
  };

  async function copyShareLink() {
    const url = `https://skill-mesa.web.app/share/${listingId}`;
    try { await navigator.clipboard.writeText(url); } catch {}
    showAlert(<p>Copied share link!<br /><Code>{url}</Code></p>);
  }

  if (loading) {
    return (
      <Box py="xl" style={{ display: 'flex', justifyContent: 'center' }}>
        <Loader color="gray" size="sm" />
      </Box>
    );
  }
  if (!listingData) return <Text ta="center" py="xl" c="dimmed">Listing not found.</Text>;
  if (!user || listingData.owner !== user.uid) return <Navigate to={`/listing/${listingId}`} />;

  const ownerName     = ownerData?.displayName || "Unknown User";
  const profilePicUrl = ownerData?.profilePic?.currentUrl || null;
  const online        = listingData.online;
  const typeLabel     = listingData.type || null;
  const typeClass     = typeLabel === "service" ? "banner-service" : "banner-class";
  const modalClass    = online ? "banner-online" : "banner-offline";
  const categoryLabel = CATEGORIES.find(c => c.value === listingData.category)?.label || listingData.category;

  const bannerBase = {
    display: 'inline-flex', alignItems: 'center',
    padding: '4px 10px', borderRadius: 6,
    fontSize: 12, fontWeight: 600,
    textTransform: 'capitalize', letterSpacing: '0.01em',
  };

  const currentThumb = thumbnailPreview || listingData.thumbnailURL;

  return (
    <Stack gap={0} py="xl" px={{ base: 'md', sm: 'xl' }} maw={1200} mx="auto" className="page-enter">
      <title>manage | skillmesa</title>

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
            <input
              ref={thumbInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => handleThumbnailSelect(e.target.files?.[0])}
            />
            {currentThumb ? (
              <Box style={{ position: 'relative', cursor: 'pointer' }} onClick={() => thumbInputRef.current?.click()}>
                <Image
                  src={currentThumb}
                  alt="Listing thumbnail"
                  radius="md"
                  style={{ width: '100%', maxHeight: 400, objectFit: 'cover' }}
                />
                <Box
                  style={{
                    position: 'absolute', inset: 0, borderRadius: 8,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(0,0,0,0)', transition: 'background 0.2s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.40)'; e.currentTarget.querySelector('span').style.opacity = 1; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0)'; e.currentTarget.querySelector('span').style.opacity = 0; }}
                >
                  <span style={{ color: 'white', fontWeight: 500, fontSize: 14, opacity: 0, transition: 'opacity 0.2s ease', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Upload size={14} /> Click to replace
                  </span>
                </Box>
                {thumbnailPreview && (
                  <Text size="xs" c="dimmed" mt="xs">New thumbnail selected — save to apply</Text>
                )}
              </Box>
            ) : (
              <Paper
                withBorder
                radius="md"
                style={{
                  height: 200, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 8,
                  borderStyle: 'dashed', cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                }}
                onClick={() => thumbInputRef.current?.click()}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--mantine-color-gray-0)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}
              >
                <Upload size={24} style={{ color: 'var(--mantine-color-dimmed)' }} />
                <Text size="sm" c="dimmed">Click to upload thumbnail</Text>
              </Paper>
            )}

            {/* Description */}
            <Textarea
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              autosize
              minRows={4}
              placeholder="Describe your listing..."
            />

            {/* Metadata fields */}
            <Grid gutter="md">
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput
                  label="Price (USD)"
                  placeholder="e.g. 25.00"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput
                  label="ZIP Code"
                  placeholder="e.g. 95630"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                />
              </Grid.Col>
              {categoryLabel && (
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <Stack gap={2}>
                    <Text size="xs" c="dimmed" fw={500}>Category</Text>
                    <Text size="sm">{categoryLabel}</Text>
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
            <TagsInput
              label="Tags"
              value={tags}
              onChange={setTags}
              placeholder="Type a tag and press Enter"
              clearable
              acceptValueOnBlur
              splitChars={[',']}
            />

            {/* Rich text additional info */}
            <Stack gap="xs">
              <Text size="sm" fw={500}>Additional Info</Text>
              <Text size="xs" c="dimmed">Rich text shown on the listing page — add details, schedules, requirements, etc.</Text>
              <TextEditor initialState={richContent} onChange={setRichContent} />
            </Stack>
          </Stack>
        </Grid.Col>

        {/* ── Sidebar ────────────────────────────────── */}
        <Grid.Col span={{ base: 12, md: 5 }}>
          <Paper withBorder p="xl" radius="md" className="sticky-sidebar">
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

              {/* Editable title */}
              <Textarea
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autosize
                variant="unstyled"
                placeholder="Listing title..."
                styles={{
                  input: {
                    fontSize: '1.35rem',
                    fontWeight: 700,
                    lineHeight: 1.3,
                    padding: 0,
                  },
                }}
              />

              {/* Save */}
              <Button
                fullWidth
                leftSection={<Save size={14} />}
                loading={saving}
                onClick={handleSave}
              >
                Save changes
              </Button>

              <Divider />

              {/* Owner */}
              <Group
                gap="sm"
                style={{ cursor: 'pointer' }}
                onClick={() => (window.location = "/profile/" + listingData.owner)}
              >
                <Avatar src={profilePicUrl} size={32} radius="xl" />
                <Stack gap={0}>
                  <Text size="xs" c="dimmed">Owned by</Text>
                  <Text size="sm" fw={500}>{ownerName}</Text>
                </Stack>
              </Group>

              <Divider />

              <Stack gap="xs">
                <LinkButton to={`/listing/${listingId}`} fullWidth variant="default">
                  View listing
                </LinkButton>
                <Button
                  variant="default"
                  fullWidth
                  leftSection={<Share2 size={14} />}
                  onClick={copyShareLink}
                >
                  Copy default link
                </Button>
              </Stack>

              <Divider />

              {/* Share links */}
              <ShareLinksManager listingId={listingId} currentUserId={user?.uid} />

              <Divider label="Danger zone" labelPosition="center" color="red" />

              <Stack gap="xs">
                <Button variant="light" color="red" fullWidth disabled>
                  Change visibility
                </Button>
                <Button
                  variant="filled"
                  color="red"
                  fullWidth
                  leftSection={<Trash2 size={14} />}
                  onClick={handleDelete}
                >
                  Delete listing
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Grid.Col>

      </Grid>
    </Stack>
  );
}

export default ManagePage;
