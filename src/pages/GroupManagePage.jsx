import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Stack, Group, Text, TextInput, Textarea, Button, Box, ActionIcon,
  Paper, Loader, Divider, Avatar, Badge, Select, Modal,
} from '@mantine/core';
import { ArrowLeft, Trash2, UserPlus, Users, Search } from 'lucide-react';
import {
  doc, getDoc, updateDoc, setDoc, deleteDoc, getDocs,
  collection, query, where, limit, arrayUnion, arrayRemove,
  serverTimestamp, writeBatch,
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import showAlert from '../components/ShowAlert';

const ROLE_OPTIONS = [
  { value: 'member', label: 'Member' },
  { value: 'editor', label: 'Editor' },
  { value: 'admin',  label: 'Admin' },
];

function MemberManageRow({ uid, role, groupId, currentUserRole, onRoleChange, onRemove }) {
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    getDoc(doc(db, 'users', uid)).then(s => { if (s.exists()) setUserData(s.data()); }).catch(console.error);
  }, [uid]);

  const canEdit = currentUserRole === 'owner' && role !== 'owner';

  return (
    <Group gap="sm" wrap="nowrap">
      <Avatar src={userData?.profilePic?.currentUrl || null} size={36} radius="xl" style={{ flexShrink: 0 }} />
      <Box style={{ flex: 1, minWidth: 0 }}>
        <Text size="sm" fw={500} truncate>{userData?.displayName || '…'}</Text>
        {userData?.username && <Text size="xs" c="dimmed">@{userData.username}</Text>}
      </Box>
      {canEdit ? (
        <Select
          size="xs"
          value={role}
          onChange={val => onRoleChange(uid, val)}
          data={ROLE_OPTIONS}
          style={{ width: 100, flexShrink: 0 }}
          allowDeselect={false}
        />
      ) : (
        <Badge size="xs" variant="light" style={{ flexShrink: 0, textTransform: 'capitalize' }}>{role}</Badge>
      )}
      {canEdit && (
        <ActionIcon variant="subtle" color="red" size="sm" onClick={() => onRemove(uid)}>
          <Trash2 size={13} />
        </ActionIcon>
      )}
    </Group>
  );
}

export default function GroupManagePage() {
  const { groupId } = useParams();
  const navigate    = useNavigate();
  const currentUser = auth.currentUser;

  const [group, setGroup]     = useState(null);
  const [members, setMembers] = useState([]);
  const [myRole, setMyRole]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);

  // Edit fields
  const [name, setName]             = useState('');
  const [description, setDescription] = useState('');

  // Add member
  const [addSearch, setAddSearch]     = useState('');
  const [addResults, setAddResults]   = useState([]);
  const [addSearching, setAddSearching] = useState(false);
  const [adding, setAdding]           = useState(null);

  // Delete group confirm
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting]     = useState(false);

  useEffect(() => {
    if (!groupId) return;
    async function load() {
      setLoading(true);
      try {
        const [groupSnap, membersSnap] = await Promise.all([
          getDoc(doc(db, 'groups', groupId)),
          getDocs(collection(db, 'groups', groupId, 'members')),
        ]);
        if (!groupSnap.exists()) { setLoading(false); return; }
        const g = { id: groupSnap.id, ...groupSnap.data() };
        setGroup(g);
        setName(g.name || '');
        setDescription(g.description || '');

        const memberList = membersSnap.docs.map(d => ({ uid: d.id, ...d.data() }));
        setMembers(memberList);
        const me = memberList.find(m => m.uid === currentUser?.uid);
        setMyRole(me?.role || null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [groupId, currentUser?.uid]);

  // Search for users to add
  useEffect(() => {
    if (!addSearch.trim()) { setAddResults([]); return; }
    setAddSearching(true);
    const timer = setTimeout(async () => {
      try {
        const term = addSearch.trim();
        const [snap1, snap2] = await Promise.all([
          getDocs(query(collection(db, 'users'), where('displayName', '>=', term), where('displayName', '<=', term + '\uf8ff'), limit(6))),
          getDocs(query(collection(db, 'users'), where('username', '>=', term.toLowerCase()), where('username', '<=', term.toLowerCase() + '\uf8ff'), limit(6))),
        ]);
        const existing = new Set(members.map(m => m.uid));
        const seen = new Set();
        const users = [];
        for (const snap of [snap1, snap2]) {
          for (const d of snap.docs) {
            if (!seen.has(d.id) && !existing.has(d.id)) {
              seen.add(d.id);
              users.push({ uid: d.id, ...d.data() });
            }
          }
        }
        setAddResults(users.slice(0, 6));
      } catch (err) {
        console.error(err);
      } finally {
        setAddSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [addSearch, members]);

  async function handleSave() {
    if (!name.trim()) { showAlert('Group name cannot be empty.'); return; }
    setSaving(true);
    try {
      await updateDoc(doc(db, 'groups', groupId), { name: name.trim(), description: description.trim() });
      setGroup(g => ({ ...g, name: name.trim(), description: description.trim() }));
      showAlert('Group updated.');
    } catch (err) {
      console.error(err);
      showAlert('Failed to save changes.');
    } finally {
      setSaving(false);
    }
  }

  async function addMember(user) {
    setAdding(user.uid);
    try {
      const chatId = group.chatId || `group_${groupId}`;
      await Promise.all([
        setDoc(doc(db, 'groups', groupId, 'members', user.uid), { role: 'member', joinedAt: serverTimestamp() }),
        updateDoc(doc(db, 'groups', groupId), { memberCount: (group.memberCount || 1) + 1 }),
        updateDoc(doc(db, 'chats', chatId), { participants: arrayUnion(user.uid) }),
        updateDoc(doc(db, 'users', user.uid), { groupIds: arrayUnion(groupId) }),
      ]);
      setMembers(prev => [...prev, { uid: user.uid, role: 'member' }]);
      setGroup(g => ({ ...g, memberCount: (g.memberCount || 1) + 1 }));
      setAddSearch('');
      setAddResults([]);
    } catch (err) {
      console.error(err);
      showAlert('Failed to add member.');
    } finally {
      setAdding(null);
    }
  }

  async function changeRole(uid, newRole) {
    try {
      await updateDoc(doc(db, 'groups', groupId, 'members', uid), { role: newRole });
      setMembers(prev => prev.map(m => m.uid === uid ? { ...m, role: newRole } : m));
    } catch (err) {
      console.error(err);
      showAlert('Failed to update role.');
    }
  }

  async function removeMember(uid) {
    try {
      const chatId = group.chatId || `group_${groupId}`;
      await Promise.all([
        deleteDoc(doc(db, 'groups', groupId, 'members', uid)),
        updateDoc(doc(db, 'groups', groupId), { memberCount: Math.max((group.memberCount || 1) - 1, 0) }),
        updateDoc(doc(db, 'chats', chatId), { participants: arrayRemove(uid) }),
        updateDoc(doc(db, 'users', uid), { groupIds: arrayRemove(groupId) }),
      ]);
      setMembers(prev => prev.filter(m => m.uid !== uid));
      setGroup(g => ({ ...g, memberCount: Math.max((g.memberCount || 1) - 1, 0) }));
    } catch (err) {
      console.error(err);
      showAlert('Failed to remove member.');
    }
  }

  async function deleteGroup() {
    setDeleting(true);
    try {
      const chatId = group.chatId || `group_${groupId}`;
      // Remove groupId from all member user docs
      await Promise.all(members.map(m =>
        updateDoc(doc(db, 'users', m.uid), { groupIds: arrayRemove(groupId) }).catch(() => {})
      ));
      // Delete member docs
      const batch = writeBatch(db);
      members.forEach(m => batch.delete(doc(db, 'groups', groupId, 'members', m.uid)));
      await batch.commit();
      // Delete chat and group docs
      await Promise.all([
        deleteDoc(doc(db, 'groups', groupId)),
        deleteDoc(doc(db, 'chats', chatId)),
      ]);
      navigate('/groups');
    } catch (err) {
      console.error(err);
      showAlert('Failed to delete group.');
      setDeleting(false);
    }
  }

  if (loading) return (
    <Box py="xl" style={{ display: 'flex', justifyContent: 'center' }}>
      <Loader color="gray" size="sm" />
    </Box>
  );

  if (!group || (myRole !== 'owner' && myRole !== 'admin')) {
    return <Text ta="center" py="xl" c="dimmed">You don't have permission to manage this group.</Text>;
  }

  return (
    <Stack gap={0} py="xl" px={{ base: 'md', sm: 'xl' }} maw={700} mx="auto" className="page-enter">
      <title>manage group | skillmesa</title>

      <Group gap="xs" mb="xl">
        <ActionIcon variant="subtle" color="gray" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} />
        </ActionIcon>
        <Text size="sm" c="dimmed" style={{ cursor: 'pointer' }} onClick={() => navigate(-1)}>Back</Text>
      </Group>

      <Text size="xl" fw={700} mb="xl">Manage Group</Text>

      {/* Group settings */}
      <Paper withBorder p="xl" radius="md" mb="lg">
        <Text fw={600} mb="md">Group Settings</Text>
        <Stack gap="md">
          <TextInput label="Group name" value={name} onChange={e => setName(e.target.value)} required />
          <Textarea label="Description" value={description} onChange={e => setDescription(e.target.value)} autosize minRows={2} />
          <Button loading={saving} onClick={handleSave}>Save changes</Button>
        </Stack>
      </Paper>

      {/* Members */}
      <Paper withBorder p="xl" radius="md" mb="lg">
        <Text fw={600} mb="md">Members</Text>
        <Stack gap="md">
          {members.map((m, i) => (
            <React.Fragment key={m.uid}>
              <MemberManageRow
                uid={m.uid} role={m.role} groupId={groupId}
                currentUserRole={myRole}
                onRoleChange={changeRole}
                onRemove={removeMember}
              />
              {i < members.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </Stack>

        {/* Add member */}
        <Divider my="md" />
        <Text size="sm" fw={500} mb="xs">Add member</Text>
        <TextInput
          placeholder="Search by name or username…"
          value={addSearch}
          onChange={e => setAddSearch(e.target.value)}
          leftSection={<Search size={14} />}
          mb="xs"
        />
        {addSearching && <Loader size="xs" color="gray" mx="auto" />}
        {addResults.map(user => (
          <Paper key={user.uid} withBorder p="xs" radius="md" mb="xs">
            <Group gap="sm">
              <Avatar src={user.profilePic?.currentUrl || null} size={32} radius="xl" />
              <Box style={{ flex: 1, minWidth: 0 }}>
                <Text size="sm" fw={500} truncate>{user.displayName || '(No name)'}</Text>
                {user.username && <Text size="xs" c="dimmed">@{user.username}</Text>}
              </Box>
              <Button size="xs" variant="default" loading={adding === user.uid} onClick={() => addMember(user)}>
                Add
              </Button>
            </Group>
          </Paper>
        ))}
      </Paper>

      {/* Danger zone — owner only */}
      {myRole === 'owner' && (
        <Paper withBorder p="xl" radius="md" style={{ borderColor: 'var(--mantine-color-red-6)' }}>
          <Text fw={600} c="red" mb="xs">Danger Zone</Text>
          <Text size="sm" c="dimmed" mb="md">Deleting a group is permanent and cannot be undone.</Text>
          <Button color="red" variant="outline" leftSection={<Trash2 size={14} />} onClick={() => setDeleteOpen(true)}>
            Delete group
          </Button>
        </Paper>
      )}

      <Modal opened={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete group" centered>
        <Text size="sm" mb="xl">
          Are you sure you want to delete <strong>{group.name}</strong>? All members will lose access and this cannot be undone.
        </Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button color="red" loading={deleting} onClick={deleteGroup}>Delete permanently</Button>
        </Group>
      </Modal>
    </Stack>
  );
}
