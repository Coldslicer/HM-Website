import React from 'react'
import { Link } from 'react-router-dom'
import { Flame } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

export function Navbar() {
  const { user, signOut } = useAuthStore()

  return (
    <nav className="bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <Flame className="h-8 w-8 text-orange-500" />
            <span className="text-xl font-bold">Hotslicer Media</span>
          </Link>
          
          <div className="flex items-center space-x-4">
            <Link to="/case-studies" className="px-4 py-2 hover:text-orange-500">
              Case Studies
            </Link>
            {user ? (
              <>
                <Link to="/dashboard" className="px-4 py-2 hover:text-orange-500">
                  Dashboard
                </Link>
                <button
                  onClick={() => signOut()}
                  className="px-4 py-2 hover:text-orange-500"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login" className="px-4 py-2 hover:text-orange-500">
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="bg-orange-500 px-4 py-2 rounded-md hover:bg-orange-600"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}