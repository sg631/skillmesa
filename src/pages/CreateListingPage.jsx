import React from 'react';
import {
  Text, Textarea, Select, Button, Stack, Image, Paper,
  TagsInput, Box, Grid, ActionIcon, Divider, Group, TextInput, Loader, Badge,
} from '@mantine/core';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db, storage } from "../firebase";
import { collection, addDoc, updateDoc, doc, getDoc, getDocs, arrayUnion } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Upload, Users } from 'lucide-react';
import showAlert from '../components/ShowAlert';

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

function CreateListingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedGroupId = searchParams.get('group');

  const [user, setUser]               = React.useState(null);
  const [checkedAuth, setCheckedAuth] = React.useState(false);
  const [previewUrl, setPreviewUrl]   = React.useState(null);
  const [selectedImage, setSelectedImage] = React.useState(null);
  const [isSubmitting, setIsSubmitting]   = React.useState(false);

  // Group ownership
  const [userGroups, setUserGroups]     = React.useState([]); // { id, name }
  const [groupsLoading, setGroupsLoading] = React.useState(false);
  const [ownerGroupId, setOwnerGroupId] = React.useState(preselectedGroupId || null);

  // Form fields
  const [title, setTitle]             = React.useState("");
  const [description, setDescription] = React.useState("");
  const [tags, setTags]               = React.useState([]);
  const [category, setCategory]       = React.useState("coding");
  const [type, setType]               = React.useState("class");
  const [online, setOnline]           = React.useState("in-person");
  const [price, setPrice]             = React.useState("");
  const [zipCode, setZipCode]         = React.useState("");

  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setCheckedAuth(true);
      if (u) {
        setGroupsLoading(true);
        try {
          const userSnap = await getDoc(doc(db, 'users', u.uid));
          const groupIds = userSnap.exists() ? (userSnap.data().groupIds || []) : [];
          if (groupIds.length > 0) {
            const snaps = await Promise.all(groupIds.map(id => getDoc(doc(db, 'groups', id))));
            setUserGroups(snaps.filter(s => s.exists()).map(s => ({ id: s.id, ...s.data() })));
          }
        } catch (err) {
          console.error(err);
        } finally {
          setGroupsLoading(false);
        }
      }
    });
    return () => unsub();
  }, []);

  const fileInputRef = React.useRef(null);

  function handleImageSelect(file) {
    if (!file) return;
    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function handleSubmit() {
    if (!user) { showAlert("You must be signed in to create a listing."); return; }
    if (!title.trim()) { showAlert("Please add a title."); return; }
    if (!description.trim()) { showAlert("Please add a description."); return; }
    if (tags.length === 0) { showAlert("Please add at least one tag."); return; }
    if (!price) { showAlert("Please set a price."); return; }
    if (!zipCode) { showAlert("Please enter a ZIP code."); return; }
    if (!selectedImage) { showAlert("Please upload a thumbnail image."); return; }

    setIsSubmitting(true);
    try {
      const tagsArray = tags.map(t => t.trim()).filter(t => t.length > 0);

      // If group-owned, load all member UIDs for editors[]
      let editorUIDs = [];
      if (ownerGroupId) {
        const membersSnap = await getDocs(collection(db, 'groups', ownerGroupId, 'members'));
        editorUIDs = membersSnap.docs
          .map(d => d.id)
          .filter(uid => uid !== user.uid);
      }

      const listingPayload = {
        title:       title.trim(),
        description: description.trim(),
        owner:       user.uid,
        rating:      -1,
        tags:        tagsArray,
        category,
        type,
        online:      online === "online",
        editors:     editorUIDs,
        thumbnailURL: "",
        createdAt:   new Date().toISOString(),
        price:       Number(parseFloat(String(price).replace(/[^0-9.]/g, '')).toFixed(2)),
        zipCode,
        ...(ownerGroupId ? { ownerType: 'group', ownerGroupId } : {}),
      };

      const newRef = await addDoc(collection(db, "listings"), listingPayload);

      // Upload thumbnail
      const ext      = selectedImage.name.split(".").pop();
      const imageRef = ref(storage, `listings/${newRef.id}/thumbnail.${ext}`);
      await uploadBytes(imageRef, selectedImage);
      const imageURL = await getDownloadURL(imageRef);
      await updateDoc(doc(db, "listings", newRef.id), { thumbnailURL: imageURL });

      // If group-owned, register listing in the group doc
      if (ownerGroupId) {
        await updateDoc(doc(db, 'groups', ownerGroupId), {
          listingIds: arrayUnion(newRef.id),
        });
      }

      showAlert("Listing created successfully!");
      navigate("/home");
    } catch (err) {
      console.error("Error creating listing:", err);
      showAlert("Failed to create listing.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!checkedAuth) {
    return (
      <Box py="xl" style={{ display: 'flex', justifyContent: 'center' }}>
        <Loader color="gray" size="sm" />
      </Box>
    );
  }

  // Live-preview banner classes
  const typeClass  = type === "service" ? "banner-service" : "banner-class";
  const modalClass = online === "online" ? "banner-online" : "banner-offline";

  const bannerBase = {
    display: 'inline-flex', alignItems: 'center',
    padding: '4px 10px', borderRadius: 6,
    fontSize: 12, fontWeight: 600,
    textTransform: 'capitalize', letterSpacing: '0.01em',
  };

  const selectedGroup = userGroups.find(g => g.id === ownerGroupId);

  const groupSelectData = [
    { value: '', label: 'Myself' },
    ...userGroups.map(g => ({ value: g.id, label: g.name })),
  ];

  return (
    <Stack gap={0} py="xl" px={{ base: 'md', sm: 'xl' }} maw={1200} mx="auto" className="page-enter">
      <title>create listing | skillmesa</title>

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
            {/* Thumbnail upload area */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => handleImageSelect(e.target.files?.[0])}
            />
            {previewUrl ? (
              <Box style={{ position: 'relative', cursor: 'pointer' }} onClick={() => fileInputRef.current?.click()}>
                <Image
                  src={previewUrl}
                  alt="Thumbnail preview"
                  radius="md"
                  style={{ width: '100%', maxHeight: 400, objectFit: 'cover' }}
                />
                <Box
                  style={{
                    position: 'absolute', inset: 0, borderRadius: 8,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(0,0,0,0)', transition: 'background 0.2s ease',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.35)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0)'}
                >
                  <Text size="sm" c="white" fw={500} style={{ opacity: 0, transition: 'opacity 0.2s ease' }}
                    onMouseEnter={e => e.currentTarget.style.opacity = 1}
                    onMouseLeave={e => e.currentTarget.style.opacity = 0}
                  >
                    Click to change
                  </Text>
                </Box>
              </Box>
            ) : (
              <Paper
                withBorder
                radius="md"
                style={{
                  height: 240, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 8,
                  borderStyle: 'dashed', cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                }}
                onClick={() => fileInputRef.current?.click()}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--mantine-color-gray-0)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}
              >
                <Upload size={24} style={{ color: 'var(--mantine-color-dimmed)' }} />
                <Text size="sm" c="dimmed">Click to upload thumbnail</Text>
                <Text size="xs" c="dimmed">Recommended 7:4 ratio (e.g. 350×200px)</Text>
              </Paper>
            )}

            {/* Description */}
            <Textarea
              label="Description"
              placeholder="Describe what you're offering — who it's for, what they'll get, how it works..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              autosize
              minRows={5}
              required
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
                  required
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput
                  label="ZIP Code"
                  placeholder="e.g. 95630"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  required
                />
              </Grid.Col>
              <Grid.Col span={12}>
                <Select
                  label="Category"
                  value={category}
                  onChange={setCategory}
                  data={CATEGORIES}
                  required
                />
              </Grid.Col>
            </Grid>

            {/* Tags */}
            <TagsInput
              label="Tags"
              placeholder="Type a tag and press Enter"
              value={tags}
              onChange={setTags}
              clearable
              acceptValueOnBlur
              splitChars={[',']}
              required
            />

            {/* Group ownership */}
            {userGroups.length > 0 && (
              <Stack gap="xs">
                <Select
                  label="Listed by"
                  description="List this under a group so all members can co-manage it."
                  value={ownerGroupId || ''}
                  onChange={val => setOwnerGroupId(val || null)}
                  data={groupSelectData}
                  leftSection={ownerGroupId ? <Users size={14} /> : null}
                />
                {selectedGroup && (
                  <Text size="xs" c="dimmed">
                    All members of <strong>{selectedGroup.name}</strong> will be added as editors.
                  </Text>
                )}
              </Stack>
            )}
          </Stack>
        </Grid.Col>

        {/* ── Sidebar ────────────────────────────────── */}
        <Grid.Col span={{ base: 12, md: 5 }}>
          <Paper withBorder p="xl" radius="md" className="sticky-sidebar">
            <Stack gap="md">
              {/* Live-preview type + modality badges */}
              <Group gap="xs">
                <Box className={typeClass} style={bannerBase}>{type}</Box>
                <Box className={modalClass} style={bannerBase}>
                  {online === "online" ? "Online" : "In-Person"}
                </Box>
                {selectedGroup && (
                  <Badge variant="light" color="indigo" size="sm" leftSection={<Users size={11} />}>
                    {selectedGroup.name}
                  </Badge>
                )}
              </Group>

              {/* Title — large editable */}
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
                required
              />

              <Divider />

              {/* Type + format selectors */}
              <Stack gap="sm">
                <Select
                  label="Type"
                  value={type}
                  onChange={setType}
                  data={[
                    { value: "class",   label: "Class" },
                    { value: "service", label: "Skill service" },
                  ]}
                />
                <Select
                  label="Format"
                  value={online}
                  onChange={setOnline}
                  data={[
                    { value: "in-person", label: "In-person" },
                    { value: "online",    label: "Online" },
                  ]}
                />
              </Stack>

              <Divider />

              {/* Post */}
              <Button
                fullWidth
                size="md"
                loading={isSubmitting}
                onClick={handleSubmit}
              >
                {isSubmitting ? "Posting..." : "Post listing"}
              </Button>

              <Text size="xs" c="dimmed" ta="center">
                All fields are required before posting.
              </Text>
            </Stack>
          </Paper>
        </Grid.Col>

      </Grid>
    </Stack>
  );
}

export default CreateListingPage;
