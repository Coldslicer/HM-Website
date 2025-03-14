/* ================ [ IMPORTS ] ================ */

import { Route, Routes, useLocation } from 'react-router-dom'

import { Navbar } from './components/Navbar'
import { BetaTest } from './pages/BetaTest'
import { CreatorForm } from './pages/CreatorForm'
import { Dashboard } from './pages/Dashboard'
import { Hero } from './pages/Hero'
import { Landing } from './pages/Landing'
import { AuthPage } from './pages/Login'

/* ================ [ APP ] ================ */

// App component
function App() {

  // Conditionally show navbar
  const pathsWithNavbar = ['/home', '/login', '/signup', '/dashboard', '/creator-form'];
  const showNavbar = pathsWithNavbar.some((path) => useLocation().pathname.startsWith(path));

  return (
    <div className="min-h-screen bg-gray-100">
      {showNavbar && <Navbar />}

      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/beta" element={<BetaTest />} />
        
        <Route path="/login" element={<AuthPage />} />
        <Route path="/signup" element={<AuthPage />} />
        <Route path="/dashboard/*" element={<Dashboard />} />

        <Route path="/creator-form" element={<CreatorForm />} />

        <Route path="/home" element={<Hero />} />
      </Routes>
    </div>
  )
}

/* ================ [ EXPORTS ] ================ */

export default App
