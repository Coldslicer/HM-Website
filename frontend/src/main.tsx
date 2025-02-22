/* ================ [ IMPORTS ] ================ */

// React components
import React from 'react';
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom';

// App components
import App from './App.tsx'
import '../styles/global.css'

/* ================ [ DRIVER ] ================ */

// Render app
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
