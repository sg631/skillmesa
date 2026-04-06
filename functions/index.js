import { onDocumentCreated, onDocumentUpdated, onDocumentDeleted } from "firebase-functions/v2/firestore";
import { defineSecret } from "firebase-functions/params";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { algoliasearch } from "algoliasearch";

initializeApp();
const db = getFirestore();

const ALGOLIA_APP_ID = "ZLB86D2P4X";
const ALGOLIA_INDEX = "skmesa_algolia_index";
const algoliaAdminKey = defineSecret("ALGOLIA_ADMIN_KEY");

function getAlgoliaClient() {
  return algoliasearch(ALGOLIA_APP_ID, algoliaAdminKey.value());
}

async function fetchOwnerData(ownerUid) {
  const userSnap = await db.collection("users").doc(ownerUid).get();
  if (!userSnap.exists) {
    return { ownerDisplayName: "Unknown", ownerProfilePicUrl: "" };
  }
  const userData = userSnap.data();
  return {
    ownerDisplayName: userData.displayName || userData.fullname || "Unknown",
    ownerProfilePicUrl: userData.profilePic?.currentUrl || userData.profilePic?.svgDataUrl || "",
  };
}

function buildAlgoliaRecord(docId, data, ownerData) {
  return {
    objectID: docId,
    title: data.title || "",
    description: data.description || "",
    owner: data.owner || "",
    ownerType: data.ownerType || "user",
    ownerGroupId: data.ownerGroupId || null,
    ownerDisplayName: ownerData.ownerDisplayName,
    ownerProfilePicUrl: ownerData.ownerProfilePicUrl,
    rating:      data.rating ?? null,
    reviewCount: data.reviewCount ?? 0,
    tags: data.tags || [],
    category: data.category || "",
    type: data.type || "",
    online: data.online ?? false,
    modality: data.online ? "Online" : "In-Person",
    thumbnailURL: data.thumbnailURL || "",
    price: typeof data.price === "number" ? data.price : 0,
    zipCode: data.zipCode || "",
    createdAt: data.createdAt || "",
    createdAtTimestamp: data.createdAt ? Math.floor(new Date(data.createdAt).getTime() / 1000) : 0,
    shares: data.shares || 0,
  };
}

// Sync new listings to Algolia — skip archived listings
export const onListingCreated = onDocumentCreated(
  { document: "listings/{listingId}", secrets: [algoliaAdminKey] },
  async (event) => {
    const data = event.data.data();
    const docId = event.params.listingId;

    // Don't index archived listings
    if (data.archived === true) {
      console.log(`Skipping archived listing ${docId}`);
      return;
    }

    const ownerData = await fetchOwnerData(data.owner);
    const record = buildAlgoliaRecord(docId, data, ownerData);
    const client = getAlgoliaClient();
    await client.saveObject({ indexName: ALGOLIA_INDEX, body: record });
    console.log(`Indexed new listing ${docId} to Algolia`);
  }
);

// Sync updated listings to Algolia — handle archive/unarchive transitions
export const onListingUpdated = onDocumentUpdated(
  { document: "listings/{listingId}", secrets: [algoliaAdminKey] },
  async (event) => {
    const before = event.data.before.data();
    const after  = event.data.after.data();
    const docId  = event.params.listingId;
    const client = getAlgoliaClient();

    const wasArchived = before.archived === true;
    const isArchived  = after.archived  === true;

    if (isArchived && !wasArchived) {
      // Listing was just archived — remove from search index
      await client.deleteObject({ indexName: ALGOLIA_INDEX, objectID: docId });
      console.log(`Removed archived listing ${docId} from Algolia`);
      return;
    }

    if (wasArchived && !isArchived) {
      // Listing was just unarchived — re-add to search index
      const ownerData = await fetchOwnerData(after.owner);
      const record = buildAlgoliaRecord(docId, after, ownerData);
      await client.saveObject({ indexName: ALGOLIA_INDEX, body: record });
      console.log(`Re-indexed unarchived listing ${docId} in Algolia`);
      return;
    }

    if (isArchived) {
      // Still archived, no index update needed
      return;
    }

    // Normal update — sync the record
    const ownerData = await fetchOwnerData(after.owner);
    const record = buildAlgoliaRecord(docId, after, ownerData);
    await client.saveObject({ indexName: ALGOLIA_INDEX, body: record });
    console.log(`Updated listing ${docId} in Algolia`);
  }
);

// Remove deleted listings from Algolia
export const onListingDeleted = onDocumentDeleted(
  { document: "listings/{listingId}", secrets: [algoliaAdminKey] },
  async (event) => {
    const docId = event.params.listingId;
    const client = getAlgoliaClient();
    await client.deleteObject({ indexName: ALGOLIA_INDEX, objectID: docId });
    console.log(`Deleted listing ${docId} from Algolia`);
  }
);

// When a user updates their profile, propagate name/pic to their listings in Algolia
export const onUserUpdated = onDocumentUpdated(
  { document: "users/{userId}", secrets: [algoliaAdminKey] },
  async (event) => {
    const before = event.data.before.data();
    const after  = event.data.after.data();

    const nameChanged =
      (before.displayName || before.fullname) !== (after.displayName || after.fullname);
    const picChanged =
      (before.profilePic?.currentUrl || before.profilePic?.svgDataUrl) !==
      (after.profilePic?.currentUrl  || after.profilePic?.svgDataUrl);

    if (!nameChanged && !picChanged) return;

    const userId = event.params.userId;
    // Only update non-archived listings
    const listingsSnap = await db
      .collection("listings")
      .where("owner", "==", userId)
      .where("archived", "!=", true)
      .get();

    if (listingsSnap.empty) return;

    const updates = listingsSnap.docs.map((doc) => ({
      objectID: doc.id,
      ownerDisplayName: after.displayName || after.fullname || "Unknown",
      ownerProfilePicUrl: after.profilePic?.currentUrl || after.profilePic?.svgDataUrl || "",
    }));

    const client = getAlgoliaClient();
    await client.partialUpdateObjects({
      indexName: ALGOLIA_INDEX,
      objects: updates,
    });
    console.log(`Updated ${updates.length} Algolia records for user ${userId}`);
  }
);
