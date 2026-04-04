import { createTheme, virtualColor } from '@mantine/core';

const theme = createTheme({
  primaryColor: 'cyan',
  fontFamily: "'Segoe UI', 'Roboto', 'Oxygen', Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif",
  colors: {
    cyan: [
      '#e0ffff',
      '#b8f5ff',
      '#9df7ff',
      '#7aeeff',
      '#5ce5ff',
      '#3ddbff',
      '#1dd2ff',
      '#00c4f0',
      '#00a8d0',
      '#008db0',
    ],
    // Virtual color that switches between dark text in light mode and light text in dark mode
    surface: virtualColor({
      name: 'surface',
      dark: 'dark',
      light: 'gray',
    }),
  },
  other: {
    // Custom tokens referenced via `var(--mantine-other-*)` or via theme.other
    bgLight: '#dfffff',
    bgDark: '#1a1b1e',
    navLight: 'rgb(157, 247, 255)',
    navDark: '#25262b',
    navGlowLight: '0 0px 20px rgb(157, 247, 255)',
    navGlowDark: '0 0px 20px rgba(0, 196, 240, 0.3)',
  },
  components: {
    Button: {
      defaultProps: {
        radius: 'md',
      },
      styles: {
        root: {
          fontWeight: 500,
          transition: 'box-shadow 0.15s, transform 0.15s, background-color 0.15s',
        },
      },
    },
    TextInput: {
      defaultProps: {
        radius: 'xl',
      },
    },
    PasswordInput: {
      defaultProps: {
        radius: 'xl',
      },
    },
    Textarea: {
      defaultProps: {
        radius: 'md',
      },
    },
    Select: {
      defaultProps: {
        radius: 'xl',
      },
    },
    Card: {
      defaultProps: {
        radius: 'lg',
        shadow: 'sm',
      },
    },
    Badge: {
      defaultProps: {
        radius: 'xl',
      },
    },
    Tabs: {
      styles: {
        tab: {
          fontWeight: 500,
          transition: 'box-shadow 0.2s, transform 0.15s, background-color 0.15s',
        },
      },
    },
    Paper: {
      defaultProps: {
        radius: 'md',
      },
    },
  },
});

export default theme;
