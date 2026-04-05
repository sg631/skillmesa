import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import {
  Title, Text, Stack, Avatar, Group, Paper, Loader, Button, Box,
} from "@mantine/core";
import { Mail, MessageSquare } from "lucide-react";

async function fetchProfileData(uid) {
  try {
    const snap = await getDoc(doc(db, "users", uid));
    return snap.exists() ? snap.data() : null;
  } catch (err) {
    console.error("Error fetching profile:", err);
    return null;
  }
}

function ContactPage() {
  const { userUIDparam } = useParams();
  const navigate = useNavigate();
  const [profileData, setProfileData] = React.useState(null);
  const [loading, setLoading]         = React.useState(true);

  React.useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      const data = await fetchProfileData(userUIDparam);
      if (isMounted) { setProfileData(data); setLoading(false); }
    }
    if (userUIDparam) load();
    return () => { isMounted = false; };
  }, [userUIDparam]);

  if (loading) {
    return (
      <Box py="xl" style={{ display: 'flex', justifyContent: 'center' }}>
        <Loader color="gray" size="sm" />
      </Box>
    );
  }

  if (!profileData) {
    return (
      <Stack align="center" py="xl">
        <Title order={2}>User not found</Title>
        <Text c="dimmed">The profile you're looking for doesn't exist.</Text>
      </Stack>
    );
  }

  const displayName = profileData.displayName || "Unnamed User";
  const email       = profileData.contact?.email;
  const phone       = profileData.contact?.phone;

  return (
    <Stack align="center" gap="lg" py="xl" px="md" maw={500} mx="auto" className="page-enter">
      <title>contact | skillmesa</title>

      <Group gap="sm">
        {profileData.profilePic?.currentUrl && (
          <Avatar src={profileData.profilePic.currentUrl} size="md" radius="xl" />
        )}
        <Title order={2}>{displayName}</Title>
      </Group>

      {/* Email */}
      {email ? (
        <Paper withBorder p="xl" radius="md" w="100%">
          <Stack gap="sm">
            <Text size="xs" c="dimmed" fw={500} tt="uppercase">Email</Text>
            <Text fw={500}>{email}</Text>
            <Button
              variant="default"
              leftSection={<Mail size={14} />}
              onClick={() => window.open(`mailto:${email}`)}
              fullWidth
            >
              Send Email
            </Button>
          </Stack>
        </Paper>
      ) : (
        <Paper withBorder p="xl" radius="md" w="100%">
          <Text size="sm" c="dimmed">No email listed.</Text>
        </Paper>
      )}

      {/* Phone */}
      {phone && (
        <Paper withBorder p="xl" radius="md" w="100%">
          <Stack gap="sm">
            <Text size="xs" c="dimmed" fw={500} tt="uppercase">Phone</Text>
            <Text fw={500}>{phone}</Text>
          </Stack>
        </Paper>
      )}

      {/* Chat */}
      <Paper withBorder p="xl" radius="md" w="100%">
        <Stack gap="sm">
          <Text size="xs" c="dimmed" fw={500} tt="uppercase">Chat</Text>
          <Text size="sm" c="dimmed">Send direct messages through Skillmesa.</Text>
          <Button
            leftSection={<MessageSquare size={14} />}
            onClick={() => navigate(`/chat/${userUIDparam}`)}
            fullWidth
          >
            Open Chat
          </Button>
        </Stack>
      </Paper>
    </Stack>
  );
}

export default ContactPage;
