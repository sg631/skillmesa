import { createTheme } from '@mantine/core';

// Pastel accent used throughout dark mode (indigo-300).
// Change these two values to repaint the entire dark-mode accent system.
const A  = '165, 180, 252'; // RGB components of indigo-300
const AX = '#a5b4fc';        // hex — used where rgba() won't fit

// Shared input focus styles — DRY across TextInput / PasswordInput / Textarea / Select
const inputFocusStyles = {
  transition: 'border-color 0.15s ease, box-shadow 0.2s ease',
  '&:focus': {
    borderColor: `light-dark(var(--mantine-color-dark-3), rgba(${A}, 0.55))`,
    boxShadow:   `light-dark(0 3px 0 rgba(0,0,0,0.08), 0 3px 0 rgba(${A}, 0.28))`,
  },
};

// Button lift+press transition string
const btnTransition = [
  'transform 0.13s cubic-bezier(0.34,1.4,0.64,1)',
  'box-shadow 0.13s ease',
  'background-color 0.15s ease',
  'border-color 0.15s ease',
  'color 0.15s ease',
  'opacity 0.15s ease',
].join(', ');

const theme = createTheme({
  primaryColor: 'zinc',
  // zinc[9] = zinc-900 in light mode, zinc[0] = indigo-300 in dark mode
  primaryShade: { light: 9, dark: 0 },
  defaultRadius: 'md',
  fontFamily: "'Inter', system-ui, -apple-system, sans-serif",

  colors: {
    // Lower end (0-2) are indigo pastels — picked by primaryShade.dark.
    // Upper end (7-9) are true zinc blacks — picked by primaryShade.light.
    zinc: [
      '#a5b4fc', // [0] indigo-300  → dark mode primary filled bg
      '#c7d2fe', // [1] indigo-200  → dark mode primary light/hover
      '#e0e7ff', // [2] indigo-100  → dark mode primary subtle
      '#d4d4d8', // [3] zinc-300
      '#a1a1aa', // [4] zinc-400
      '#71717a', // [5] zinc-500
      '#52525b', // [6] zinc-600
      '#3f3f46', // [7] zinc-700
      '#27272a', // [8] zinc-800
      '#18181b', // [9] zinc-900    → light mode primary filled bg
    ],
    // Remap Mantine's `dark` palette to true zinc/black.
    // [0-3] are foreground/text tones; [4-9] are surface backgrounds.
    dark: [
      '#f4f4f5', // [0] main text on dark bg    (zinc-100)
      '#e4e4e7', // [1] secondary text           (zinc-200)
      '#a1a1aa', // [2] dimmed text              (zinc-400)
      '#71717a', // [3] muted                    (zinc-500)
      '#52525b', // [4] subtle borders           (zinc-600)
      '#3f3f46', // [5] card borders             (zinc-700)
      '#27272a', // [6] card / button bg         (zinc-800)
      '#18181b', // [7] page background          (zinc-900)
      '#09090b', // [8] nav / darkest surface    (zinc-950)
      '#030303', // [9] near-black
    ],
  },

  components: {
    // ─── Button ───────────────────────────────────────────────────────────────
    // All variants get lift+press. Default and subtle get dark-mode accent tints.
    // Any new Button usage in the app automatically inherits all of this.
    Button: {
      defaultProps: { radius: 'md' },
      styles: {
        root: {
          fontWeight: 500,
          willChange: 'transform',
          transition: btnTransition,
          '&:not([data-disabled]):not(:disabled):hover': {
            transform: 'translateY(-1.5px)',
            boxShadow: `light-dark(0 5px 16px rgba(0,0,0,0.10), 0 5px 20px rgba(0,0,0,0.40))`,
          },
          '&:not([data-disabled]):not(:disabled):active': {
            transform: 'translateY(1px)',
            boxShadow: 'none',
          },
          // default: accent border tint in dark mode
          '&[data-variant="default"]': {
            borderColor: `light-dark(var(--mantine-color-default-border), rgba(${A}, 0.22))`,
          },
          '&[data-variant="default"]:not([data-disabled]):not(:disabled):hover': {
            backgroundColor: `light-dark(var(--mantine-color-gray-0), rgba(${A}, 0.08))`,
            borderColor:     `light-dark(var(--mantine-color-gray-4),  rgba(${A}, 0.40))`,
          },
          // subtle: accent tint on hover in dark mode
          '&[data-variant="subtle"]:not([data-disabled]):not(:disabled):hover': {
            backgroundColor: `light-dark(var(--mantine-color-gray-0), rgba(${A}, 0.10))`,
            color:           `light-dark(inherit, ${AX})`,
          },
        },
      },
    },

    // ─── ActionIcon ───────────────────────────────────────────────────────────
    ActionIcon: {
      styles: {
        root: {
          willChange: 'transform',
          transition: 'transform 0.13s cubic-bezier(0.34,1.4,0.64,1), background-color 0.15s ease, color 0.15s ease',
          '&:not([data-disabled]):not(:disabled):hover': {
            transform:       'translateY(-1px)',
            backgroundColor: `light-dark(var(--mantine-color-gray-1), rgba(${A}, 0.10))`,
            color:           `light-dark(inherit, ${AX})`,
          },
          '&:not([data-disabled]):not(:disabled):active': {
            transform: 'translateY(1px)',
          },
        },
      },
    },

    // ─── Inputs ───────────────────────────────────────────────────────────────
    // Shared focus styles: neutral bottom-shadow in light, accent bottom-shadow in dark.
    TextInput:     { defaultProps: { radius: 'md' }, styles: { input: inputFocusStyles } },
    PasswordInput: { defaultProps: { radius: 'md' }, styles: { input: inputFocusStyles } },
    Textarea:      { defaultProps: { radius: 'md' }, styles: { input: inputFocusStyles } },
    Select:        { defaultProps: { radius: 'md' }, styles: { input: inputFocusStyles } },

    // ─── Tabs ─────────────────────────────────────────────────────────────────
    Tabs: {
      styles: {
        tab: {
          fontWeight: 500,
          transition: 'color 0.15s ease, background-color 0.15s ease',
          '&[data-active]': {
            color: `light-dark(inherit, ${AX})`,
          },
        },
      },
    },

    // ─── Surface components ───────────────────────────────────────────────────
    Card:       { defaultProps: { radius: 'md', shadow: 'xs', withBorder: true } },
    Paper:      { defaultProps: { radius: 'md' } },
    Badge:      { defaultProps: { radius: 'sm' } },
    Pagination: { defaultProps: { radius: 'md' } },
  },
});

export default theme;
