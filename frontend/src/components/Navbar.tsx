/* ================ [ IMPORTS ] ================ */

import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/logo-warm.png";
import { useAuthStore } from "../store/authStore";
import { useCampaignStore } from "../store/campaignStore";
import { supabase } from "../lib/supabase";

/* ================ [ NAVBAR ] ================ */

function Navbar() {
  const { user, signOut } = useAuthStore();
  const { setCurrentCampaign } = useCampaignStore();
  const navigate = useNavigate();


  const handleNewCampaign = async () => {
    if (!user) return;

    const { data, error } = await supabase.from("campaigns")
      .insert({
        client_id: user.id,
        name: "Draft",
        status: "draft",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating new campaign:", error);
      return;
    }

    if (data) {
      setCurrentCampaign(data);
      navigate("/dashboard/brief");
    } else {
      setCurrentCampaign(null);
    }
  };

  const handleSignOut = () => {
    signOut();
    navigate("/");
  };

  return (
    <nav className="bg-white text-black w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Hotslicer logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center">
              <img
                src={logo}
                alt="Hotslicer Logo"
                className="h-auto max-h-12 w-auto"
              />
            </Link>
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <button
                  onClick={handleNewCampaign}
                  className="px-4 py-2 hover:text-orange-500"
                >
                  New Campaign
                </button>
                <Link
                  to="/dashboard"
                  className="px-4 py-2 hover:text-orange-500"
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => handleSignOut()}
                  className="px-4 py-2 hover:text-orange-500"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600"
              >
                Get Started
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-b border-gray-200"></div>
    </nav>
  );
}

/* ================ [ EXPORTS ] ================ */

export default Navbar;
