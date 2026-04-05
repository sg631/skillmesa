# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start Vite dev server
npm run build      # Production build (outputs to dist/)
npm run lint       # Run ESLint
npm run preview    # Preview production build locally
```

**Firebase deployment:**
```bash
firebase deploy              # Deploy hosting + functions + rules
firebase deploy --only hosting  # Deploy frontend only
firebase deploy --only functions  # Deploy Cloud Functions only
```

**Cloud Functions (inside functions/):**
```bash
cd functions && npm install   # Install function dependencies separately
firebase functions:secrets:set ALGOLIA_ADMIN_KEY  # Set secret for Algolia sync
node functions/scripts/backfill.js  # One-time backfill of existing listings to Algolia
```

## Architecture

**Skillmesa** is a React SPA — a peer-to-peer skills marketplace for teenagers to post and browse service/lesson listings.

**Stack:**
- React 19 + React Router v7 (SPA, client-side routing)
- Mantine v9 (UI components + dark mode via `useMantineColorScheme`)
- Firebase v12: Auth (email/password), Firestore (main DB), Cloud Storage (images), Cloud Functions (Algolia sync triggers)
- Algolia (`react-instantsearch` + `algoliasearch`) — search on the Explore page
- Lexical — rich text editor for listing descriptions
- Vite + SWC (build)

**No global state management** — components fetch Firestore data directly in `useEffect`. Auth state is tracked via `onAuthStateChanged` in `App.jsx` and passed down as props.

## Code Structure

```
src/
  App.jsx          — Router, nav bar, auth state initialization, page transitions
  main.jsx         — React root, MantineProvider, Notifications setup
  firebase.js      — Firebase init, exports: auth, db, storage
  algolia.js       — Algolia client setup
  theme.js         — Mantine custom theme (cyan primary)
  pages/           — One file per route; pages own their data fetching
  components/      — Reusable UI; no data fetching except ListingComponent (fetches by ID)
  styles/          — blobs.css (animated background), lexical.css (editor + Algolia highlight)
functions/
  index.js         — 4 Firestore-triggered Cloud Functions that sync listing changes to Algolia
  scripts/backfill.js — One-time script to seed Algolia from existing Firestore data
```

**Routing** (defined in `App.jsx`):

| Route | Page |
|---|---|
| `/` | StartingPage (landing) |
| `/signon` | SignonPage |
| `/home` | HomePage (user's own listings) |
| `/create` | CreateListingPage |
| `/profile/:uid` | ProfilePage |
| `/explore` | ExplorePage (Algolia search) |
| `/listing/:listingId` | ListingDetailPage |
| `/manage/:listingId` | ManagePage (edit/delete) |
| `/share/:listingId` | OpenSharedLinkPage |
| `/settings` | SettingsPage |

## Key Conventions

**UI:** Use Mantine components for all UI. Avoid adding new plain CSS; the only custom CSS is `blobs.css`, `lexical.css`, and carousel styles. Dark mode is handled automatically by Mantine.

**Firestore data model — listings:**
```js
{ title, description, owner (uid), type ("class"|"service"), online (boolean),
  category, tags[], rating, price, zipCode, thumbnailURL, createdAt, editors[] }
```

**Listing display components:**
- `ListingComponent` — renders a single listing by Firestore ID
- `ListingsPanel` — renders a paginated list from a Firestore query
- `AlgoliaHit` — renders a listing card for Algolia search results

**Alerts:** Use Mantine `notifications.show()` for toasts. Use `ShowAlert.jsx` for modal-style alerts.

**Images:** Profile pics → `users/{uid}/profilePic.{ext}`, listing thumbnails → `listings/{listingId}/thumbnail.{ext}` in Cloud Storage.

## Ongoing Migrations

**Algolia search (in progress):** Cloud Functions in `functions/index.js` are written but not yet deployed. The backfill script has not been run. Algolia widgets exist in `components/AlgoliaWidgets.jsx` and `components/AlgoliaHit.jsx`; the Explore page is partially wired up. See `ALGOLIA_MIGRATION_PLAN.md` for the full plan.

**Placeholder pages** (not yet implemented): `/notifications`, `/opportunities`, `/dashboard`.

## Environment Variables

All Firebase and Algolia keys are `VITE_`-prefixed in `.env`. Cloud Functions use a Firebase secret (`ALGOLIA_ADMIN_KEY`) set via the Firebase CLI — it is not in `.env`.
