/**
 * Diagnoses why a listing's ownerDisplayName is "Unknown" in Algolia.
 * Usage: ALGOLIA_ADMIN_KEY=<key> node scripts/diagnose-owner.js <listingId>
 */

import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { algoliasearch } from "algoliasearch";

const ALGOLIA_APP_ID = "ZLB86D2P4X";
const ALGOLIA_INDEX  = "skmesa_algolia_index";
const listingId = process.argv[2];

if (!listingId) {
  console.error("Usage: node scripts/diagnose-owner.js <listingId>");
  process.exit(1);
}
if (!process.env.ALGOLIA_ADMIN_KEY) {
  console.error("Missing ALGOLIA_ADMIN_KEY");
  process.exit(1);
}

if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  const { cert } = await import("firebase-admin/app");
  initializeApp({ credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS) });
} else {
  initializeApp({ projectId: "skill-mesa" });
}

const db = getFirestore();
const algolia = algoliasearch(ALGOLIA_APP_ID, process.env.ALGOLIA_ADMIN_KEY);

// 1. Check listing doc
const listingSnap = await db.collection("listings").doc(listingId).get();
if (!listingSnap.exists) {
  console.error(`Listing ${listingId} does not exist in Firestore.`);
  process.exit(1);
}
const listing = listingSnap.data();
console.log("\n=== Listing ===");
console.log("  owner field:", JSON.stringify(listing.owner));
console.log("  title:      ", listing.title);

// 2. Check user doc
const ownerUid = listing.owner;
if (!ownerUid) {
  console.error("  ERROR: listing.owner is empty/undefined — this is the bug.");
  process.exit(1);
}

const userSnap = await db.collection("users").doc(ownerUid).get();
console.log("\n=== User doc (users/" + ownerUid + ") ===");
if (!userSnap.exists) {
  console.error("  ERROR: user document does not exist in Firestore.");
} else {
  const u = userSnap.data();
  console.log("  displayName:", JSON.stringify(u.displayName));
  console.log("  fullname:   ", JSON.stringify(u.fullname));
  console.log("  username:   ", JSON.stringify(u.username));
  console.log("  email:      ", JSON.stringify(u.email));
}

// 3. Check current Algolia record
console.log("\n=== Current Algolia record ===");
try {
  const hit = await algolia.getObject({ indexName: ALGOLIA_INDEX, objectID: listingId });
  console.log("  ownerDisplayName:", JSON.stringify(hit.ownerDisplayName));
  console.log("  owner:           ", JSON.stringify(hit.owner));
} catch (e) {
  console.log("  Not found in Algolia:", e.message);
}

// 4. If user doc exists and has a name, patch Algolia now
if (userSnap.exists) {
  const u = userSnap.data();
  const name = u.displayName || u.fullname;
  if (name) {
    console.log(`\nPatching Algolia record with ownerDisplayName = "${name}"...`);
    await algolia.partialUpdateObject({
      indexName: ALGOLIA_INDEX,
      objectID: listingId,
      attributesToUpdate: {
        ownerDisplayName: name,
        ownerProfilePicUrl: u.profilePic?.currentUrl || u.profilePic?.svgDataUrl || "",
      },
    });
    console.log("Done — refresh the Explore page.");
  } else {
    console.log("\n  Both displayName and fullname are empty/missing in the user doc.");
    console.log("  Fix: update your profile name in Settings, then re-run the backfill.");
  }
}
