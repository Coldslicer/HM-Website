import React from "react";
import { useCampaignStore } from "../../store/campaignStore";
import { SUPABASE_CLIENT } from "../../lib/supabase";
import { Campaign } from "../../types";
import { useAuthStore } from "../../store/authStore";
import { Card } from "../ui/Card";

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

  return (
    <div className="space-y-3 mb-6">
      <h3 className="text-sm font-semibold text-gray-500 uppercase px-1">
        Select Campaign
      </h3>

      <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
        {campaigns.map((campaign) => (
          <Card
            key={campaign.id}
            onClick={() => handleSelectCampaign(campaign)}
            className={`p-3 cursor-pointer border transition-all text-sm ${
              currentCampaign?.id === campaign.id
                ? "border-orange-500 bg-orange-50"
                : "hover:bg-gray-50"
            }`}
          >
            <div className="font-medium text-gray-800 truncate">
              {campaign.name}
            </div>
            <div className="text-xs text-gray-500">
              {new Date(campaign.created_at).toLocaleDateString()}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
