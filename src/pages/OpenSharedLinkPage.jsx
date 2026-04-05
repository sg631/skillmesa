import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "../firebase";
import { Center, Loader, Text, Stack } from "@mantine/core";

function OpenSharedLinkPage() {
  const { listingId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    async function handleShareRedirect() {
      if (!listingId) return;

      try {
        const listingRef = doc(db, "listings", listingId);
        const listingSnap = await getDoc(listingRef);

        if (!listingSnap.exists()) {
          navigate("/notfound", { replace: true });
          return;
        }

        await updateDoc(listingRef, { shares: increment(1) });
        navigate(`/listing/${listingId}`, { replace: true });
      } catch (err) {
        console.error("Error updating shares or redirecting:", err);
        navigate("/notfound", { replace: true });
      }
    }

    handleShareRedirect();
  }, [listingId, navigate]);

  return (
    <Center py="xl">
      <Stack align="center" gap="sm">
        <Loader color="cyan" />
        <Text c="dimmed">Opening link...</Text>
      </Stack>
    </Center>
  );
}

export default OpenSharedLinkPage;
