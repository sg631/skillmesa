import { onDocumentCreated, onDocumentUpdated, onDocumentDeleted } from "firebase-functions/v2/firestore";
import { onRequest } from "firebase-functions/v2/https";
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
  if (!ownerUid) return { ownerDisplayName: "", ownerProfilePicUrl: "" };
  const userSnap = await db.collection("users").doc(ownerUid).get();
  if (!userSnap.exists) return { ownerDisplayName: "", ownerProfilePicUrl: "" };
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
    // Location — structured international format
    ...(data.location?.lat != null ? {
      _geoloc: { lat: data.location.lat, lng: data.location.lng },
    } : {}),
    locationCity:        data.location?.city        || "",
    locationRegion:      data.location?.region      || "",
    locationCountry:     data.location?.country     || "",
    locationCountryCode: data.location?.countryCode || "",
    // Keep zipCode for backward compat with older listings
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

// Fields whose change requires a full Algolia record rebuild.
// If NONE of these changed, we do a cheaper partial update instead.
const STRUCTURAL_FIELDS = [
  "title", "description", "owner", "ownerType", "ownerGroupId",
  "type", "online", "category", "tags", "price", "zipCode",
  "thumbnailURL", "archived", "location", "editors",
];

function structuralFieldChanged(before, after) {
  return STRUCTURAL_FIELDS.some(k => JSON.stringify(before[k]) !== JSON.stringify(after[k]));
}

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

    // If no structural field changed (only stats like rating/viewCount/shares),
    // do a targeted partial update instead of a full rebuild.
    // This prevents any risk of overwriting ownerDisplayName during routine stat updates.
    if (!structuralFieldChanged(before, after)) {
      const partial = {
        objectID: docId,
        rating:          (after.rating != null && after.rating >= 0) ? after.rating : null,
        reviewCount:     after.reviewCount      ?? 0,
        viewCount:       after.viewCount        ?? 0,
        shares:          after.shares           ?? 0,
        sources:         after.sources          ?? {},
        enrollmentCount: after.enrollmentCount  ?? 0,
      };
      await client.partialUpdateObjects({ indexName: ALGOLIA_INDEX, objects: [partial] });
      console.log(`Partial stats update for listing ${docId} in Algolia`);
      return;
    }

    // Full rebuild for structural changes
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

// ── Dynamic sitemap ───────────────────────────────────────────────────
// Served via Firebase Hosting rewrite at /sitemap-dynamic.xml
// Crawls non-archived listings and public user profiles from Firestore.
export const sitemapDynamic = onRequest(
  { cors: false, invoker: "public" },
  async (req, res) => {
    const BASE = "https://skillmesa.com";

    try {
      // Fetch all non-archived listings
      const listingsSnap = await db
        .collection("listings")
        .where("archived", "!=", true)
        .get();

      // Fetch all users (for profile pages)
      const usersSnap = await db.collection("users").get();

      const now = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

      const listingUrls = listingsSnap.docs.map((d) => {
        const data = d.data();
        const lastmod = data.updatedAt
          ? new Date(data.updatedAt).toISOString().split("T")[0]
          : now;
        return `  <url>
    <loc>${BASE}/listing/${d.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
      });

      const profileUrls = usersSnap.docs.map((d) => `  <url>
    <loc>${BASE}/profile/${d.id}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`);

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...listingUrls, ...profileUrls].join("\n")}
</urlset>`;

      res.set("Content-Type", "application/xml");
      res.set("Cache-Control", "public, max-age=3600, s-maxage=3600");
      res.status(200).send(xml);
    } catch (err) {
      console.error("sitemapDynamic error:", err);
      res.status(500).send("Failed to generate sitemap");
    }
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
