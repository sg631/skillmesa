import React from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { LinkButton } from "../components/LinkElements.jsx";
import { Title, Text, Stack, Avatar, Badge, Group, Paper, Loader, Button } from "@mantine/core";

async function fetchProfileData(userUID) {
  try {
    const userDocRef = doc(db, "users", userUID);
    const userSnap = await getDoc(userDocRef);
    if (userSnap.exists()) {
      return userSnap.data();
    } else {
      console.warn("No user found with UID:", userUID);
      return null;
    }
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
}

function ContactPage() {
  const { userUIDparam } = useParams();
  const [profileData, setProfileData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      setLoading(true);
      const data = await fetchProfileData(userUIDparam);
      if (isMounted) {
        setProfileData(data);
        setLoading(false);
      }
    }

    if (userUIDparam) loadProfile();
    return () => { isMounted = false; };
  }, [userUIDparam]);

  if (loading) {
    return (
      <Stack align="center" py="xl">
        <title>Skillmesa | Loading...</title>
        <Loader color="cyan" />
      </Stack>
    );
  }

  if (!profileData) {
    return (
      <Stack align="center" py="xl">
        <title>Skillmesa | Not Found</title>
        <Title order={1}>User not found</Title>
        <Text c="dimmed">The profile you're looking for doesn't exist.</Text>
      </Stack>
    );
  }

  const displayName = profileData.displayName || "Unnamed User";

  return (
    <Stack align="center" gap="lg" py="xl">
      <title>contacts | skillmesa</title>
      <Title order={1}>{displayName}</Title>

      <Group gap="xs" align="center">
        {profileData.profilePic?.currentUrl && (
          <Avatar src={profileData.profilePic.currentUrl} size="sm" radius="xl" />
        )}
        <Badge variant="light" color="yellow" size="lg" radius="md">
          {profileData.username || "N/A"}
        </Badge>
      </Group>

      <Paper shadow="sm" p="xl" radius="md" withBorder maw={500} w="100%">
        <Stack gap="md">
          <div>
            <Text size="sm" c="dimmed">Email</Text>
            <Text size="xl" fw={500}>{profileData.contact?.email || "No email"}</Text>
          </div>
          <LinkButton to={"mailto:" + (profileData.contact?.email || "")} fullWidth>
            Send Email
          </LinkButton>
        </Stack>
      </Paper>

      <Paper shadow="sm" p="xl" radius="md" withBorder maw={500} w="100%">
        <Stack gap="md">
          <div>
            <Text size="sm" c="dimmed">Phone number</Text>
            <Text size="xl" fw={500}>{profileData.contact?.phone || "No attached phone number"}</Text>
          </div>
          <Button disabled fullWidth variant="light">
            Chat (COMING SOON)
          </Button>
        </Stack>
      </Paper>
    </Stack>
  );
}

export default ContactPage;
