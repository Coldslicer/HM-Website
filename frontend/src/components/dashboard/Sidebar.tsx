import React from 'react'
import { NavLink } from 'react-router-dom'
import { Brush, FileText, Users, Send, Clock } from 'lucide-react'  // Added Clock for the Timeline icon

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
          <Brush className="h-5 w-5" />
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
          to="/dashboard/contract"
          className={({ isActive }) =>
            `flex items-center space-x-2 p-2 rounded-md ${
              isActive
                ? 'bg-orange-500 text-white'
                : 'text-gray-300 hover:bg-gray-700'
            }`
          }
        >
          <FileText className="h-5 w-5" />
          <span>Contract</span>
        </NavLink>

        <NavLink
          to="/dashboard/messaging"
          className={({ isActive }) =>
            `flex items-center space-x-2 p-2 rounded-md ${
              isActive
                ? 'bg-orange-500 text-white'
                : 'text-gray-300 hover:bg-gray-700'
            }`
          }
        >
          <Send className="h-5 w-5" />
          <span>Messaging</span>
        </NavLink>

        {/* Creator Timeline Section */}
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
          <Clock className="h-5 w-5" />  {/* Clock Icon for Timeline */}
          <span>Creator Timeline</span>
        </NavLink>

      </nav>
    </div>
  )
}
