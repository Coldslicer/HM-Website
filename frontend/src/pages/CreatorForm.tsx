import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useSearchParams } from 'react-router-dom';

const initialFormData = {
  campaign_id: '',
  channel_url: '',
  discord_id: '',
  rate: 0,
  personal_statement: '',
};

export function CreatorForm() {
  const [searchParams] = useSearchParams();
  const prefilledCampaignName = searchParams.get('campaignName') || '';

  const [formData, setFormData] = useState({
    ...initialFormData,
    campaign_name: prefilledCampaignName,
  });
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);
  const [campaignNotAvailable, setCampaignNotAvailable] = useState<boolean>(false);

  useEffect(() => {
    // Fetch campaigns that are 'brief_submitted'
    const fetchCampaigns = async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('status', 'brief_submitted')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching campaigns:', error);
        setError('Failed to load campaigns.');
        return;
      }

      setCampaigns(data || []);
      
      // Check if the prefilled campaign name exists in the available campaigns
      if (prefilledCampaignName) {
        const campaign = data.find(c => c.name === prefilledCampaignName);
        if (campaign) {
          setFormData({ ...formData, campaign_id: campaign.id });
        } else {
          setCampaignNotAvailable(true); // Display the banner if the campaign isn't found
        }
      }
    };

    fetchCampaigns();
  }, [prefilledCampaignName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Ensure a campaign is selected
    if (!formData.campaign_id) {
      setError('Please select a campaign to express interest.');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('campaign_creators')
        .insert([
          {
            campaign_id: formData.campaign_id,
            channel_url: formData.channel_url,
            discord_id: formData.discord_id,
            rate: formData.rate,
            personal_statement: formData.personal_statement,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // On success, set success state to true
      setSuccess(true);
    } catch (err) {
      console.error('Error submitting creator form:', err);
      setError('An error occurred while submitting your information. Please try again later.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-6">Express Interest in a Campaign</h2>

      {success ? (
        <div className="bg-gray-800 p-6 rounded-lg text-green-500">
          <p>Thank you! Your interest in the campaign has been successfully submitted.</p>
          <p>We’ll get back to you shortly!</p>
        </div>
      ) : (
        <>
          {error && <div className="text-red-500 mb-4">{error}</div>}

          {campaignNotAvailable && (
            <div className="bg-yellow-500 p-4 mb-4 rounded-md text-black">
              <p>The campaign you are trying to express interest in is no longer accepting responses.</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="campaign_id" className="block text-sm font-medium text-gray-200">
                Select Campaign
              </label>
              <select
                id="campaign_id"
                value={formData.campaign_id}
                onChange={(e) => setFormData({ ...formData, campaign_id: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-700 bg-gray-700 text-white shadow-sm focus:border-orange-500 focus:ring-orange-500"
                required
              >
                <option value="">Select a campaign</option>
                {campaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="channel_url" className="block text-sm font-medium text-gray-200">
                Channel URL
              </label>
              <input
                type="url"
                id="channel_url"
                value={formData.channel_url}
                onChange={(e) =>
                  setFormData({ ...formData, channel_url: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-700 bg-gray-700 text-white shadow-sm focus:border-orange-500 focus:ring-orange-500"
                required
              />
            </div>

            <div>
              <label htmlFor="discord_id" className="block text-sm font-medium text-gray-200">
                Discord ID
              </label>
              <input
                type="text"
                id="discord_id"
                value={formData.discord_id}
                onChange={(e) =>
                  setFormData({ ...formData, discord_id: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-700 bg-gray-700 text-white shadow-sm focus:border-orange-500 focus:ring-orange-500"
                required
              />
              <p className="text-gray-400 mt-1">Don't know your Discord User ID? Run /id in the discord server!</p>
            </div>

            <div>
              <label htmlFor="rate" className="block text-sm font-medium text-gray-200">
                Rate (per video)
              </label>
              <input
                type="number"
                id="rate"
                value={formData.rate}
                onChange={(e) =>
                  setFormData({ ...formData, rate: parseFloat(e.target.value) })
                }
                className="mt-1 block w-full rounded-md border-gray-700 bg-gray-700 text-white shadow-sm focus:border-orange-500 focus:ring-orange-500"
                required
              />
              <p className="text-gray-400 mt-1">Rate you are requesting for each video.</p>
            </div>

            <div>
              <label htmlFor="personal_statement" className="block text-sm font-medium text-gray-200">
                Personal Statement
              </label>
              <textarea
                id="personal_statement"
                value={formData.personal_statement}
                onChange={(e) =>
                  setFormData({ ...formData, personal_statement: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-700 bg-gray-700 text-white shadow-sm focus:border-orange-500 focus:ring-orange-500"
                required
              />
              <p className="text-gray-400 mt-1">
                Tell us about yourself and why you are interested in this campaign.
              </p>
            </div>

            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              Submit Interest
            </button>
          </form>
        </>
      )}
    </div>
  );
}
