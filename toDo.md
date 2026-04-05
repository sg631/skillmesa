# Skillmesa — To-Do & Project Status

> Last updated: 2026-04-04
> Stack: React 19 · React Router v7 · Mantine v9 · Firebase v12 · Algolia · Lexical · Vite + SWC

---

## ⚠️ Uncertainty & Deployment Blockers

### 🔴 Must deploy before features work in production

**1. Firestore rules + indexes + Storage rules** (all written locally, not deployed):
```bash
firebase deploy --only firestore:rules,firestore:indexes,storage
```
- `firestore.rules` — covers listings, users, chats, notifications, shareLinks
- `firestore.indexes.json` — composite index: `chats` → `participants (array-contains)` + `lastAt (desc)`
- `storage.rules` — allows authenticated uploads to `listings/` and `users/`

**2. Algolia sync blocked on IAM (needs project owner)**
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

### 🟡 Known uncertainties in implemented features

| Feature | Uncertainty | Risk |
|---|---|---|
| Chat | Rules not deployed → all reads/writes fail silently | High |
| shareLinks click tracking | `allow update: if true` — anyone can manipulate counts | Medium |
| Notifications | Any auth'd user can spam notifications — no rate limit | Medium |
| Algolia search | Index stale until functions are deployed and backfill runs | Medium |
| ImageNode in Lexical | Registered but no toolbar button to insert images | Low |
| Profile picture | Blank avatar for users who haven't uploaded one | Low |
| Delete listing | Uses `window.confirm()` instead of Mantine modal | Low |
| Alias redirect source | `document.referrer` is often empty on mobile/native apps — shows as "direct" | Low |

---

## Full Task List

### 1. Security
- [ ] App Check (prevent API abuse)
- [ ] Tighten chat message read rules (currently any auth'd user can read any message subcollection)
- [ ] Rate-limit notification creation (move to Cloud Function trigger)
- [ ] Notification spam protection
- [ ] Tighten shareLinks update rule (only allow incrementing click fields, not arbitrary writes)

### 2. Opportunities
- [ ] Users can create posts/opportunities
- [ ] Users can reply
  - [ ] Text reply
  - [ ] Attach a premade listing
  - [ ] Create a new listing in-reply
- [ ] Matching system (suggest relevant listings/users)

### 3. Settings
- [x] Base layout (sidebar nav + sections)
- [x] Additional styling (sticky sidebar, scroll-spy active state)
- [x] Bio and text fields (display name, username, bio, birthday, contact email/phone)
- [x] Profile picture upload

### 4. Notifications
- [x] Base layout (real-time list, unread dot, mark-as-read)
- [x] Notification system (Firestore `notifications/{uid}/items`)
- [x] Nav bell indicator (pulsing red badge when unread count > 0)
- [ ] Hook more systems into notifications
  - [x] Chat messages
  - [ ] Listing comments/reviews
  - [ ] Collaboration invites
  - [ ] Purchase/enrollment events

### 5. AI Assistance
- [ ] AI writing, drafts, and improvement (listing description helper)
- [ ] AI image generation (thumbnail suggestions)
- [ ] AI-based general revision (suggest tag improvements, title rewrites)

### 6. Manage Listings
- [x] **Share options**
  - [x] Default share link (copy to clipboard)
  - [x] Custom alias links (`/s/:alias`) with click tracking
  - [x] Per-source traffic breakdown (direct, Facebook, Instagram, Twitter, WhatsApp, Reddit, TikTok, YouTube, Google, LinkedIn)
  - [x] Alias availability check (real-time, debounced)
  - [x] Alias CRUD (create, list, delete) in ManagePage
  - [ ] Total share count tracking on default `/share/:listingId` links
  - [ ] Native share (Web Share API)
  - [ ] Platform-specific share buttons (FB, WhatsApp, SMS, email)

- [x] **Attached Info (Lexical rich text)**
  - [x] Rich text editor (bold, italic, underline, bullet/numbered lists, links)
  - [x] Save to Firestore (`listings/{id}.richContent`)
  - [x] Read-only display in view listing
  - [ ] Image insertion in editor (ImageNode registered but no toolbar button)
  - [ ] Custom Lexical block types (e.g. schedule block, pricing block)

- [ ] **Files**
  - [ ] Basic upload/download UI
  - [ ] Firebase Storage integration for listing files
  - [ ] File sharing with enrolled/invited participants

- [ ] **Shared Ownership**
  - [ ] Add multiple owners/editors (`editors[]` array exists in data model)
  - [ ] Collaborative permission tiers (view / edit / admin)

- [ ] **Manage Options**
  - [ ] Change listing type (class ↔ service)
  - [ ] Archive listing (soft-delete; hide from explore but retain data)
  - [x] ~~Change visibility~~ — button exists but disabled; no data model decision yet
  - [ ] Display "listed X days ago" age
  - [ ] Improved tag UI (click to remove, suggested tags)

- [ ] **Design Tab** — custom listing page branding/layout

### 7. View Listing
- [ ] Reflect archival status (show "archived" badge, disable inquire)
- [ ] Reflect visibility (private listings hidden or marked)
- [x] Extra info panel (Lexical rich content section)
- [ ] Listing embed code (iframe or web component for external sites)

### 8. Listing Embeds
- [ ] Embeddable listing widget for external websites
- [ ] Dedicated embed endpoint (`/embed/:listingId`)

### 9. User Feedback
- [ ] Comments (per-listing threaded comments)
- [ ] Reviews (star rating + text; show on listing and profile)

### 10. Locked Resource Page
- [ ] Per-listing resource page (files, images, videos, notes)
- [ ] Access control (enrolled users only)
- [ ] Enrollment system design

### 11. On-Platform Purchases
- [ ] Payment processing integration
- [ ] Mark listings as "owned" / enrolled
- [ ] Exclusive group communication for enrolled users

### 12. On-Platform Communication
- [x] **Direct chat (user to user)** — `/inbox/:otherUID`, real-time messages, multiline input, date dividers, listing embeds, share from picker
- [x] **Inbox page** — two-panel layout (conversation list sidebar + chat panel), `/inbox` route
- [x] **Message requests** — pending/accept/decline flow for direct (non-listing) chats
- [x] **Blocking** — block/unblock per conversation, messaging disabled when blocked
- [x] **URL detection in chat** — any https link rendered as clickable + domain card with "Open link"
- [x] **New conversation flow** — search users by name/username, creates pending chat
- [ ] Inquiry chat (user → listing) — separate from user-to-user DMs
- [ ] Business chat (group ↔ group or listing ↔ listing)

### 13. Groups
- [ ] Groups with multi-level roles (member / editor / admin / owner)
- [ ] Groups can own or manage listings
- [ ] Per-listing permission cap based on group role

### 14. International
- [ ] Replace ZIP codes with location/address input
- [ ] Maps integration (display listing location on map)
- [ ] Distance-based filtering

### 15. Explore
- [x] **Algolia InstantSearch** (SearchBox, RefinementList, RangeInput, Stats, Pagination, CurrentRefinements, ClearRefinements)
- [x] **AlgoliaHit card** (matches listing card design, uses `Highlight` for search terms)
- [ ] Cloud Functions deployed (Firestore → Algolia sync) — blocked on IAM
- [ ] Algolia Dashboard configured (searchable attrs, facets, custom ranking, ~37 query rules)
- [ ] Backfill existing listings to Algolia index
- [ ] Infinite scroll (currently paginated)
- [ ] Smarter tag filters (most-used tags surfaced first, clickable)
- [ ] Layout auto-generation (personalized or category-based sections)

### 16. Mobile
- [ ] Responsive layout audit (many pages use fixed widths)
- [ ] Touch-friendly interactions
- [ ] Capacitor packaging for native iOS/Android

### 17. Profile Page
- [ ] Customizable sections (curated listing categories, bio paragraphs, featured listing)
- [ ] Show profile picture (currently shown only if uploaded; blank avatar for new users)
- [x] Chat entry point (via listing Inquire menu → Start Chat, or via Inbox new conversation)

### 18. Landing Page
- [x] Text carousel with per-word gradient colors
- [ ] Marketing copy and feature highlights
- [ ] Sign-up CTA
- [ ] Social proof / testimonials section

### 19. Domain
- [ ] Purchase `skillmesa.com`
- [ ] Consider `skillmesa.app`

### 20. Content Wall
- [ ] Users can make posts relating to listings (mini feed)

### 21. Date/Time Inputs
- [ ] Replace plain `<input type="date">` with Mantine DatePicker
- [ ] Scheduling fields for class listings (recurring schedule, single session, etc.)

### 22. Email
- [ ] Promotional emails (new listings in your area, etc.)
- [ ] Reminder emails (upcoming classes)
- [ ] Communication emails (new message notification fallback)
- [ ] Email template builder

### 23. SEO
- [ ] Dynamic `<title>` and `<meta>` tags per listing/profile
- [ ] Structured data (JSON-LD for listings)
- [ ] Sitemap generation

### 24. Built-in Calling (maybe)
- [ ] Google Meet / Zoom link integration per listing

### 25. Pages (maybe)
- [ ] Long-form content pages for listings (like a landing page builder)

---

## Recently Completed

| Feature | Notes |
|---|---|
| Visual system overhaul | Zinc palette, indigo-300 dark accent, Mantine Styles API compliance |
| Dark mode depth | Page `#09090b` → nav/footer `#18181b` → cards `#27272a` — three visible elevation levels |
| ListingDetailPage layout | Two-column Grid, sticky sidebar, Inquire submenu (email / chat) |
| ManagePage layout | Two-column Grid, Lexical editor, thumbnail upload/replace |
| CreateListingPage | Live-preview sidebar form |
| Inbox page | Two-panel layout at `/inbox` — conversation sidebar + live chat panel |
| Chat system | Full real-time chat, message requests, accept/decline/block, URL detection + link cards |
| Share link aliases | `/s/:alias` route, click tracking, per-source breakdown (11 sources), alias manager in ManagePage |
| Notifications | Real-time list, unread dot, nav bell badge |
| Settings page | Fully wired (profile, picture, password), sidebar nav + scroll-spy |
| HomePage | Chats overview panel with unread + status badges |
| Firestore rules | Written locally (chats, notifications, shareLinks, storage) — **deploy with `firebase deploy --only firestore:rules,firestore:indexes,storage`** |
