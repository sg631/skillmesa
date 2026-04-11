# Skillmesa — To-Do & Project Status

> Stack: React 19 · React Router v7 · Mantine v9 · Firebase v12 · Algolia · Lexical · Vite + SWC

---

### Known uncertainties

| Feature | Uncertainty | Risk |
|---|---|---|
| Notifications | Any auth'd user can create notifications — no rate limit | Medium |
| Privacy enforcement | `allowDirectMessages` / `showContactInfo` stored but not enforced in UI | Medium |
| Favicon | HTML set to correct SVG path; no `public/favicon.ico` generated | Low |
| Alias redirect source | `document.referrer` often empty on mobile — shows as "direct" | Low |
| Enrolled listings dashboard | Requires `enrollments` collection group index (may take minutes after deploy) | Low |

---

## Open Tasks

### Security
- [ ] App Check (prevent API abuse)
- [ ] Rate-limit notification creation (move to Cloud Function trigger)

### Opportunities / Feed
- [ ] Users can create posts/opportunities
- [ ] Users can reply (text, attach listing, create listing in-reply)
- [ ] Matching system (suggest relevant listings/users)

### Listings — Manage
- [ ] Change listing type (class ↔ service)
- [ ] Display "listed X days ago"
- [ ] Improved tag UI (click to remove, suggested tags)
- [ ] Design Tab — custom listing page branding/layout
- [ ] Custom block types in rich text (schedule block, pricing block)

### Listings — View
- [ ] Private listings hidden from non-owners
- [ ] Listing embed code / embeddable widget (`/embed/:listingId`)

### Enrollment & Access
- [ ] Exclusive group chat for enrolled users
- [ ] Enrollment expiry / revocation notifications

### Purchases
- [ ] Stripe Connect integration — see `STRIPE_INTEGRATION.md` for full plan

### Communication
- [ ] Business chat (group ↔ group)

### Explore
- [ ] Infinite scroll
- [ ] Smarter tag filters

### Mobile
- [ ] Touch-friendly interactions (tap targets, swipe gestures)
- [ ] Capacitor packaging for native iOS/Android

### Profile
- [ ] Customizable sections
- [ ] Respect privacy settings

### AI Assistance
- [ ] AI writing assistant (listing description helper)
- [ ] AI image generation (thumbnail suggestions)
- [ ] AI-based tag/title revision

### Location
- [ ] Maps integration (display listing location on a map)

### Scheduling
- [ ] Scheduling fields for class listings (date/time blocks)

### Email
- [ ] Promotional, reminder, and communication emails

### Misc
- [ ] Marketing copy, sign-up CTA, testimonials on landing page
- [ ] Google Meet / Zoom link integration per listing
- [ ] Users can make posts relating to listings (mini feed)
