/* ================ [ IMPORTS ] ================ */

// React components
import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

// Custom components
import { Navbar } from './components/Navbar'
import { Hero } from './pages/Hero'
import { Login } from './pages/Login'
import { Signup } from './pages/Signup'
import { Dashboard } from './pages/Dashboard'
import { CreatorForm } from './pages/CreatorForm'
import Landing from './pages/Landing'
import BetaTest from './pages/BetaTest'

/* ================ [ COMPONENT ] ================ */

// App component
function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-100">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/beta" element={<BetaTest />} />
        </Routes>
        {/* <Navbar />
        <Routes>
          <Route path="/" element={<Hero />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard/*" element={<Dashboard />} />
          <Route path="/creator-form" element={<CreatorForm />} />
        </Routes> */}
      </div>
    </BrowserRouter>
  )
}

/* ================ [ EXPORTS ] ================ */

export default App
