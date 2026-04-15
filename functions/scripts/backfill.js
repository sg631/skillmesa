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
  if (!ownerUid) return { ownerDisplayName: "", ownerProfilePicUrl: "" };
  const userSnap = await db.collection("users").doc(ownerUid).get();
  if (!userSnap.exists) {
    console.warn(`  Warning: user doc not found for uid ${ownerUid}`);
    return { ownerDisplayName: "", ownerProfilePicUrl: "" };
  }
  const userData = userSnap.data();
  return {
    ownerDisplayName: userData.displayName || userData.fullname || "",
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
    rating:      (data.rating != null && data.rating >= 0) ? data.rating : null,
    reviewCount: data.reviewCount ?? 0,
    tags: data.tags || [],
    category: data.category || "",
    type: data.type || "",
    online: data.online ?? false,
    modality: data.online ? "Online" : "In-Person",
    thumbnailURL: data.thumbnailURL || "",
    price: typeof data.price === "number" ? data.price : 0,
    ...(data.location?.lat != null ? {
      _geoloc: { lat: data.location.lat, lng: data.location.lng },
    } : {}),
    locationCity:        data.location?.city        || "",
    locationRegion:      data.location?.region      || "",
    locationCountry:     data.location?.country     || "",
    locationCountryCode: data.location?.countryCode || "",
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

  let skipped = 0;
  for (const doc of listingsSnap.docs) {
    const data = doc.data();

    // Skip archived listings — they should not appear in search results
    if (data.archived === true) { skipped++; continue; }

    const ownerUid = data.owner;
    if (!ownerCache.has(ownerUid)) {
      ownerCache.set(ownerUid, await fetchOwnerData(ownerUid));
    }
    records.push(buildAlgoliaRecord(doc.id, data, ownerCache.get(ownerUid)));
  }
  if (skipped > 0) console.log(`Skipped ${skipped} archived listing(s).`);

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
