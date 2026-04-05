# Skillmesa — To-Do & Project Status

> Last updated: 2026-04-05
> Stack: React 19 · React Router v7 · Mantine v9 · Firebase v12 · Algolia · Lexical · Vite + SWC

---

## ⚠️ Uncertainty & Deployment Blockers

### 🔴 Must deploy before features work in production

**1. Firestore rules + indexes + Storage rules** (written locally, not deployed):
```bash
firebase deploy --only firestore:rules,firestore:indexes,storage
```
- `firestore.rules` — covers listings (with archived gate), users, chats (fixed read rule for new chats), notifications, shareLinks
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
| Chat creation | Rules not deployed — chat `getDoc` before `setDoc` still fails in prod | High |
| shareLinks click tracking | Update rule tightened: only `totalClicks`, `sources`, `lastClickAt` fields allowed for anonymous updates | Low |
| Notifications | Any auth'd user can spam notifications — no rate limit | Medium |
| Algolia search | Index stale until functions are deployed and backfill runs | Medium |
| Privacy enforcement | `allowDirectMessages` / `showContactInfo` stored but not yet enforced in UI | Medium |
| ImageNode in Lexical | Registered but no toolbar button to insert images | Low |
| Archive listing | Firestore rule written (archived → owner-only read), UI not yet implemented | Low |
| ~~Delete listing~~ | ~~Uses `window.confirm()` instead of Mantine modal~~ | ~~Done~~ |
| Alias redirect source | `document.referrer` often empty on mobile/native — shows as "direct" | Low |

---

## Full Task List

### 1. Security
- [ ] App Check (prevent API abuse)
- [x] Tighten chat message read rules — messages now require participant check via `get()` on parent chat doc
- [ ] Rate-limit notification creation (move to Cloud Function trigger)
- [ ] Notification spam protection
- [x] Tighten shareLinks update rule — only `totalClicks`, `sources`, `lastClickAt` allowed for unauthenticated updates; owner can update anything

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
- [x] Privacy section (profile visibility, allow direct messages, show contact info)

### 4. Notifications
- [x] Base layout (real-time list, unread dot, mark-as-read)
- [x] Notification system (Firestore `notifications/{uid}/items`)
- [x] Nav bell indicator (pulsing red badge when unread count > 0)
- [ ] Hook more systems into notifications
  - [x] Chat messages
  - [ ] Listing comments/reviews
  - [x] Collaboration invites (notification sent when added as editor)
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
  - [x] Alias CRUD (create, list, delete) in ManagePage sidebar
  - [x] Total share count tracking on default `/share/:listingId` links
  - [x] Native share (Web Share API)
  - [x] Platform-specific share buttons (FB, WhatsApp, Twitter/X, SMS, email)

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

- [x] **Shared Ownership**
  - [x] Add multiple owners/editors (`editors[]` array, search + add/remove in ManagePage)
  - [x] Editors can edit listing content; owner-only: delete, archive, manage collaborators
  - [x] Collaboration invite notification sent when editor is added
  - [x] Editor badge shown on ManagePage when accessing as non-owner editor

- [ ] **Manage Options**
  - [ ] Change listing type (class ↔ service)
  - [x] Archive listing — toggle button in ManagePage danger zone; archived badge on card and detail page; Inquire disabled for non-owners on archived listings
  - [ ] Display "listed X days ago" age
  - [ ] Improved tag UI (click to remove, suggested tags)

- [ ] **Design Tab** — custom listing page branding/layout

### 7. View Listing
- [x] Reflect archival status (archived badge in sidebar, notice + disabled Inquire for non-owners)
- [ ] Reflect visibility (private listings hidden or marked)
- [x] Extra info panel (Lexical rich content section)
- [ ] Listing embed code (iframe or web component for external sites)

### 8. Listing Embeds
- [ ] Embeddable listing widget for external websites
- [ ] Dedicated embed endpoint (`/embed/:listingId`)

### 9. User Feedback
- [x] Comments (per-listing threaded comments)
- [x] Reviews (star rating + text; show on listing card and detail page)

### 10. Locked Resource Page
- [ ] Per-listing resource page (files, images, videos, notes)
- [ ] Access control (enrolled users only)
- [ ] Enrollment system design

### 11. On-Platform Purchases
- [ ] Payment processing integration
- [ ] Mark listings as "owned" / enrolled
- [ ] Exclusive group communication for enrolled users

### 12. On-Platform Communication
- [x] **Direct chat (user to user)** — `/inbox/:chatId`, real-time messages, multiline input, date dividers, listing embeds, share from picker
- [x] **Inbox page** — three-tab layout (Messages / Inquiries / Groups), `/inbox` route; mobile shows list or chat, not both
- [x] **Message requests** — pending/accept/decline flow for direct (non-listing) chats
- [x] **Blocking** — block/unblock per conversation, messaging disabled when blocked
- [x] **URL detection in chat** — any https link rendered as clickable + domain card with "Open link"
- [x] **New conversation flow** — search users by name/username, creates pending chat
- [x] **Hide conversations** — X button on hover hides from list; re-initiating restores it
- [x] **Inquiry chat** — chatId `inquiry_{listingId}_{buyerUid}`, tied to listing, shows listing banner in ChatView, separate Inquiries tab in Inbox
- [x] **Group chat** — chatId `group_{groupId}`, shows group name/members in ChatView, Groups tab in Inbox; sender names shown in group messages
- [ ] Business chat (group ↔ group or listing ↔ listing)

### 13. Groups
- [x] Groups with multi-level roles (member / editor / admin / owner) — `/groups`, `/groups/create`, `/groups/:groupId`, `/groups/:groupId/manage`
- [x] Group chat — all members in participants[], real-time messaging, unread tracking
- [x] Add/remove members, change roles (admin-only), owner can delete group
- [x] Groups can own listings — `ownerType: 'group'` + `ownerGroupId` on listing; group-owned listings shown on GroupPage; group member UIDs auto-populated as `editors[]`
- [x] Per-listing permission cap — editors can edit but not delete/archive/manage collaborators; only owner has full control
- [x] Create listing "on behalf of group" — "Listed by" selector in CreateListingPage (shows user's groups); pre-selectable via `?group=groupId` URL param

### 14. International
- [ ] Replace ZIP codes with location/address input
- [ ] Maps integration (display listing location on map)
- [ ] Distance-based filtering

### 15. Explore
- [x] **Algolia InstantSearch** (SearchBox, RefinementList, RangeInput, Stats, Pagination, CurrentRefinements, ClearRefinements)
- [x] **AlgoliaHit card** (matches listing card design, uses `Highlight` for search terms; responsive SimpleGrid)
- [ ] Cloud Functions deployed (Firestore → Algolia sync) — blocked on IAM
- [ ] Algolia Dashboard configured (searchable attrs, facets, custom ranking, ~37 query rules)
- [ ] Backfill existing listings to Algolia index
- [ ] Infinite scroll (currently paginated)
- [ ] Smarter tag filters (most-used tags surfaced first, clickable)
- [ ] Layout auto-generation (personalized or category-based sections)

### 16. Mobile
- [x] Responsive layout audit — completed
- [x] Navbar — hamburger menu + Drawer on mobile; nav links hidden below `sm`
- [x] Inbox — shows conversation list OR chat on mobile (not both); back button returns to list
- [x] Listing cards — responsive `SimpleGrid` (1/2/3 cols), removed fixed 490px height, responsive image height
- [x] Grid columns — all `span={6}` metadata grids changed to `span={{ base: 12, sm: 6 }}`
- [x] Sticky sidebars — `.sticky-sidebar` CSS utility; static on mobile, sticky on 768px+
- [x] Chat bubbles — `maxWidth: min(72%, 480px)`; `ListingReferenceCard` uses `maxWidth: 280` instead of fixed width
- [x] Page transitions — `width: 100%` on transition box prevents layout collapse
- [x] `dvh` units — ChatPage and InboxPage use `100dvh` to handle mobile virtual keyboard
- [ ] Touch-friendly interactions (tap targets, swipe gestures)
- [ ] Capacitor packaging for native iOS/Android

### 17. Profile Page
- [x] Avatar placeholder background — `#9df7ff` with dark teal icon color (global CSS)
- [ ] Customizable sections (curated listing categories, bio paragraphs, featured listing)
- [ ] Respect privacy settings (`profileVisibility`, `showContactInfo`)
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
| Groups system | `/groups`, `/groups/create`, `/groups/:groupId`, `/groups/:groupId/manage`; multi-level roles (owner/admin/editor/member); group chat; add/remove members; delete group; group-owned listings with member auto-editors |
| Inquiry chat | `inquiry_{listingId}_{buyerUid}` chatId; listing banner in ChatView; Inquiries tab in InboxPage; created from listing Inquire → Start Chat |
| InboxPage tabs | Three tabs: Messages (DMs), Inquiries, Groups; auto-selects tab from URL chatId; unread badges per tab |
| ChatView refactor | Now accepts `chatId` prop (all types); handles DM/inquiry/group headers; group sender names; notifications to all participants |
| Firestore rules | Added groups/members rules; fixed `editors` field access using `get()` helper |
| Shared ownership | ManagePage collaborator panel (search, add, remove editors); editor access to ManagePage; collab invite notification |
| Archive listing | Toggle button in ManagePage danger zone; archived banner on listing cards; archived notice + disabled Inquire on detail page |
| Delete listing modal | Replaced `window.confirm()` with Mantine Modal in ManagePage |
| Mobile responsiveness | Hamburger nav drawer, inbox mobile layout, responsive listing grid, sticky sidebar utility class, dvh units for chat, page transition fix |
| Privacy settings | New Privacy section in Settings — profile visibility, allow DMs, show contact info; stored in `users/{uid}.privacy` |
| Hide conversations | X button on hover in Inbox and Dashboard; re-initiating (NewChatModal or Start Chat) restores hidden chat via `arrayRemove` |
| Firestore rules (updated) | Fixed chat `allow read` for non-existent docs (was blocking new chat creation); added archived listing gate |
| Avatar styling | All avatar placeholders use `#9df7ff` background with dark teal icon/text |
| Share links moved | `ShareLinksManager` moved to ManagePage right sidebar above the danger zone |
| Navbar z-index fix | Reduced from 9999 → 100 so Mantine modals (z-index 200) render above the nav |
| Visual system overhaul | Zinc palette, indigo-300 dark accent, Mantine Styles API compliance |
| Dark mode depth | Page `#09090b` → nav/footer `#18181b` → cards `#27272a` — three visible elevation levels |
| ListingDetailPage layout | Two-column Grid, sticky sidebar, Inquire submenu (email / chat) |
| ManagePage layout | Two-column Grid, Lexical editor, thumbnail upload/replace, share links in sidebar |
| CreateListingPage | Live-preview sidebar form |
| Inbox page | Two-panel layout at `/inbox` — conversation sidebar + live chat panel |
| Chat system | Full real-time chat, message requests, accept/decline/block, URL detection + link cards |
| Share link aliases | `/s/:alias` route, click tracking, per-source breakdown (11 sources), alias manager in ManagePage |
| Notifications | Real-time list, unread dot, nav bell badge |
| Settings page | Fully wired (profile, picture, password, privacy), sidebar nav + scroll-spy |
| HomePage | Chats overview panel with unread + status badges, hide conversation support |
| Firestore rules | Written locally (chats, notifications, shareLinks, storage) — **deploy with `firebase deploy --only firestore:rules,firestore:indexes,storage`** |
