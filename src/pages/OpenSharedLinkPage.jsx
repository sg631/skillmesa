import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { doc, getDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "../firebase";

function OpenSharedLinkPage() {
  const { listingId } = useParams();

  useEffect(() => {
    async function handleShareRedirect() {
      console.log("ListingId param:", listingId);
      if (!listingId) return;

      try {
        const listingRef = doc(db, "listings", listingId);
        const listingSnap = await getDoc(listingRef);

        if (!listingSnap.exists()) {
          console.warn("Listing not found:", listingId);
          window.location.href = "/notfound";
          return;
        }

        console.log("Listing found, updating shares...");
        await updateDoc(listingRef, { shares: increment(1) });

        window.location.replace(`/listing/${listingId}`);
      } catch (err) {
        console.error("Error updating shares or redirecting:", err);
        window.location.href = "/error";
      }
    }

    handleShareRedirect();
  }, [listingId]);

  return (
    <div style={{ textAlign: "center", padding: "2em" }}>
      <p>Opening link...</p>
    </div>
  );
}

export default OpenSharedLinkPage;
