import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { CampaignSelector } from './CampaignSelector';
import { Brush, FileText, Users, Send, Clock, CreditCard } from 'lucide-react'; // Import the CreditCard icon
import { useCampaignStore } from '../../store/campaignStore'; // Import the campaign store

export function Sidebar() {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const currentCampaign = useCampaignStore((state) => state.currentCampaign); // Get the current campaign

  // Function to toggle the popup
  const togglePopup = () => {
    setIsPopupOpen(!isPopupOpen);
  };

  return (
    <div className="bg-gray-50 w-64 min-h-screen p-4 relative">
      {/* Campaign Name and Popup Trigger */}
      <div
        className="text-lg font-semibold text-gray-800 mb-6 cursor-pointer hover:text-orange-500"
        onClick={togglePopup}
      >
        {currentCampaign?.name || 'New Campaign'} {/* Dynamic campaign name */}
      </div>

      {/* Popup Overlay and Campaign Selector */}
      {isPopupOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={togglePopup}
          ></div>

          {/* Popup */}
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-lg z-50">
            <CampaignSelector onClose={togglePopup} />
          </div>
        </>
      )}

      {/* Sidebar Navigation Links */}
      <nav className="space-y-2">
        <NavLink
          to="/dashboard/brief"
          className={({ isActive }) =>
            `flex items-center space-x-2 p-2 rounded-md ${
              isActive
                ? 'bg-orange-500 text-white'
                : 'text-black hover:bg-gray-200'
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
                : 'text-black hover:bg-gray-200'
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
                : 'text-black hover:bg-gray-200'
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
                : 'text-black hover:bg-gray-200'
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
                : 'text-black hover:bg-gray-200'
            }`
          }
        >
          <Clock className="h-5 w-5" />
          <span>Creator Timeline</span>
        </NavLink>

        {/* New Payment Tab */}
        <NavLink
          to="/dashboard/payment"
          className={({ isActive }) =>
            `flex items-center space-x-2 p-2 rounded-md ${
              isActive
                ? 'bg-orange-500 text-white'
                : 'text-black hover:bg-gray-200'
            }`
          }
        >
          <CreditCard className="h-5 w-5" /> {/* Payment icon */}
          <span>Payment</span>
        </NavLink>
      </nav>
    </div>
  );
}
