/* ================ [ IMPORTS ] ================ */

// React components
import React from 'react';
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// App components
import App from './App.tsx'
import '../styles/global.css'

/* ================ [ DRIVER ] ================ */

// Render app
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
