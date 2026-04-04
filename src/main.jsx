import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import './index.css'
import './styles/lexical.css'
import App from './App.jsx'
import app from "./firebase";
import theme from './theme.js'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="auto">
      <Notifications position="top-center" />
      <App />
    </MantineProvider>
  </StrictMode>,
)
