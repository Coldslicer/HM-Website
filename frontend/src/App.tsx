/* ================ [ IMPORTS ] ================ */

// React components
import React from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'

// Custom components
import { Navbar } from './components/Navbar'
import { Hero } from './pages/Hero'
import { AuthPage } from './pages/Login'
import { Signup } from './pages/Signup'
import { Dashboard } from './pages/Dashboard'
import { CreatorForm } from './pages/CreatorForm'
import Landing from './pages/Landing'
import BetaTest from './pages/BetaTest'

/* ================ [ COMPONENT ] ================ */

// App component
function App() {

  // Conditionally show navbar
  const location = useLocation();
  const navbarPaths = ['/home', '/login', '/signup', '/dashboard', '/creator-form'];
  const showNavbar = navbarPaths.some((path) => location.pathname.startsWith(path));

  return (
    <div className="min-h-screen bg-gray-100">
      {showNavbar && <Navbar />}

      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/beta" element={<BetaTest />} />
        <Route path="/home" element={<Hero />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/signup" element={<AuthPage />} />
        <Route path="/dashboard/*" element={<Dashboard />} />
        <Route path="/creator-form" element={<CreatorForm />} />
      </Routes>
    </div>
  )
}

/* ================ [ EXPORTS ] ================ */

export default App
