import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Navbar } from './components/Navbar'
import { Hero } from './components/Hero'
import { Login } from './pages/Login'
import { Signup } from './pages/Signup'
import { Dashboard } from './pages/Dashboard'
import { CreatorForm } from './pages/CreatorForm'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-900">
        <Navbar />
        <Routes>
          <Route path="/" element={<Hero />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard/*" element={<Dashboard />} />
          <Route path="/creator-form" element={<CreatorForm />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
