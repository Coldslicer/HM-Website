import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { CampaignSelector } from "./CampaignSelector";
import {
  BarChart2,
  Brush,
  Clock,
  CreditCard,
  FileText,
  Home,
  Mail,
  Send,
  Users,
} from "lucide-react";
import { useCampaignStore } from "../../store/campaignStore";

import { CampaignInfoManager } from "../../infoAbstraction/infoManagers";

/* ================ [ SIDEBAR ] ================ */

import { supabase } from "../../lib/supabase";
import { Campaign } from "../../types";


export function Sidebar() {
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const { currentCampaign, setCurrentCampaign } = useCampaignStore((state) => ({
    currentCampaign: state.currentCampaign,
    setCurrentCampaign: state.setCurrentCampaign,
  }));

  const toggleSelector = () => {
    setIsSelectorOpen((prev) => !prev);
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

  // Auto-select latest campaign if none selected
  useEffect(() => {
    const fetchAndSetLatestCampaign = async () => {
      const { data, error } = await supabase.from("campaigns")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(1);

      if (!error && data && data.length > 0) {
        setCurrentCampaign(data[0]);
      }
    };

    if (!currentCampaign) {
      fetchAndSetLatestCampaign();
    }
  }, [currentCampaign, setCurrentCampaign]);

  useEffect(() => {
    if (!currentCampaign?.id) return;

    const subscription = CampaignInfoManager.subscribeStatus(
      currentCampaign.id,
      (status) => {
        console.log("Campaign status updated:", status);
        setCurrentCampaign((prev) => ({ ...prev, status }));
        useCampaignStore.setState({
          currentCampaign: { ...currentCampaign, status },
        });
      },
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [currentCampaign?.id]);

  return (
    <div className="bg-gray-50 w-64 fixed top-16 left-0 h-[calc(100vh-4rem)] p-4 flex flex-col justify-between">
      <div>
        {/* Campaign Name Toggle */}
        {currentCampaign && (
          <div
            className="text-lg font-semibold text-gray-800 mb-2 cursor-pointer hover:text-orange-500"
            onClick={toggleSelector}
          >
            {currentCampaign.name}
          </div>
        )}

        {/* Inline Campaign Selector */}
        {isSelectorOpen && (
          <div className="mb-6">
            <CampaignSelector onClose={toggleSelector} />
          </div>
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
            onClick={(e) =>
              !canAccess("creators_selected") && e.preventDefault()
            }
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

          <NavLink
            to="/dashboard/contacts"
            className={({ isActive }) =>
              `flex items-center space-x-2 p-2 rounded-md ${
                isActive
                  ? "bg-orange-500 text-white"
                  : "text-black hover:bg-gray-200"
              }`
            }
          >
            <Mail className="h-5 w-5" />
            <span>Contact</span>
          </NavLink>
        </nav>
      </div>

      {/* Inbox Link at Bottom */}
      <NavLink
        to="/dashboard/inbox"
        className={({ isActive }) =>
          `flex items-center space-x-2 p-2 rounded-md border border-gray-300 ${
            isActive
              ? "bg-orange-100 text-orange-600"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`
        }
      >
        <Mail className="h-5 w-5" />
        <span>Inbox</span>
      </NavLink>
    </div>
  );
}

/* ================ [ EXPORTS ] ================ */

export default Sidebar;
