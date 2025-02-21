import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import "./assets/favicon_io-2/android-chrome-192x192.png"
import "./assets/favicon_io-2/android-chrome-512x512.png"
import "./assets/favicon_io-2/apple-touch-icon.png"
import "./assets/favicon_io-2/favicon-16x16.png"
import "./assets/favicon_io-2/favicon-32x32.png"
import "./assets/favicon_io-2/favicon.ico"
import "./assets/favicon_io-2/site.webmanifest"

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
