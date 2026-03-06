/**
 * One-time backfill script: reads all existing Firestore listings,
 * denormalizes owner data, and pushes them to the Algolia index.
 *
 * Usage:
 *   1. Set GOOGLE_APPLICATION_CREDENTIALS to your service account JSON path
 *   2. Set ALGOLIA_ADMIN_KEY env var
 *   3. Run: node scripts/backfill.js
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { algoliasearch } from "algoliasearch";

const ALGOLIA_APP_ID = "ZLB86D2P4X";
const ALGOLIA_INDEX = "skmesa_algolia_index";

const algoliaAdminKey = process.env.ALGOLIA_ADMIN_KEY;
if (!algoliaAdminKey) {
  console.error("Error: ALGOLIA_ADMIN_KEY env var is required.");
  process.exit(1);
}

// Initialize Firebase Admin — uses GOOGLE_APPLICATION_CREDENTIALS or default credentials
if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  initializeApp({
    credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS),
  });
} else {
  initializeApp({ projectId: "skill-mesa" });
}

const db = getFirestore();
const algolia = algoliasearch(ALGOLIA_APP_ID, algoliaAdminKey);

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
    ownerDisplayName: ownerData.ownerDisplayName,
    ownerProfilePicUrl: ownerData.ownerProfilePicUrl,
    rating: data.rating ?? -1,
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

async function backfill() {
  console.log("Fetching all listings from Firestore...");
  const listingsSnap = await db.collection("listings").get();
  console.log(`Found ${listingsSnap.size} listings.`);

  if (listingsSnap.empty) {
    console.log("No listings to backfill.");
    return;
  }

  // Cache owner data to avoid redundant reads
  const ownerCache = new Map();
  const records = [];

  for (const doc of listingsSnap.docs) {
    const data = doc.data();
    const ownerUid = data.owner;

    if (!ownerCache.has(ownerUid)) {
      ownerCache.set(ownerUid, await fetchOwnerData(ownerUid));
    }

    records.push(buildAlgoliaRecord(doc.id, data, ownerCache.get(ownerUid)));
  }

  console.log(`Pushing ${records.length} records to Algolia index "${ALGOLIA_INDEX}"...`);
  const response = await algolia.saveObjects({
    indexName: ALGOLIA_INDEX,
    objects: records,
  });

  console.log(`Backfill complete. Response:`, JSON.stringify(response, null, 2));
}

backfill().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
