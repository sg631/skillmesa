# Algolia Search Migration — Explore Page

## Context

The Explore page (`src/pages/ExplorePage.jsx`) currently uses direct Firestore queries with a manual filter form (zip, type, modality, category, price range, tags) plus 16 hardcoded category panels. There is no free-text search — only exact-match filters. This migration replaces it with Algolia-powered instant search supporting natural language queries via the SearchBox + Query Rules, on the free Algolia tier. The `instantsearch-app/` prototype proved the concept but was never integrated.

**Key dependencies already installed but unused:** `algoliasearch@^5.47.0`, `react-instantsearch@^7.22.1`
**Algolia index:** `skmesa_algolia_index` (App ID: `ZLB86D2P4X`)
**Firebase:** Blaze plan, project `skill-mesa`

---

## Phase 1: Backend — Firestore-to-Algolia Sync via Cloud Functions

### 1.1 Create `functions/` directory

```
functions/
  package.json       # firebase-functions (v2), firebase-admin, algoliasearch
  index.js           # 4 Firestore trigger functions
  scripts/
    backfill.js      # One-time script to seed index with existing listings
```

### 1.2 Cloud Functions (`functions/index.js`)

Four trigger functions using Firebase Functions v2 (`onDocumentCreated`, `onDocumentUpdated`, `onDocumentDeleted`):

| Function | Trigger | Action |
|----------|---------|--------|
| `onListingCreated` | `listings/{id}` created | Fetch owner from `users/{owner}`, build Algolia record with denormalized owner data, `saveObject()` |
| `onListingUpdated` | `listings/{id}` updated | Same as create — re-fetch owner, rebuild full record, `saveObject()` (upsert) |
| `onListingDeleted` | `listings/{id}` deleted | `deleteObject()` by doc ID |
| `onUserUpdated` | `users/{id}` updated | If displayName or profilePic changed, query all listings with `owner == userId`, batch `partialUpdateObjects()` to update `ownerDisplayName`/`ownerProfilePicUrl` |

**Algolia record schema:**

```js
{
  objectID: "<firestoreDocId>",
  title, description, owner,
  ownerDisplayName,         // denormalized from users/{owner}
  ownerProfilePicUrl,       // denormalized from users/{owner}.profilePic.currentUrl
  rating, tags, category,
  type,                     // "class" | "service"
  online,                   // boolean
  modality,                 // derived: "Online" | "In-Person" (for faceting)
  thumbnailURL, price, zipCode,
  createdAt,                // ISO string
  createdAtTimestamp,       // Unix seconds (for custom ranking)
  shares
}
```

### 1.3 Backfill script (`functions/scripts/backfill.js`)

Run once locally: reads all `listings` docs, fetches each owner from `users`, pushes to Algolia with `saveObjects()`.

### 1.4 Config changes

- **`firebase.json`** — add `"functions": { "source": "functions" }`
- **Firebase secret** — `firebase functions:secrets:set ALGOLIA_ADMIN_KEY`

### 1.5 Deploy & verify

```bash
cd functions && npm install
firebase deploy --only functions
node scripts/backfill.js
```

Verify records appear in Algolia Dashboard with correct schema + owner data.

---

## Phase 2: Algolia Dashboard Configuration

### 2.1 Searchable attributes (priority order)

1. `title`
2. `description`
3. `tags` (unordered)
4. `category` (unordered)
5. `ownerDisplayName` (unordered)
6. `zipCode` (unordered)

### 2.2 Faceting attributes

| Attribute | Type |
|-----------|------|
| `type` | filter only |
| `modality` | filter only |
| `category` | filter only |
| `tags` | searchable |
| `price` | filter only (numeric) |
| `zipCode` | filter only |

### 2.3 Custom ranking (after relevance)

1. `desc(createdAtTimestamp)` — newer first
2. `desc(shares)` — more popular first

### 2.4 Query Rules (37 rules)

Each keyword gets its own rule. For every rule in the Algolia Dashboard (**Enhance > Rules > Create Rule**), configure:

**Condition section:**
- Toggle **Query** on, set dropdown to **"Contains"**, enter the keyword
- Check **"Apply to plurals, synonyms and typos"**

**Consequence section — add TWO consequences per rule:**
1. **Remove Word** → enter the same keyword
2. **Add Query Parameter** → enter the filter JSON

#### Price rules

| Query (keyword) | Remove Word | Add Query Parameter |
|-----------------|-------------|---------------------|
| `cheap` | `cheap` | `{"filters":"price <= 20"}` |
| `affordable` | `affordable` | `{"filters":"price <= 20"}` |
| `budget` | `budget` | `{"filters":"price <= 20"}` |
| `free` | `free` | `{"filters":"price = 0"}` |
| `expensive` | `expensive` | `{"filters":"price >= 50"}` |
| `premium` | `premium` | `{"filters":"price >= 50"}` |

#### Modality rules

| Query (keyword) | Remove Word | Add Query Parameter |
|-----------------|-------------|---------------------|
| `online` | `online` | `{"filters":"modality:Online"}` |
| `in-person` | `in-person` | `{"filters":"modality:In-Person"}` |
| `in person` | `in person` | `{"filters":"modality:In-Person"}` |
| `local` | `local` | `{"filters":"modality:In-Person"}` |

#### Type rules

| Query (keyword) | Remove Word | Add Query Parameter |
|-----------------|-------------|---------------------|
| `class` | `class` | `{"filters":"type:class"}` |
| `classes` | `classes` | `{"filters":"type:class"}` |
| `service` | `service` | `{"filters":"type:service"}` |
| `services` | `services` | `{"filters":"type:service"}` |

#### Category rules

| Query (keyword) | Remove Word | Add Query Parameter |
|-----------------|-------------|---------------------|
| `tutoring` | `tutoring` | `{"filters":"category:tutoring"}` |
| `tutor` | `tutor` | `{"filters":"category:tutoring"}` |
| `math` | `math` | `{"filters":"category:math"}` |
| `music` | `music` | `{"filters":"category:music"}` |
| `coding` | `coding` | `{"filters":"category:coding"}` |
| `programming` | `programming` | `{"filters":"category:coding"}` |
| `code` | `code` | `{"filters":"category:coding"}` |
| `art` | `art` | `{"filters":"category:art"}` |
| `drawing` | `drawing` | `{"filters":"category:art"}` |
| `painting` | `painting` | `{"filters":"category:art"}` |
| `language` | `language` | `{"filters":"category:language"}` |
| `spanish` | `spanish` | `{"filters":"category:language"}` |
| `french` | `french` | `{"filters":"category:language"}` |
| `design` | `design` | `{"filters":"category:design"}` |
| `writing` | `writing` | `{"filters":"category:writing"}` |
| `editing` | `editing` | `{"filters":"category:writing"}` |
| `business` | `business` | `{"filters":"category:business"}` |
| `marketing` | `marketing` | `{"filters":"category:business"}` |
| `health` | `health` | `{"filters":"category:health"}` |
| `fitness` | `fitness` | `{"filters":"category:health"}` |
| `yoga` | `yoga` | `{"filters":"category:health"}` |
| `volunteering` | `volunteering` | `{"filters":"category:volunteering"}` |
| `volunteer` | `volunteer` | `{"filters":"category:volunteering"}` |

**Example:** A user types "cheap online math classes" — 4 rules fire:
- `cheap` → removed, adds `price <= 20`
- `online` → removed, adds `modality:Online`
- `math` → removed, adds `category:math`
- `classes` → removed, adds `type:class`

Remaining query is empty, so Algolia returns all listings matching those 4 filters combined.

### 2.5 Synonyms (optional)

- "programming" <=> "coding" <=> "development"
- "tutoring" <=> "tutor" <=> "homework help"

---

## Phase 3: Frontend Migration

### 3.1 Create `src/algolia.js`

Search client singleton using env vars:

```js
import { liteClient as algoliasearch } from "algoliasearch/lite";

export const searchClient = algoliasearch(
  import.meta.env.VITE_ALGOLIA_APP_ID,
  import.meta.env.VITE_ALGOLIA_SEARCH_KEY
);

export const ALGOLIA_INDEX_NAME = "skmesa_algolia_index";
```

Add to `.env`:

```
VITE_ALGOLIA_APP_ID=ZLB86D2P4X
VITE_ALGOLIA_SEARCH_KEY=75c1f2679421d9eba705fd5fe6bfa612
```

### 3.2 Create `src/components/AlgoliaHit.jsx`

Custom hit component matching the **exact** DOM structure and CSS classes of the existing `ListingComponent` (`src/components/ListingComponent.jsx:83-123`), but reads all data directly from the `hit` object — **zero Firestore fetches**:

- `.listing` container (350x765px card)
- `.listing-type-label[data-value]` — color-coded type banner
- `.listing-online-label[data-value]` — color-coded modality banner
- `.listing-zip-label` — zip code banner
- `.listing-thumbnail` — from `hit.thumbnailURL`
- `.listing-title` — uses `<Highlight attribute="title" hit={hit} />` for search highlighting
- `.listing-description` — uses `<Highlight attribute="description" hit={hit} />`
- `.listing-tags-container` with `.listing-tag` items from `hit.tags`
- `.controls-acc` with owner profile pic (`hit.ownerProfilePicUrl`), owner name (`hit.ownerDisplayName`), "View Listing" link to `/listing/{hit.objectID}`, "Manage Listing" link (disabled unless owner)

Reuses existing `LinkButton` from `src/components/LinkElements.jsx`.

### 3.3 Rewrite `src/pages/ExplorePage.jsx`

**Complete replacement.** Remove `useExploreSearch` hook, remove all 16 hardcoded category panels, remove Firestore imports.

New structure using `react-instantsearch` widgets:

```jsx
<InstantSearch searchClient={searchClient} indexName={ALGOLIA_INDEX_NAME} routing>
  <Configure hitsPerPage={12} />

  <div className="explore-layout">
    {/* Left sidebar (320px sticky) */}
    <aside className="search-filter-panel">
      <SearchBox />
      <CurrentRefinements />
      <ClearRefinements />
      <h4>Type</h4>
      <RefinementList attribute="type" />
      <h4>Modality</h4>
      <RefinementList attribute="modality" />
      <h4>Category</h4>
      <RefinementList attribute="category" />
      <h4>Price Range</h4>
      <RangeInput attribute="price" />
      <h4>Tags</h4>
      <RefinementList attribute="tags" searchable />
    </aside>

    {/* Right results area */}
    <main className="explore-results">
      <Stats />
      <Hits hitComponent={AlgoliaHit} />
      <Pagination />
    </main>
  </div>
</InstantSearch>
```

The `routing` prop auto-syncs search state to URL query params.

### 3.4 Add Algolia base CSS

Add to `index.html` `<head>`:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/instantsearch.css@8/themes/satellite-min.css" />
```

### 3.5 CSS additions in `src/index.css`

- `.explore-layout` — two-column flex container
- Update `.search-filter-panel` — change from 500px centered card to 320px sticky sidebar
- `.explore-results` — `flex: 1`
- `.ais-Hits-list` — CSS grid: `repeat(auto-fill, minmax(350px, 1fr))` for responsive card layout
- Override Algolia widget styles (`.ais-SearchBox-input`, `.ais-Pagination`, `.ais-RefinementList`, `.ais-RangeInput`) to match existing design (rounded inputs, blue focus shadows, button 3D effect)

### 3.6 Verify `instantsearch.js` peer dependency

`react-instantsearch` may need `instantsearch.js` as a peer dep (for the `routing` import). Check with `npm ls instantsearch.js`; install if missing.

---

## Phase 4: Cleanup

- **Delete** `instantsearch-app/` directory (obsolete prototype — wrong React/algoliasearch versions, wrong bundler)
- **Remove** unused Firestore imports from ExplorePage (`collection`, `query`, `where` from `firebase/firestore`)

---

## Files Changed Summary

### Create (5 files)

| File | Purpose |
|------|---------|
| `functions/package.json` | Cloud Functions dependencies |
| `functions/index.js` | 4 Firestore triggers for Algolia sync |
| `functions/scripts/backfill.js` | One-time index seeding |
| `src/algolia.js` | Algolia search client singleton |
| `src/components/AlgoliaHit.jsx` | Custom hit card matching existing design |

### Modify (5 files)

| File | Change |
|------|--------|
| `src/pages/ExplorePage.jsx` | Complete rewrite — InstantSearch + Algolia widgets |
| `src/index.css` | Add explore layout + Algolia widget style overrides |
| `firebase.json` | Add `"functions"` config |
| `.env` | Add `VITE_ALGOLIA_APP_ID` and `VITE_ALGOLIA_SEARCH_KEY` |
| `index.html` | Add Algolia satellite CSS `<link>` |

### Delete (1 directory)

| Path | Reason |
|------|--------|
| `instantsearch-app/` | Obsolete standalone prototype |

### Unchanged (key files)

| File | Reason |
|------|--------|
| `src/components/ListingComponent.jsx` | Still used by HomePage, ProfilePage via ListingsPanel |
| `src/components/ListingsPanel.jsx` | Still used by HomePage, ProfilePage |
| `src/pages/HomePage.jsx` | Small-scope Firestore query for user's own listings |
| `src/pages/ProfilePage.jsx` | Small-scope Firestore query for a user's listings |
| `src/pages/CreateListingPage.jsx` | Writes to Firestore; Cloud Function handles Algolia sync |
| `src/pages/ManagePage.jsx` | Updates/deletes in Firestore; Cloud Function handles sync |
| `src/firebase.js` | Still needed for all non-search operations |

---

## Verification

### Backend sync

1. Create a listing via CreateListingPage — verify it appears in Algolia Dashboard within seconds with `ownerDisplayName` populated
2. Edit the listing via ManagePage — verify the Algolia record updates
3. Delete the listing — verify it disappears from Algolia
4. Update user profile (change display name) — verify all that user's Algolia records update

### Query Rules (Dashboard test tool)

- "cheap online math" → returns online math listings with price <= 20
- "free tutoring" → returns tutoring listings with price = 0
- "piano lessons" → full-text match on title/description/tags

### Frontend

1. Type a query in SearchBox — verify instant results
2. Click facet filters (type, modality, category) — verify additive filtering
3. Use price range inputs — verify numeric filtering
4. Click "Clear all" — verify all refinements reset
5. Verify hit cards match existing ListingComponent design (labels, thumbnail, tags, owner info)
6. Click "View Listing" — navigates to `/listing/:id`
7. Click owner name — navigates to `/profile/:uid`
8. Apply filters, copy URL, open in new tab — same results appear (URL routing)
9. Visit `/home`, `/profile/:uid` — still work with Firestore-based ListingsPanel
10. Empty search (no query, no filters) — returns all listings sorted by recency
