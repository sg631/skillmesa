# Skillmesa — To-Do & Project Status

> Last updated: 2026-04-06
> Stack: React 19 · React Router v7 · Mantine v9 · Firebase v12 · Algolia · Lexical · Vite + SWC

---

## ⚠️ Deployment Blockers

### 🟡 Algolia sync blocked on IAM (needs project owner)
```bash
gcloud projects add-iam-policy-binding skill-mesa \
  --member=serviceAccount:service-974991188890@gcp-sa-pubsub.iam.gserviceaccount.com \
  --role=roles/iam.serviceAccountTokenCreator

gcloud projects add-iam-policy-binding skill-mesa \
  --member=serviceAccount:974991188890-compute@developer.gserviceaccount.com \
  --role=roles/run.invoker

gcloud projects add-iam-policy-binding skill-mesa \
  --member=serviceAccount:974991188890-compute@developer.gserviceaccount.com \
  --role=roles/eventarc.eventReceiver

# Then:
firebase functions:secrets:set ALGOLIA_ADMIN_KEY
firebase deploy --only functions
cd functions && ALGOLIA_ADMIN_KEY=<key> node scripts/backfill.js
```

### 🟡 Algolia Dashboard manual config (after backfill)
- Set searchable attributes: `title`, `description`, `category`, `tags`
- Set facet attributes: `type`, `online`, `category`, `tags`, `price`, `locationCity`, `locationCountry`
- Set custom ranking: `rating desc`, `createdAt desc`
- Enable Geo Search — set `_geoloc` as the geo attribute (needed for "Near me" on Explore page)

### 🟡 Known uncertainties

| Feature | Uncertainty | Risk |
|---|---|---|
| Algolia search | Index stale until functions deployed and backfill runs | Medium |
| `_geoloc` geo-search | Algolia Dashboard must enable geo search manually after backfill | Medium |
| Notifications | Any auth'd user can create notifications — no rate limit | Medium |
| Privacy enforcement | `allowDirectMessages` / `showContactInfo` stored but not enforced in UI | Medium |
| Favicon `.ico` | HTML updated to correct SVG path; no `public/favicon.ico` file generated yet | Low |
| ImageNode in Lexical | Registered but no toolbar button to insert images | Low |
| Alias redirect source | `document.referrer` often empty on mobile — shows as "direct" | Low |
| Enrolled listings dashboard | Requires `enrollments` collection group index to be built by Firestore (may take a few minutes after deploy) | Low |

---

## Full Task List

### 1. Security
- [ ] App Check (prevent API abuse)
- [x] Tighten chat message read rules — messages require participant check via `get()` on parent chat doc
- [ ] Rate-limit notification creation (move to Cloud Function trigger)
- [x] Tighten shareLinks update rule — only `totalClicks`, `sources`, `lastClickAt` for unauthenticated updates
- [x] Enrollment-gated reviews — Firestore rules + UI enforce enrollment before reviewing
- [x] Enrollment-gated files (`enroll` tier) — `isEnrolled()` helper in rules uses `exists()` on enrollment doc

### 2. Opportunities
- [ ] Users can create posts/opportunities
- [ ] Users can reply (text, attach listing, create listing in-reply)
- [ ] Matching system (suggest relevant listings/users)

### 3. Settings
- [x] Base layout (sidebar nav + sections)
- [x] Bio and text fields (display name, username, bio, birthday, contact email/phone)
- [x] Profile picture upload
- [x] Privacy section (profile visibility, allow direct messages, show contact info)

### 4. Notifications
- [x] Base layout (real-time list, unread dot, mark-as-read)
- [x] Nav bell indicator (pulsing red badge when unread count > 0)
- [x] Chat messages
- [x] Collaboration invites
- [x] Enrollment events (notification sent to user when enrolled in a listing)
- [ ] Listing comments/reviews
- [ ] Hook more systems (purchases, etc.)

### 5. AI Assistance
- [ ] AI writing assistant (listing description helper)
- [ ] AI image generation (thumbnail suggestions)
- [ ] AI-based revision (suggest tag improvements, title rewrites)
- [ ] AI tab placeholder added to Details/Files tabs on listing pages (marked "Soon")

### 6. Manage Listings
- [x] **Share options** — default link, custom alias links, click tracking, per-source breakdown, native share, platform share buttons

- [x] **Attached Info** — Lexical rich text editor; save/load to Firestore; read-only view on listing page
  - [ ] Image insertion in editor (ImageNode registered, no toolbar button yet)
  - [ ] Custom block types (schedule block, pricing block)

- [x] **Files**
  - [x] Upload/download UI with progress bar
  - [x] Firebase Storage integration (`listings/{id}/files/`)
  - [x] Privacy tiers: `public` / `enrolled` / `managers-only`
  - [x] File preview modal: images, video, audio, PDF (iframe), text (fetched + monospace display)
  - [x] Tabbed UI on listing detail + manage pages (Details | Files | Image Editor soon | AI soon)
  - [x] Firestore + Storage rules enforcing tier access

- [x] **Shared Ownership** — `editors[]` array, search/add/remove, owner-only: delete/archive/manage collabs

- [x] **Enrollments**
  - [x] `listings/{id}/enrollments/{userId}` subcollection
  - [x] Manage page enrollment section (list, add by search, revoke)
  - [x] Grant enrollment from inquiry chat (Enroll / Enrolled toggle button in chat banner)
  - [x] Notification sent to enrolled user
  - [x] Firestore rules: managers can write; enrolled user can read own doc

- [ ] **Manage Options**
  - [ ] Change listing type (class ↔ service)
  - [x] Archive listing — toggle in danger zone; badge on card + detail page; Inquire disabled for non-owners
  - [ ] Display "listed X days ago"
  - [ ] Improved tag UI (click to remove, suggested tags)

- [ ] **Design Tab** — custom listing page branding/layout

### 7. View Listing
- [x] Archived status (badge, notice, disabled Inquire)
- [x] Rich content panel (Lexical)
- [x] Files tab with preview
- [x] "Enrolled" badge in sidebar when user is enrolled
- [ ] Private listings hidden from non-owners
- [ ] Listing embed code

### 8. Listing Embeds
- [ ] Embeddable listing widget for external websites
- [ ] Dedicated embed endpoint (`/embed/:listingId`)

### 9. User Feedback
- [x] Comments (threaded, per-listing)
- [x] Reviews (star rating 0–5 with half-step; summary bar; edit/delete own review)
- [x] Reviews require enrollment — form hidden + rules enforced until user is enrolled
- [x] Rating displayed on listing cards (`ListingComponent`, `AlgoliaHit`)

### 10. Enrollment & Access
- [x] Enrollment subcollection (`listings/{id}/enrollments/{userId}`)
- [x] Granted manually: from inquiry chat or manage page
- [x] Enrolled badge on listing detail page
- [x] Enrolled listings section on dashboard (collection group query)
- [x] Enroll-tier files unlocked for enrolled users
- [x] Reviews gated on enrollment
- [ ] Exclusive group chat for enrolled users
- [ ] Enrollment expiry / revocation notifications

### 11. On-Platform Purchases
- [ ] Payment processing integration
- [ ] Auto-enroll on purchase
- [ ] Exclusive group communication for enrolled users

### 12. On-Platform Communication
- [x] Direct chat, inbox, message requests, blocking, URL detection, hide conversations
- [x] Inquiry chat tied to listing; shows listing banner in ChatView
- [x] Group chat
- [x] Enroll button in inquiry chat banner (manager-only)
- [ ] Business chat (group ↔ group)

### 13. Groups
- [x] Multi-level roles, group chat, add/remove members, group-owned listings
- [x] Create listing on behalf of group

### 14. International & Location
- [x] Replace ZIP code with structured location picker (Nominatim/OpenStreetMap autocomplete)
- [x] Detect-my-location button (browser Geolocation + reverse geocode)
- [x] Structured `location` object stored: `{ display, city, region, country, countryCode, lat, lng }`
- [x] Algolia records include `_geoloc`, `locationCity`, `locationCountry`, `locationCountryCode`
- [x] "Near me" geo-search on Explore page (browser geolocation + `aroundLatLng` + radius selector)
- [ ] Maps integration (display listing location on a map)
- [ ] Algolia geo search enabled in Dashboard (manual step after backfill)

### 15. Explore
- [x] Algolia InstantSearch (SearchBox, refinements, stats, pagination)
- [x] AlgoliaHit card with `Highlight`, rating display, city/country badge
- [x] "Near me" button with 5/10/25/50/100 km radius selector
- [ ] Cloud Functions deployed (Firestore → Algolia sync) — **blocked on IAM**
- [ ] Algolia Dashboard configured (searchable attrs, facets, custom ranking, geo)
- [ ] Backfill existing listings to Algolia
- [ ] Infinite scroll
- [ ] Smarter tag filters

### 16. Mobile
- [x] Responsive layout, hamburger nav, inbox mobile layout, sticky sidebars, dvh units
- [ ] Touch-friendly interactions (tap targets, swipe gestures)
- [ ] Capacitor packaging for native iOS/Android

### 17. Profile Page
- [x] Avatar placeholder styling
- [x] Chat entry point
- [ ] Customizable sections
- [ ] Respect privacy settings

### 18. Landing Page
- [x] Text carousel with per-word gradient colors
- [ ] Marketing copy, sign-up CTA, testimonials

### 19. Domain
- [x] `skillmesa.com` — live and working (favicon cache issue resolved via correct SVG path)
- [ ] Consider `skillmesa.app`

### 20. Content Wall
- [ ] Users can make posts relating to listings (mini feed)

### 21. Date/Time Inputs
- [ ] Replace `<input type="date">` with Mantine DatePicker
- [ ] Scheduling fields for class listings

### 22. Email
- [ ] Promotional, reminder, and communication emails
- [ ] Email template builder

### 23. SEO
- [ ] Dynamic `<title>` and `<meta>` per listing/profile
- [ ] Structured data (JSON-LD)
- [ ] Sitemap generation

### 24. Built-in Calling (maybe)
- [ ] Google Meet / Zoom link integration per listing

### 25. Pages (maybe)
- [ ] Long-form landing page builder per listing

---

## Recently Completed

| Feature | Notes |
|---|---|
| **Enrollment system** | `listings/{id}/enrollments/{userId}` subcollection; grant from inquiry chat or manage page; enrolled badge on listing detail; enrolled listings section on dashboard; enroll/unenroll toggle in chat banner for managers |
| **Enrollment-gated reviews** | Review form and Firestore rule both require enrollment; "Get enrolled to leave a review" shown otherwise |
| **Enrollment-gated files** | `enroll`-tier files now check actual enrollment via `isEnrolled()` rule helper using `exists()` |
| **File sharing** | Upload/download with progress, privacy tiers (public/enrolled/managers), file preview modal (images, video, audio, PDF, text), tabbed Details/Files UI on listing detail + manage pages |
| **File preview modal** | Image: `<img>` on dark bg; Video: `<video controls>`; Audio: `<audio controls>`; PDF: `<iframe>` with fallback; Text: fetched + monospace scroll area; Download button in all modals |
| **International location** | Replaced ZIP with `LocationPicker` (Nominatim autocomplete + detect-my-location); `location` object stored in Firestore; Algolia records include `_geoloc` + `locationCity/Country/CountryCode` |
| **Explore geo-search** | "Near me" button requests browser geolocation, passes `aroundLatLng` + `aroundRadius` to Algolia `Configure`; 5–100 km radius selector |
| **Firestore rules** | Helper functions `signedIn()`, `uid()`, `isListingManager()`, `isEnrolled()`; enrollments subcollection rules; files tier access via `isEnrolled()`; reviews require `isEnrolled()` |
| **Firestore indexes** | Added collection group index on `enrollments` by `userId + grantedAt` for dashboard query |
| **Storage rules** | `listings/{id}/{allPaths=**}` wildcard covers thumbnails and nested `files/` subpath |
| **Firestore + Storage deployed** | All rules and indexes live in production |
| **Rating system** | 0–5 half-star rating; `StarRating` shared component; summary bar; rating on listing cards + Algolia hits |
| **Groups system** | Multi-level roles, group chat, group-owned listings, member auto-editors |
| **Share system** | Default link, alias links, click tracking, per-source breakdown, native share API |
| **Inquiry chat** | Tied to listing; separate Inquiries tab; listing banner in ChatView |
| **Full chat system** | DMs, inquiries, group chats, message requests, blocking, URL detection, hide conversations |
| **File and rules deployment** | `firebase deploy --only firestore:rules,firestore:indexes,storage` run successfully |
