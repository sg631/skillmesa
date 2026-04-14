import React from "react";
import { useParams } from "react-router-dom";
import useSEO from '../hooks/useSEO';
import { doc, getDoc, collection, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { LinkButton } from "../components/LinkElements.jsx";
import ListingsPanel from '../components/ListingsPanel.jsx';
import { Title, Text, Stack, Avatar, Code, Badge, Group, Loader } from "@mantine/core";
import PlatformRoleBadge from '../components/PlatformRoleBadge.jsx';

const listingsCollection = collection(db, "listings");
const listingsByOwnerQuery = (ownerUID) => query(listingsCollection, where("owner", "==", ownerUID));

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

function ProfilePage() {
  const { userUIDparam } = useParams();
  const [profileData, setProfileData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  const displayName = profileData?.displayName || "Unnamed User";
  useSEO({
    title: profileData ? `${displayName}'s Profile` : undefined,
    description: profileData
      ? `View ${displayName}'s services and classes on Skillmesa.`
      : undefined,
    path: userUIDparam ? `/profile/${userUIDparam}` : undefined,
  });

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
        <Loader color="gray" />
        <Text c="dimmed">Loading profile...</Text>
      </Stack>
    );
  }

  if (!profileData) {
    return (
      <Stack align="center" py="xl">
        <Title order={1}>User not found</Title>
        <Text c="dimmed">The profile you're looking for doesn't exist.</Text>
      </Stack>
    );
  }

  const ownerQuery = listingsByOwnerQuery(userUIDparam);

  return (
    <Stack align="center" gap="md" py="xl">
      <Group gap="xs" align="center" justify="center">
        <Title order={1}>{displayName}</Title>
        <PlatformRoleBadge role={profileData.platformRole} size="sm" />
      </Group>

      <Text size="sm" c="dimmed">You may know them as</Text>
      <Group gap="xs" align="center">
        {profileData.profilePic?.currentUrl && (
          <Avatar src={profileData.profilePic.currentUrl} size="sm" radius="xl" />
        )}
        <Badge variant="outline" color="gray" size="md">
          {profileData.username || "N/A"}
        </Badge>
      </Group>

      <Text>Bio: {profileData.bio || "No bio yet."}</Text>

      <Title order={2}>Listings</Title>
      <ListingsPanel
        query={ownerQuery}
        size={5}
        emptyMessage="This person has no listings yet"
        paginated={true}
      />
    </Stack>
  );
}

export default ProfilePage;
