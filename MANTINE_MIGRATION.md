# Mantine UI Migration Documentation

This document describes the migration from plain CSS to [Mantine v7](https://mantine.dev/) across the Skillmesa codebase.

## Packages Installed

```
@mantine/core
@mantine/hooks
@mantine/notifications
```

## New Files Created

| File | Purpose |
|------|---------|
| `src/theme.js` | Custom Mantine theme — cyan primary color, rounded defaults for Button, TextInput, PasswordInput, Textarea, Select, Card, Badge, Tabs, Paper |
| `src/components/AlgoliaWidgets.jsx` | Mantine-wrapped Algolia InstantSearch widgets (SearchBox, Pagination, Stats, CurrentRefinements, ClearRefinements, RangeInput) |

## Provider Setup (`src/main.jsx`)

- `MantineProvider` wraps the entire app with the custom theme from `src/theme.js`
- `Notifications` component from `@mantine/notifications` is mounted at `position="top-center"`
- Mantine core and notification CSS are imported globally

---

## What Uses Mantine

### Components

| Component | Mantine Components Used |
|-----------|------------------------|
| `ShowAlert.jsx` | `notifications.show()` for simple strings; `Modal`, `Button`, `Text`, `Stack` for JSX alerts |
| `TabElements.jsx` | `Tabs`, `Tabs.List`, `Tabs.Tab` (backward-compatible wrapper keeping `<li>` children API) |
| `LinkElements.jsx` | `Button` (variant="light", color="cyan"), `Image` |
| `SignonComponent.jsx` | `Paper`, `Tabs`, `Tabs.List`, `Tabs.Tab`, `Tabs.Panel`, `TextInput`, `PasswordInput`, `Button`, `Title`, `Stack` |
| `ListingComponent.jsx` | `Card`, `Card.Section`, `Image`, `Text`, `Badge`, `Group`, `Stack`, `Avatar`, `Divider`, `ScrollArea` |
| `AlgoliaHit.jsx` | Same as ListingComponent |
| `ListingsPanel.jsx` | `Group`, `Button`, `Text`, `ScrollArea`, `Stack`, `Loader` |
| `PageTransition.jsx` | `Transition` (fade), `Box` |
| `TextEditorToolbar.jsx` | `Group`, `ActionIcon`, `Tooltip`, `Modal`, `TextInput`, `Button`, `Stack`, `Text` |
| `AlgoliaWidgets.jsx` | `TextInput`, `ActionIcon`, `Pagination`, `Text`, `Badge`, `Button`, `Group` |

### Pages

| Page | Mantine Components Used |
|------|------------------------|
| `App.jsx` | `Box`, `Anchor`, `Text` (nav bar, footer) |
| `HomePage.jsx` | `Title`, `Stack`, `Text` |
| `StartingPage.jsx` | `Title`, `Text`, `Stack`, `Image`, `Space` |
| `SignonPage.jsx` | `Center` |
| `CreateListingPage.jsx` | `Title`, `Text`, `TextInput`, `Textarea`, `Select`, `Button`, `Stack`, `Image`, `FileInput`, `Paper`, `TagsInput` |
| `ExplorePage.jsx` | `Title`, `Text`, `Button`, `Group`, `Paper`, `Stack`, `Badge`, `Divider`, `Select`, `SimpleGrid`, `Pill`, `PillsInput` |
| `ManagePage.jsx` | `Title`, `Text`, `Textarea`, `Button`, `Group`, `Stack`, `Avatar`, `Badge`, `Divider`, `Paper`, `Code`, `ScrollArea`, `Image`, `TagsInput` |
| `ListingDetailPage.jsx` | `Title`, `Text`, `Button`, `Group`, `Stack`, `Avatar`, `Badge`, `Divider`, `Paper`, `Code`, `ScrollArea`, `Image` |
| `ProfilePage.jsx` | `Title`, `Text`, `Stack`, `Avatar`, `Code`, `Badge`, `Group`, `Loader` |
| `ContactPage.jsx` | `Title`, `Text`, `Stack`, `Avatar`, `Badge`, `Group`, `Paper`, `Loader`, `Button` |
| `SettingsPage.jsx` | `Title`, `Text`, `TextInput`, `Textarea`, `PasswordInput`, `Button`, `Stack`, `Paper`, `FileInput`, `Divider` |
| `NotFoundPage.jsx` | `Title`, `Text`, `Stack` |
| `ComingSoonPage.jsx` | `Title`, `Text`, `Stack` |
| `OpenSharedLinkPage.jsx` | `Center`, `Loader`, `Text`, `Stack` |

---

## What Is Still Custom CSS

The `index.css` file has been reduced to **12 lines** — just `html, body, #root` resets. All other custom CSS lives in dedicated files under `src/styles/`:

### `src/index.css` (12 lines)
Bare minimum global reset: `margin: 0`, `padding: 0`, `width/height: 100%`, `text-align: center`.

### `src/styles/blobs.css` (~50 lines)
Animated glassmorphism blob background. Cannot be replaced by Mantine:
- `.blobs` / `.blob` — animated background shapes with `backdrop-filter: blur`
- `@keyframes blobMorph` — 30s organic shape animation
- Dark mode support: `[data-mantine-color-scheme="dark"] .blobs` reduces brightness

### `src/styles/lexical.css` (~40 lines)
Styles for the Lexical rich text editor (third-party DOM, cannot use Mantine components):
- `.text-editor`, `.editor-container`, `.editor-input`, `.editor-placeholder`
- Uses Mantine CSS variables (`var(--mantine-color-body)`, `var(--mantine-color-text)`, etc.) for dark mode compatibility
- Also contains `.ais-Highlight-highlighted` for Algolia search highlight

### Components with inline `<style>` tags

| Component | Why |
|-----------|-----|
| `CarouselElement.jsx` | CSS transforms for carousel sliding. Could be migrated to `@mantine/carousel` in the future. |
| `ImageNode.jsx` | Lexical editor custom node — must stay custom due to Lexical's node API. |

### Previously custom, now Mantine

| What | Was | Now |
|------|-----|-----|
| Nav profile picture | `.navbutton-profile-loggedin` / `-loggedout` CSS classes | Mantine `Avatar` component with dynamic `boxShadow` |
| Root font, colors, background | 31 lines in `:root` / `body` | Mantine theme (`theme.js`) + `MantineProvider` |
| All form element styles | 80+ lines of `input`, `textarea`, `select`, `button` CSS | Mantine component defaults in `theme.js` |
| Algolia widget styles | ~220 lines of `.ais-*` overrides | `AlgoliaWidgets.jsx` — custom hooks rendered with Mantine components |
| Text utilities | `.textgiant`, `.textlarge`, `.textyellow`, etc. | Mantine `Title`/`Text` with `size`, `fw`, `c` props |

---

## Dark Mode

Dark mode is fully supported via Mantine's color scheme system:

- **Toggle**: `useMantineColorScheme()` + `useComputedColorScheme()` in `App.jsx` and `SettingsPage.jsx`
- **Default**: `defaultColorScheme="auto"` — follows system preference
- **Persistence**: Mantine stores preference in `localStorage` automatically
- **Nav toggle**: 🌙/☀️ `ActionIcon` in the navigation bar
- **Settings toggle**: `SegmentedControl` (Light / Dark) on the Settings page

### What adapts automatically
- All Mantine components (Paper, Card, Button, TextInput, etc.) — uses `var(--mantine-color-body)` and `var(--mantine-color-text)`
- Blob background — filter changes via `[data-mantine-color-scheme="dark"]` selector
- Lexical editor — uses `var(--mantine-color-body)`, `var(--mantine-color-text)`, `var(--mantine-color-dimmed)`
- Nav bar and footer — `isDark` conditional in `App.jsx` for background and glow colors
- Listing detail / manage overlays — use `var(--mantine-color-dark-light)` for backdrop

---

## Summary of What Was Replaced

| Before (Plain CSS/HTML) | After (Mantine) |
|--------------------------|-----------------|
| `<input>`, `<textarea>`, `<select>` | `TextInput`, `Textarea`, `PasswordInput`, `Select`, `TagsInput`, `FileInput` |
| `<button>` | `Button`, `ActionIcon` |
| `<h1>`, `<h2>`, `<h3>` | `Title` with `order` prop |
| `<p>`, `<span>` with text classes | `Text` with `size`, `fw`, `c` props |
| `<code>` | `Code` |
| `<hr>` | `Divider` |
| `<br>` | `Space` or `Stack` gap |
| Custom `.listing` card div | `Card`, `Card.Section` |
| Custom `.listing-tag` badges | `Badge` |
| Custom `.accdisplay` profile row | `Avatar` + `Group` |
| Custom `.tab-chooser-element` | `Tabs`, `Tabs.List`, `Tabs.Tab` |
| Custom `showAlert()` DOM injection | `notifications.show()` + `Modal` |
| Custom `.pagination-controls` | `Button` group / Mantine `Pagination` |
| Custom `.listing-tags-container` scroll | `ScrollArea` |
| Custom tag input (comma string) | `TagsInput` |
| Custom tag picker (Algolia) | `PillsInput` + `Pill` |
| `window.prompt()` / `window.confirm()` | Mantine `Modal` dialogs |
| Inline `@keyframes` page transition | Mantine `Transition` |
| `window.location` navigation | `useNavigate()` from React Router |
| ~220 lines of Algolia CSS overrides | `AlgoliaWidgets.jsx` — custom hooks rendered with Mantine components |
| `.textgiant`, `.textlarge`, etc. utility classes | Mantine `Title`/`Text` with `fz`, `size`, `fw` props |
| `.textyellow`, `.textred`, etc. color classes | Mantine `c` prop (e.g., `c="red"`) |
