import React from 'react';
import { useCampaignStore } from '../../store/campaignStore';
import { SUPABASE_CLIENT } from '../../lib/supabase';
import { Campaign } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { Plus } from 'lucide-react';

export function CampaignSelector({ onClose }: { onClose?: () => void }) {
  const [campaigns, setCampaigns] = React.useState<Campaign[]>([]);
  const { currentCampaign, setCurrentCampaign } = useCampaignStore();
  const { user } = useAuthStore();

  React.useEffect(() => {
    if (!user) return;

    const fetchCampaigns = async () => {
      const { data, error } = await SUPABASE_CLIENT
        .from('campaigns')
        .select('*')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching campaigns:', error);
        return;
      }

      setCampaigns(data || []);
    };

    fetchCampaigns();
  }, [user, currentCampaign, setCurrentCampaign]);

  const handleSelectCampaign = (campaign: Campaign) => {
    setCurrentCampaign(campaign);
    if (onClose) onClose(); // Close the popup if `onClose` is provided
  };

  return (
    <div className="w-full max-w-4xl p-8 bg-white rounded-lg shadow-lg"> {/* Wider popup */}
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Select a Campaign</h2>

      {/* Campaign List with Scrollable Container */}
      <div className="max-h-[400px] overflow-y-auto pr-4"> {/* Added max height and scrolling */}
        <div className="space-y-3">
          {campaigns.map((campaign) => (
            <div
              key={campaign.id}
              onClick={() => handleSelectCampaign(campaign)}
              className={`p-6 rounded-lg cursor-pointer transition-all
                ${currentCampaign?.id === campaign.id
                  ? 'bg-orange-50 border-2 border-orange-500'
                  : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                }`}
            >
              <h3 className="text-xl font-semibold text-gray-800"> {/* Larger text */}
                {campaign.name}
              </h3>
              <p className="text-sm text-gray-500 mt-2"> {/* Adjusted spacing */}
                Created: {new Date(campaign.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* New Campaign Button */}
      <button
        onClick={() => {
          setCurrentCampaign(null);
          if (onClose) onClose(); // Close the popup if `onClose` is provided
        }}
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