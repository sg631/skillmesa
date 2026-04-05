import React from "react";
import { useNavigate } from "react-router-dom";
import {
  collection, query, orderBy, onSnapshot, updateDoc, doc,
} from "firebase/firestore";
import { db, auth } from "../firebase";
import {
  Title, Text, Stack, Paper, Group, Box, Loader, Indicator,
} from "@mantine/core";
import { Bell } from "lucide-react";

function timeAgo(ts) {
  if (!ts?.toDate) return "";
  const diff = (Date.now() - ts.toDate().getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function NotificationsPage() {
  const navigate = useNavigate();
  const user = auth.currentUser;
  const [items, setItems]     = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user) { setLoading(false); return; }

    const q = query(
      collection(db, "notifications", user.uid, "items"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, () => setLoading(false));

    return () => unsub();
  }, []);

  async function handleClick(item) {
    if (!item.read && user) {
      try {
        await updateDoc(doc(db, "notifications", user.uid, "items", item.id), { read: true });
      } catch {}
    }
    if (item.link) navigate(item.link);
  }

  if (!user) {
    return <Text ta="center" py="xl" c="dimmed">Sign in to view notifications.</Text>;
  }

  return (
    <Stack gap="xl" py="xl" px={{ base: 'md', sm: 'xl' }} maw={640} mx="auto" className="page-enter">
      <title>notifications | skillmesa</title>
      <Title order={2}>Notifications</Title>

      {loading ? (
        <Box style={{ display: 'flex', justifyContent: 'center' }} py="xl">
          <Loader color="gray" size="sm" />
        </Box>
      ) : items.length === 0 ? (
        <Stack align="center" gap="xs" py="xl">
          <Bell size={32} style={{ color: 'var(--mantine-color-dimmed)' }} />
          <Text c="dimmed">No notifications yet.</Text>
        </Stack>
      ) : (
        <Stack gap="xs">
          {items.map((item) => (
            <Paper
              key={item.id}
              withBorder
              p="md"
              radius="md"
              style={{
                cursor: item.link ? 'pointer' : 'default',
                opacity: item.read ? 0.6 : 1,
                transition: 'opacity 0.15s ease',
              }}
              onClick={() => handleClick(item)}
            >
              <Group gap="sm" wrap="nowrap">
                {/* Unread dot */}
                <Box
                  style={{
                    width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                    background: item.read ? 'transparent' : 'var(--accent-hex)',
                    border: item.read ? '1px solid var(--mantine-color-default-border)' : 'none',
                  }}
                />
                <Box style={{ flex: 1, minWidth: 0 }}>
                  <Text size="sm">{item.message}</Text>
                </Box>
                <Text size="xs" c="dimmed" style={{ flexShrink: 0 }}>
                  {timeAgo(item.createdAt)}
                </Text>
              </Group>
            </Paper>
          ))}
        </Stack>
      )}
    </Stack>
  );
}

export default NotificationsPage;
