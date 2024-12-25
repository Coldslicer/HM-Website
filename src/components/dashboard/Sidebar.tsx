import React from 'react'
import { NavLink } from 'react-router-dom'
import { FileText, Users, Clock, CheckSquare } from 'lucide-react'

export function Sidebar() {
  return (
    <div className="bg-gray-800 w-64 min-h-screen p-4">
      <nav className="space-y-2">
        <NavLink
          to="/dashboard/brief"
          className={({ isActive }) =>
            `flex items-center space-x-2 p-2 rounded-md ${
              isActive
                ? 'bg-orange-500 text-white'
                : 'text-gray-300 hover:bg-gray-700'
            }`
          }
        >
          <FileText className="h-5 w-5" />
          <span>Campaign Brief</span>
        </NavLink>
        <NavLink
          to="/dashboard/creators"
          className={({ isActive }) =>
            `flex items-center space-x-2 p-2 rounded-md ${
              isActive
                ? 'bg-orange-500 text-white'
                : 'text-gray-300 hover:bg-gray-700'
            }`
          }
        >
          <Users className="h-5 w-5" />
          <span>Creator Selection</span>
        </NavLink>
        <NavLink
          to="/dashboard/timeline"
          className={({ isActive }) =>
            `flex items-center space-x-2 p-2 rounded-md ${
              isActive
                ? 'bg-orange-500 text-white'
                : 'text-gray-300 hover:bg-gray-700'
            }`
          }
        >
          <Clock className="h-5 w-5" />
          <span>Campaign Timeline</span>
        </NavLink>
        <NavLink
          to="/dashboard/complete"
          className={({ isActive }) =>
            `flex items-center space-x-2 p-2 rounded-md ${
              isActive
                ? 'bg-orange-500 text-white'
                : 'text-gray-300 hover:bg-gray-700'
            }`
          }
        >
          <CheckSquare className="h-5 w-5" />
          <span>Complete Campaign</span>
        </NavLink>
      </nav>
    </div>
  )
}