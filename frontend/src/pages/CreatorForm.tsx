import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useSearchParams } from 'react-router-dom';

const initialFormData = {
  campaign_id: '',
  name: '', // First and Last Name
  channel_name: '', // Channel Name
  channel_url: '', // Channel Link
  deliverables: '', // Deliverables (multiple choice)
  deliverables_rate: '', // Deliverables Rate
  agreement: false, // Agreement to terms
  discord_id: '', // Discord ID
};

export function CreatorForm() {
  const [searchParams] = useSearchParams();
  const prefilledCampaignName = searchParams.get('campaignName') || '';
  const prefilledDiscordID = searchParams.get('discordId') || '';

  const getMostRecentCampaignCreator = async (discordId) => {
    const { data, error } = await supabase
      .from('creator_applications') // Updated table name
      .select('*')
      .eq('discord_id', discordId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching data:', error);
      return null;
    }

    return data.length ? data[0] : null;
  };

  const [formData, setFormData] = useState({
    ...initialFormData,
    campaign_name: prefilledCampaignName,
    discord_id: prefilledDiscordID,
  });

  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);
  const [campaignNotAvailable, setCampaignNotAvailable] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
      let creatorData = {};

      if (prefilledDiscordID.length !== 0) {
        const creator = await getMostRecentCampaignCreator(prefilledDiscordID);
        if (creator) {
          creatorData = {
            name: creator.name || '',
            channel_name: creator.channel_name || '',
            channel_url: creator.channel_url || '',
            deliverables: creator.deliverables || '',
            deliverables_rate: creator.deliverables_rate || '',
          };
        }
      }

      // Fetch campaigns that are 'brief_submitted'
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

      let campaignId = '';
      if (prefilledCampaignName) {
        const campaign = data.find((c) => c.name === prefilledCampaignName);
        if (campaign) {
          campaignId = campaign.id;
        } else {
          setCampaignNotAvailable(true);
        }
      }

      // Merge both prefilling sources into one `setFormData` call
      setFormData((prevData) => ({
        ...prevData,
        campaign_name: prefilledCampaignName,
        campaign_id: campaignId,
        discord_id: prefilledDiscordID,
        ...creatorData, // Spread creator data only if available
      }));
    };

    fetchData();
  }, [prefilledDiscordID, prefilledCampaignName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Ensure a campaign is selected
    if (!formData.campaign_id) {
      setError('Please select a campaign to express interest.');
      return;
    }

    // Ensure agreement is checked
    if (!formData.agreement) {
      setError('You must agree to the terms to submit the form.');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('creator_applications') // Insert into the new table
        .insert([
          {
            campaign_id: formData.campaign_id,
            name: formData.name,
            channel_name: formData.channel_name,
            channel_url: formData.channel_url,
            deliverables: formData.deliverables,
            deliverables_rate: formData.deliverables_rate,
            discord_id: formData.discord_id,
            agreed: formData.agreement,
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
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        <br />
        Express Interest in a Campaign
      </h2>

      {success ? (
        <div className="bg-white-300 p-6 rounded-lg text-green-500">
          <p>Thank you! Your interest in the campaign has been successfully submitted.</p>
          <p>We’ll get back to you shortly!</p>
        </div>
      ) : (
        <>
          {error && <div className="text-red-500 mb-4">{error}</div>}

          {campaignNotAvailable && (
            <div className="bg-yellow-500 p-4 mb-4 rounded-md text-gray-800">
              <p>The campaign you are trying to express interest in is no longer accepting responses.</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="campaign_id" className="block text-sm font-medium text-gray-800-200">
                Select Campaign
              </label>
              <select
                id="campaign_id"
                value={formData.campaign_id}
                onChange={(e) => setFormData({ ...formData, campaign_id: e.target.value })}
                className="mt-1 block w-full rounded-md border-white-700 bg-white-700 text-gray-800 shadow-sm focus:border-orange-500 focus:ring-orange-500"
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
              <label htmlFor="name" className="block text-sm font-medium text-gray-800-200">
                Name (First, Last) - Ex. Shreyan Phadke
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-white-700 bg-white-700 text-gray-800 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                required
              />
            </div>

            <div>
              <label htmlFor="channel_name" className="block text-sm font-medium text-gray-800-200">
                Your Channel Name - Ex. Hotslicer
              </label>
              <input
                type="text"
                id="channel_name"
                value={formData.channel_name}
                onChange={(e) => setFormData({ ...formData, channel_name: e.target.value })}
                className="mt-1 block w-full rounded-md border-white-700 bg-white-700 text-gray-800 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                required
              />
            </div>

            <div>
              <label htmlFor="channel_url" className="block text-sm font-medium text-gray-800-200">
                Your Channel Link - https://www.youtube.com/@Hotslicer
              </label>
              <input
                type="url"
                id="channel_url"
                value={formData.channel_url}
                onChange={(e) => setFormData({ ...formData, channel_url: e.target.value })}
                className="mt-1 block w-full rounded-md border-white-700 bg-white-700 text-gray-800 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                required
              />
            </div>

            <div>
              <label htmlFor="discord_id" className="block text-sm font-medium text-gray-800-200">
                Discord ID - Ex. hotslicer
              </label>
              <input
                type="text"
                id="discord_id"
                value={formData.discord_id}
                onChange={(e) => setFormData({ ...formData, discord_id: e.target.value })}
                className="mt-1 block w-full rounded-md border-white-700 bg-white-700 text-gray-800 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                required
              />
            </div>

            <div>
              <label htmlFor="deliverables" className="block text-sm font-medium text-gray-800-200">
                Deliverables (Available options are listed on Discord)
              </label>
              <select
                id="deliverables"
                value={formData.deliverables}
                onChange={(e) => setFormData({ ...formData, deliverables: e.target.value })}
                className="mt-1 block w-full rounded-md border-white-700 bg-white-700 text-gray-800 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                required
              >
                <option value="">Select a deliverable</option>
                <option value="Longform Integration (30s)">Longform Integration (30s)</option>
                <option value="Longform Integration (60s)">Longform Integration (60s)</option>
                <option value="Shortform Video">Shortform Video</option>
                <option value="Dedicated Longform">Dedicated Longform</option>
              </select>
            </div>

            <div>
              <label htmlFor="deliverables_rate" className="block text-sm font-medium text-gray-800-200">
                Deliverables Rate - Ex. $X, $XCPM, or $X + $XCPM
              </label>
              <input
                type="text"
                id="deliverables_rate"
                value={formData.deliverables_rate}
                onChange={(e) => setFormData({ ...formData, deliverables_rate: e.target.value })}
                className="mt-1 block w-full rounded-md border-white-700 bg-white-700 text-gray-800 shadow-sm focus:border-orange-500 focus:ring-orange-500"
                required
              />
              <p className="text-gray-800-400 mt-1">
                You can put whatever rate you want, but if it's too high, clients may not select you.
              </p>
            </div>

            <div className="mt-6">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    type="checkbox"
                    id="agreement"
                    checked={formData.agreement}
                    onChange={(e) => setFormData({ ...formData, agreement: e.target.checked })}
                    className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
                    required
                  />
                </div>
                <div className="ml-3">
                  <label htmlFor="agreement" className="block text-sm font-medium text-gray-700">
                    I agree to these terms:
                  </label>
                  <ul className="mt-2 text-sm text-gray-600 space-y-1">
                    <li>
                      • I will follow through with the listed rates and deliverables to the best of my ability.
                    </li>
                    <li>
                      • I understand that this sponsorship is not guaranteed and is up to the brands.
                    </li>
                    <li>
                      • Hotslicer Media will take a 15% cut from the sponsorship.
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-800 bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              Submit Interest
            </button>
          </form>
        </>
      )}
    </div>
  );
}