import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { doc, getDoc, setDoc, deleteDoc, updateDoc, arrayUnion, arrayRemove, collection, query, where, limit, getDocs, addDoc, serverTimestamp, collectionGroup, increment } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, auth, storage } from "../firebase";
import { LinkButton } from "../components/LinkElements";
import showAlert from "../components/ShowAlert";
import TextEditor from "../components/TextEditor";
import ShareLinksManager from "../components/ShareLinksManager";
import LocationPicker from "../components/LocationPicker";
import {
  Title, Text, TextInput, Textarea, Button, Group, Stack, Avatar,
  Badge, Divider, Paper, Code, ScrollArea, Image, Box, Grid,
  ActionIcon, Loader, TagsInput, Modal, Tabs,
} from "@mantine/core";
import { ArrowLeft, Share2, Save, Trash2, Upload, Archive, ArchiveRestore, UserPlus, X, Search, UserCheck, UserMinus } from "lucide-react";
import ListingFiles from "../components/ListingFiles";

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

// Search + display user for collaborator list
function CollaboratorRow({ uid, onRemove }) {
  const [userData, setUserData] = useState(null);
  useEffect(() => {
    getDoc(doc(db, 'users', uid)).then(s => { if (s.exists()) setUserData(s.data()); }).catch(() => {});
  }, [uid]);
  return (
    <Group gap="sm" wrap="nowrap">
      <Avatar src={userData?.profilePic?.currentUrl || null} size={32} radius="xl" style={{ flexShrink: 0 }} />
      <Box style={{ flex: 1, minWidth: 0 }}>
        <Text size="sm" fw={500} truncate>{userData?.displayName || '…'}</Text>
        {userData?.username && <Text size="xs" c="dimmed">@{userData.username}</Text>}
      </Box>
      <ActionIcon variant="subtle" color="red" size="sm" onClick={() => onRemove(uid)}>
        <X size={13} />
      </ActionIcon>
    </Group>
  );
}

function EnrolledUserRow({ uid, onRevoke }) {
  const [userData, setUserData] = useState(null);
  useEffect(() => {
    getDoc(doc(db, 'users', uid)).then(s => { if (s.exists()) setUserData(s.data()); }).catch(() => {});
  }, [uid]);
  return (
    <Group gap="sm" wrap="nowrap">
      <Avatar src={userData?.profilePic?.currentUrl || null} size={32} radius="xl" style={{ flexShrink: 0 }} />
      <Box style={{ flex: 1, minWidth: 0 }}>
        <Text size="sm" fw={500} truncate>{userData?.displayName || '…'}</Text>
        {userData?.username && <Text size="xs" c="dimmed">@{userData.username}</Text>}
      </Box>
      <ActionIcon variant="subtle" color="red" size="sm" onClick={() => onRevoke(uid)}>
        <UserMinus size={13} />
      </ActionIcon>
    </Group>
  );
}

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
  const [location, setLocation]       = useState(null);
  const [richContent, setRichContent] = useState("");

  // Editors / collaborators
  const [editors, setEditors]         = useState([]);
  const [editorSearch, setEditorSearch] = useState("");
  const [editorResults, setEditorResults] = useState([]);
  const [editorSearching, setEditorSearching] = useState(false);
  const [addingEditor, setAddingEditor] = useState(null);

  // Enrollments
  const [enrollments, setEnrollments]           = useState([]);
  const [enrollLoading, setEnrollLoading]       = useState(false);
  const [enrollSearch, setEnrollSearch]         = useState('');
  const [enrollResults, setEnrollResults]       = useState([]);
  const [enrollSearching, setEnrollSearching]   = useState(false);
  const [addingEnroll, setAddingEnroll]         = useState(null);

  // Thumbnail
  const [newThumbnail, setNewThumbnail]         = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const thumbInputRef = useRef(null);

  // Archive
  const [archived, setArchived]         = useState(false);
  const [archiveLoading, setArchiveLoading] = useState(false);

  // Delete modal
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting]     = useState(false);

  // Locked resource page
  const [lockedContent, setLockedContent] = useState("");
  const [lockedSaving, setLockedSaving]   = useState(false);
  const [listingFiles, setListingFiles]   = useState([]);

  // Group membership (for group-owned listings)
  const [isGroupMember, setIsGroupMember] = useState(false);

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
          setLocation(listing.location || null);
          setRichContent(listing.richContent || "");
          setEditors(listing.editors || []);
          setArchived(listing.archived || false);
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

  useEffect(() => { if (listingId) loadEnrollments(); }, [listingId]);

  // Fetch locked content
  useEffect(() => {
    if (!listingId) return;
    getDoc(doc(db, 'listings', listingId, 'lockedPage', 'main'))
      .then(snap => { if (snap.exists()) setLockedContent(snap.data().content || ''); })
      .catch(() => {});
  }, [listingId]);

  // Fetch listing files for file-ref picker in editor
  useEffect(() => {
    if (!listingId) return;
    getDocs(query(collection(db, 'listings', listingId, 'files'), where('privacy', '!=', 'managers')))
      .then(snap => setListingFiles(snap.docs.map(d => ({ id: d.id, ...d.data(), url: d.data().url || d.data().downloadUrl || '' }))))
      .catch(() => {});
  }, [listingId]);

  useEffect(() => {
    if (!user || !listingData?.ownerGroupId) return;
    getDoc(doc(db, 'groups', listingData.ownerGroupId, 'members', user.uid))
      .then(snap => setIsGroupMember(snap.exists()))
      .catch(() => {});
  }, [listingData?.ownerGroupId, user?.uid]);

  // Editor search debounce
  useEffect(() => {
    if (!editorSearch.trim()) { setEditorResults([]); return; }
    setEditorSearching(true);
    const timer = setTimeout(async () => {
      try {
        const term = editorSearch.trim();
        const existingSet = new Set([listingData?.owner, ...editors]);
        const [snap1, snap2] = await Promise.all([
          getDocs(query(collection(db, 'users'), where('displayName', '>=', term), where('displayName', '<=', term + '\uf8ff'), limit(6))),
          getDocs(query(collection(db, 'users'), where('username', '>=', term.toLowerCase()), where('username', '<=', term.toLowerCase() + '\uf8ff'), limit(6))),
        ]);
        const seen = new Set();
        const users = [];
        for (const snap of [snap1, snap2]) {
          for (const d of snap.docs) {
            if (!seen.has(d.id) && !existingSet.has(d.id)) {
              seen.add(d.id);
              users.push({ uid: d.id, ...d.data() });
            }
          }
        }
        setEditorResults(users.slice(0, 6));
      } catch (err) {
        console.error(err);
      } finally {
        setEditorSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [editorSearch, editors, listingData?.owner]);

  // Enrollment search debounce
  useEffect(() => {
    if (!enrollSearch.trim()) { setEnrollResults([]); return; }
    setEnrollSearching(true);
    const timer = setTimeout(async () => {
      try {
        const term = enrollSearch.trim();
        const enrolledSet = new Set([listingData?.owner, ...editors, ...enrollments.map(e => e.id)]);
        const [snap1, snap2] = await Promise.all([
          getDocs(query(collection(db, 'users'), where('displayName', '>=', term), where('displayName', '<=', term + '\uf8ff'), limit(6))),
          getDocs(query(collection(db, 'users'), where('username', '>=', term.toLowerCase()), where('username', '<=', term.toLowerCase() + '\uf8ff'), limit(6))),
        ]);
        const seen = new Set();
        const users = [];
        for (const snap of [snap1, snap2]) {
          for (const d of snap.docs) {
            if (!seen.has(d.id) && !enrolledSet.has(d.id)) {
              seen.add(d.id);
              users.push({ uid: d.id, ...d.data() });
            }
          }
        }
        setEnrollResults(users.slice(0, 6));
      } catch (err) {
        console.error(err);
      } finally {
        setEnrollSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [enrollSearch, enrollments, editors, listingData?.owner]);

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
        location,
      };

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

  const handleSaveLockedContent = async () => {
    setLockedSaving(true);
    try {
      await setDoc(doc(db, 'listings', listingId, 'lockedPage', 'main'), { content: lockedContent }, { merge: true });
      showAlert('Resources page saved!');
    } catch (err) {
      console.error('Failed to save locked content:', err);
      showAlert('Failed to save resources page.');
    } finally {
      setLockedSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteDoc(doc(db, "listings", listingId));
      navigate("/home");
    } catch (err) {
      console.error("Failed to delete:", err);
      showAlert("Failed to delete listing.");
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  async function toggleArchive() {
    setArchiveLoading(true);
    try {
      const next = !archived;
      await updateDoc(doc(db, "listings", listingId), { archived: next });
      setArchived(next);
    } catch (err) {
      console.error(err);
      showAlert("Failed to update archive status.");
    } finally {
      setArchiveLoading(false);
    }
  }

  async function addEditor(targetUser) {
    setAddingEditor(targetUser.uid);
    try {
      await updateDoc(doc(db, "listings", listingId), { editors: arrayUnion(targetUser.uid) });
      setEditors(prev => [...prev, targetUser.uid]);
      setEditorSearch('');
      setEditorResults([]);
      // Notify the new collaborator
      const currentUserName = user ? (await getDoc(doc(db, 'users', user.uid))).data()?.displayName || 'Someone' : 'Someone';
      await addDoc(collection(db, 'notifications', targetUser.uid, 'items'), {
        type: 'collab_invite',
        message: `${currentUserName} added you as a collaborator on "${title}"`,
        read: false,
        createdAt: serverTimestamp(),
        link: `/manage/${listingId}`,
      });
    } catch (err) {
      console.error(err);
      showAlert("Failed to add collaborator.");
    } finally {
      setAddingEditor(null);
    }
  }

  async function removeEditor(uid) {
    try {
      await updateDoc(doc(db, "listings", listingId), { editors: arrayRemove(uid) });
      setEditors(prev => prev.filter(e => e !== uid));
    } catch (err) {
      console.error(err);
      showAlert("Failed to remove collaborator.");
    }
  }

  // ── Enrollment management ──
  async function loadEnrollments() {
    setEnrollLoading(true);
    try {
      const snap = await getDocs(collection(db, 'listings', listingId, 'enrollments'));
      setEnrollments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
    } finally {
      setEnrollLoading(false);
    }
  }

  async function grantEnrollment(targetUser) {
    setAddingEnroll(targetUser.uid);
    try {
      await setDoc(doc(db, 'listings', listingId, 'enrollments', targetUser.uid), {
        userId: targetUser.uid,
        listingId,
        listingTitle: title,
        listingThumbnailURL: listingData.thumbnailURL || null,
        grantedBy: user.uid,
        grantedAt: serverTimestamp(),
        status: 'active',
      });
      await addDoc(collection(db, 'notifications', targetUser.uid, 'items'), {
        type: 'enrolled',
        title: 'New enrollment',
        body: `You've been enrolled in "${title}"`,
        message: `You've been enrolled in "${title}"`,
        read: false,
        createdAt: serverTimestamp(),
        link: `/listing/${listingId}`,
      });
      updateDoc(doc(db, 'listings', listingId), { enrollmentCount: increment(1) }).catch(() => {});
      setEnrollSearch('');
      setEnrollResults([]);
      await loadEnrollments();
    } catch (err) {
      console.error(err);
      showAlert('Failed to enroll user.');
    } finally {
      setAddingEnroll(null);
    }
  }

  async function revokeEnrollment(targetUid) {
    try {
      await deleteDoc(doc(db, 'listings', listingId, 'enrollments', targetUid));
      updateDoc(doc(db, 'listings', listingId), { enrollmentCount: increment(-1) }).catch(() => {});
      setEnrollments(prev => prev.filter(e => e.id !== targetUid));
    } catch (err) {
      console.error(err);
      showAlert('Failed to revoke enrollment.');
    }
  }

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

  const isOwner  = Boolean(user && listingData.owner === user.uid);
  const isEditor = Boolean(user && (listingData.editors || []).includes(user.uid));
  if (!isOwner && !isEditor && !isGroupMember) return <Navigate to={`/listing/${listingId}`} />;

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
        {archived && <Badge color="orange" variant="light" size="sm">Archived</Badge>}
        {!isOwner && isEditor && <Badge color="blue" variant="light" size="sm">Editor</Badge>}
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
                <LocationPicker value={location} onChange={setLocation} />
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

            {/* Tabbed additional info */}
            <Tabs defaultValue="details" keepMounted={false}>
              <Tabs.List>
                <Tabs.Tab value="details">Details</Tabs.Tab>
                <Tabs.Tab value="files">Files</Tabs.Tab>
                <Tabs.Tab value="resources">Resources</Tabs.Tab>
                <Tabs.Tab value="image-editor" disabled>
                  <Text size="xs" c="dimmed" component="span">Image Editor <Badge size="xs" variant="light" color="gray" ml={4}>Soon</Badge></Text>
                </Tabs.Tab>
                <Tabs.Tab value="ai" disabled>
                  <Text size="xs" c="dimmed" component="span">AI <Badge size="xs" variant="light" color="gray" ml={4}>Soon</Badge></Text>
                </Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="details" pt="md">
                <Stack gap="xs">
                  <Text size="xs" c="dimmed">Rich text shown on the listing page — add details, schedules, requirements, etc.</Text>
                  <TextEditor initialState={richContent} onChange={setRichContent} listingFiles={listingFiles} />
                </Stack>
              </Tabs.Panel>

              <Tabs.Panel value="files" pt="md">
                <ListingFiles
                  listingId={listingId}
                  ownerId={listingData.owner}
                  editors={editors}
                  editorMode={true}
                />
              </Tabs.Panel>

              <Tabs.Panel value="resources" pt="md">
                <Stack gap="sm">
                  <Box>
                    <Text fw={500} size="sm">Locked Resources Page</Text>
                    <Text size="xs" c="dimmed">This page is only visible to enrolled users. Add materials, links, instructions, or file references.</Text>
                  </Box>
                  <TextEditor initialState={lockedContent} onChange={setLockedContent} listingFiles={listingFiles} />
                  <Button
                    variant="filled"
                    size="sm"
                    loading={lockedSaving}
                    onClick={handleSaveLockedContent}
                    style={{ alignSelf: 'flex-start' }}
                  >
                    Save resources page
                  </Button>
                </Stack>
              </Tabs.Panel>
            </Tabs>

            {/* ── Enrollments section (all managers) ── */}
            <Paper withBorder p="lg" radius="md">
              <Stack gap="md">
                <Box>
                  <Text fw={600} size="sm">Enrollments</Text>
                  <Text size="xs" c="dimmed">Enrolled users can access enroll-tier files and leave reviews.</Text>
                </Box>

                {enrollLoading ? (
                  <Loader size="xs" color="gray" />
                ) : enrollments.length > 0 ? (
                  <Stack gap="sm">
                    {enrollments.map(enr => (
                      <EnrolledUserRow key={enr.id} uid={enr.id} onRevoke={revokeEnrollment} />
                    ))}
                  </Stack>
                ) : (
                  <Text size="xs" c="dimmed">No one is enrolled yet.</Text>
                )}

                <Box>
                  <Text size="xs" fw={500} mb={6}>Enroll a user</Text>
                  <TextInput
                    placeholder="Search by name or username…"
                    value={enrollSearch}
                    onChange={e => setEnrollSearch(e.target.value)}
                    leftSection={<Search size={14} />}
                    size="sm"
                  />
                  {enrollSearching && <Loader size="xs" color="gray" mt="xs" />}
                  {enrollResults.length > 0 && (
                    <Stack gap="xs" mt="xs">
                      {enrollResults.map(u => (
                        <Paper key={u.uid} withBorder p="xs" radius="md">
                          <Group gap="sm">
                            <Avatar src={u.profilePic?.currentUrl || null} size={28} radius="xl" />
                            <Box style={{ flex: 1, minWidth: 0 }}>
                              <Text size="sm" fw={500} truncate>{u.displayName || '(No name)'}</Text>
                              {u.username && <Text size="xs" c="dimmed">@{u.username}</Text>}
                            </Box>
                            <Button
                              size="xs" variant="default"
                              leftSection={<UserCheck size={12} />}
                              loading={addingEnroll === u.uid}
                              onClick={() => grantEnrollment(u)}
                            >
                              Enroll
                            </Button>
                          </Group>
                        </Paper>
                      ))}
                    </Stack>
                  )}
                </Box>
              </Stack>
            </Paper>

            {/* ── Collaborators section (owner only) ── */}
            {isOwner && (
              <Paper withBorder p="lg" radius="md">
                <Stack gap="md">
                  <Box>
                    <Text fw={600} size="sm">Collaborators</Text>
                    <Text size="xs" c="dimmed">Editors can edit this listing's content but cannot delete it or manage collaborators.</Text>
                  </Box>

                  {editors.length > 0 && (
                    <Stack gap="sm">
                      {editors.map(uid => (
                        <CollaboratorRow key={uid} uid={uid} onRemove={removeEditor} />
                      ))}
                    </Stack>
                  )}

                  <Box>
                    <Text size="xs" fw={500} mb={6}>Add collaborator</Text>
                    <TextInput
                      placeholder="Search by name or username…"
                      value={editorSearch}
                      onChange={e => setEditorSearch(e.target.value)}
                      leftSection={<Search size={14} />}
                      size="sm"
                    />
                    {editorSearching && <Loader size="xs" color="gray" mt="xs" />}
                    {editorResults.length > 0 && (
                      <Stack gap="xs" mt="xs">
                        {editorResults.map(u => (
                          <Paper key={u.uid} withBorder p="xs" radius="md">
                            <Group gap="sm">
                              <Avatar src={u.profilePic?.currentUrl || null} size={28} radius="xl" />
                              <Box style={{ flex: 1, minWidth: 0 }}>
                                <Text size="sm" fw={500} truncate>{u.displayName || '(No name)'}</Text>
                                {u.username && <Text size="xs" c="dimmed">@{u.username}</Text>}
                              </Box>
                              <Button
                                size="xs" variant="default"
                                leftSection={<UserPlus size={12} />}
                                loading={addingEditor === u.uid}
                                onClick={() => addEditor(u)}
                              >
                                Add
                              </Button>
                            </Group>
                          </Paper>
                        ))}
                      </Stack>
                    )}
                  </Box>
                </Stack>
              </Paper>
            )}
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
                {(listingData?.shares ?? 0) > 0 && (
                  <Text size="xs" c="dimmed" ta="center">
                    {listingData.shares} open{listingData.shares !== 1 ? 's' : ''} via default link
                  </Text>
                )}
              </Stack>

              <Divider />

              {/* Share links */}
              <ShareLinksManager listingId={listingId} currentUserId={user?.uid} />

              {/* Danger zone — owner only */}
              {isOwner && (
                <>
                  <Divider label="Danger zone" labelPosition="center" color="red" />
                  <Stack gap="xs">
                    <Button
                      variant="light"
                      color={archived ? "teal" : "orange"}
                      fullWidth
                      leftSection={archived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
                      loading={archiveLoading}
                      onClick={toggleArchive}
                    >
                      {archived ? "Unarchive listing" : "Archive listing"}
                    </Button>
                    <Button
                      variant="light"
                      color="red"
                      fullWidth
                      leftSection={<Trash2 size={14} />}
                      onClick={() => setDeleteOpen(true)}
                    >
                      Delete listing
                    </Button>
                  </Stack>
                </>
              )}
            </Stack>
          </Paper>
        </Grid.Col>

      </Grid>

      {/* Delete confirmation modal */}
      <Modal opened={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete listing" centered size="sm">
        <Text size="sm" mb="xl">
          Are you sure you want to delete <strong>{title || 'this listing'}</strong>? This cannot be undone.
        </Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button color="red" loading={deleting} onClick={handleDelete}>Delete permanently</Button>
        </Group>
      </Modal>
    </Stack>
  );
}

export default ManagePage;
