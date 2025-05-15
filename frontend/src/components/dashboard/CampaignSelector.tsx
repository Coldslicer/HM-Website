import React from "react";
import { useCampaignStore } from "../../store/campaignStore";
import { SUPABASE_CLIENT } from "../../lib/supabase";
import { Campaign } from "../../types";
import { useAuthStore } from "../../store/authStore";
import { Plus } from "lucide-react";

export function CampaignSelector({ onClose }: { onClose?: () => void }) {
  const [campaigns, setCampaigns] = React.useState<Campaign[]>([]);
  const { currentCampaign, setCurrentCampaign } = useCampaignStore();
  const { user } = useAuthStore();

  React.useEffect(() => {
    if (!user) return;

    const fetchCampaigns = async () => {
      const { data, error } = await SUPABASE_CLIENT.from("campaigns")
        .select("*")
        .eq("client_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching campaigns:", error);
        return;
      }

      setCampaigns(data || []);
    };

    fetchCampaigns();
  }, [user, currentCampaign, setCurrentCampaign]);

  const handleSelectCampaign = (campaign: Campaign) => {
    setCurrentCampaign(campaign);
    if (onClose) onClose();
  };

  const handleNewCampaign = async () => {
    if (!user) return;

    const { data, error } = await SUPABASE_CLIENT.from("campaigns")
      .insert({
        client_id: user.id,
        name: "Draft", // You can customize or prompt for this
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
      setCampaigns((prev) => [data, ...prev]);
      if (onClose) onClose();
    }
  };

  return (
    <div className="w-full max-w-4xl p-8 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Select a Campaign
      </h2>

      <div className="max-h-[400px] overflow-y-auto pr-4">
        <div className="space-y-3">
          {campaigns.map((campaign) => (
            <div
              key={campaign.id}
              onClick={() => handleSelectCampaign(campaign)}
              className={`p-6 rounded-lg cursor-pointer transition-all
                ${
                  currentCampaign?.id === campaign.id
                    ? "bg-orange-50 border-2 border-orange-500"
                    : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent"
                }`}
            >
              <h3 className="text-xl font-semibold text-gray-800">
                {campaign.name}
              </h3>
              <p className="text-sm text-gray-500 mt-2">
                Created: {new Date(campaign.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleNewCampaign}
        className="mt-6 w-full py-3 bg-orange-500 hover:bg-orange-600 text-white 
          rounded-lg font-medium transition-colors flex items-center 
          justify-center space-x-2"
      >
        <Plus className="w-5 h-5" />
        <span>New Campaign</span>
      </button>
    </div>
  );
}
