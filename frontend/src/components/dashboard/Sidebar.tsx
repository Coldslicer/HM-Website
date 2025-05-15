/* ================ [ IMPORTS ] ================ */

import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { CampaignSelector } from "./CampaignSelector";
import {
  Brush,
  FileText,
  Users,
  Send,
  Clock,
  CreditCard,
  Home,
  BarChart2,
} from "lucide-react";
import { useCampaignStore } from "../../store/campaignStore";
import { SUPABASE_CLIENT } from "../../lib/supabase";

/* ================ [ SIDEBAR ] ================ */

export function Sidebar() {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const { currentCampaign, setCurrentCampaign } = useCampaignStore((state) => ({
    currentCampaign: state.currentCampaign,
    setCurrentCampaign: state.setCurrentCampaign,
  }));

  const togglePopup = () => {
    setIsPopupOpen(!isPopupOpen);
  };

  const statusOrder = [
    "draft",
    "brief_submitted",
    "creators_selected",
    "contract_signed",
  ];

  const canAccess = (requiredStatus: string) => {
    if (!currentCampaign) return false;
    return (
      statusOrder.indexOf(currentCampaign.status) >=
      statusOrder.indexOf(requiredStatus)
    );
  };

  useEffect(() => {
    if (!currentCampaign?.id) return;

    const campaignId = currentCampaign.id;

    const subscription = SUPABASE_CLIENT.channel(`campaigns:${campaignId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "campaigns",
          filter: `id=eq.${campaignId}`,
        },
        (payload) => {
          if (payload.new?.status !== undefined) {
            console.log("Campaign status updated:", payload.new.status);
            setCurrentCampaign((prev) => ({
              ...prev,
              status: payload.new.status,
            }));
            useCampaignStore.setState({
              currentCampaign: {
                ...currentCampaign,
                status: payload.new.status,
              },
            });
          }
        },
      )
      .subscribe();

    return () => {
      SUPABASE_CLIENT.removeChannel(subscription);
    };
  }, [currentCampaign?.id, setCurrentCampaign]);

  return (
    <div className="bg-gray-50 w-64 min-h-screen p-4 relative">
      {/* Campaign Name and Popup Trigger */}
      <div
        className="text-lg font-semibold text-gray-800 mb-6 cursor-pointer hover:text-orange-500"
        onClick={togglePopup}
      >
        {currentCampaign?.name || "New Campaign"}
      </div>

      {/* Popup Overlay and Campaign Selector */}
      {isPopupOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={togglePopup}
          ></div>
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-lg z-50">
            <CampaignSelector onClose={togglePopup} />
          </div>
        </>
      )}

      {/* Sidebar Navigation Links */}
      <nav className="space-y-2">
        <NavLink
          to="/dashboard/welcome"
          className={({ isActive }) =>
            `flex items-center space-x-2 p-2 rounded-md ${
              isActive
                ? "bg-orange-500 text-white"
                : "text-black hover:bg-gray-200"
            }`
          }
        >
          <Home className="h-5 w-5" />
          <span>Welcome</span>
        </NavLink>

        <NavLink
          to="/dashboard/brief"
          className={({ isActive }) =>
            `flex items-center space-x-2 p-2 rounded-md ${
              isActive
                ? "bg-orange-500 text-white"
                : "text-black hover:bg-gray-200"
            }`
          }
        >
          <Brush className="h-5 w-5" />
          <span>Brief Form</span>
        </NavLink>

        <NavLink
          to="/dashboard/messaging"
          className={({ isActive }) =>
            `flex items-center space-x-2 p-2 rounded-md ${
              canAccess("brief_submitted")
                ? isActive
                  ? "bg-orange-500 text-white"
                  : "text-black hover:bg-gray-200"
                : "opacity-50 text-gray-500 cursor-not-allowed"
            }`
          }
          onClick={(e) => !canAccess("brief_submitted") && e.preventDefault()}
        >
          <Send className="h-5 w-5" />
          <span>Messaging</span>
        </NavLink>

        <NavLink
          to="/dashboard/creators"
          className={({ isActive }) =>
            `flex items-center space-x-2 p-2 rounded-md ${
              canAccess("brief_submitted")
                ? isActive
                  ? "bg-orange-500 text-white"
                  : "text-black hover:bg-gray-200"
                : "opacity-50 text-gray-500 cursor-not-allowed"
            }`
          }
          onClick={(e) => !canAccess("brief_submitted") && e.preventDefault()}
        >
          <Users className="h-5 w-5" />
          <span>Creators</span>
        </NavLink>

        <NavLink
          to="/dashboard/contract"
          className={({ isActive }) =>
            `flex items-center space-x-2 p-2 rounded-md ${
              canAccess("creators_selected")
                ? isActive
                  ? "bg-orange-500 text-white"
                  : "text-black hover:bg-gray-200"
                : "opacity-50 text-gray-500 cursor-not-allowed"
            }`
          }
          onClick={(e) => !canAccess("creators_selected") && e.preventDefault()}
        >
          <FileText className="h-5 w-5" />
          <span>Contract</span>
        </NavLink>

        <NavLink
          to="/dashboard/timeline"
          className={({ isActive }) =>
            `flex items-center space-x-2 p-2 rounded-md ${
              canAccess("contract_signed")
                ? isActive
                  ? "bg-orange-500 text-white"
                  : "text-black hover:bg-gray-200"
                : "opacity-50 text-gray-500 cursor-not-allowed"
            }`
          }
          onClick={(e) => !canAccess("contract_signed") && e.preventDefault()}
        >
          <Clock className="h-5 w-5" />
          <span>Timeline</span>
        </NavLink>

        <NavLink
          to="/dashboard/analytics"
          className={({ isActive }) =>
            `flex items-center space-x-2 p-2 rounded-md ${
              canAccess("contract_signed")
                ? isActive
                  ? "bg-orange-500 text-white"
                  : "text-black hover:bg-gray-200"
                : "opacity-50 text-gray-500 cursor-not-allowed"
            }`
          }
          onClick={(e) => !canAccess("contract_signed") && e.preventDefault()}
        >
          <BarChart2 className="h-5 w-5" />
          <span>Analytics</span>
        </NavLink>

        <NavLink
          to="/dashboard/payment"
          className={({ isActive }) =>
            `flex items-center space-x-2 p-2 rounded-md ${
              canAccess("contract_signed")
                ? isActive
                  ? "bg-orange-500 text-white"
                  : "text-black hover:bg-gray-200"
                : "opacity-50 text-gray-500 cursor-not-allowed"
            }`
          }
          onClick={(e) => !canAccess("contract_signed") && e.preventDefault()}
        >
          <CreditCard className="h-5 w-5" />
          <span>Payment</span>
        </NavLink>
      </nav>
    </div>
  );
}

/* ================ [ EXPORTS ] ================ */

export default Sidebar;
