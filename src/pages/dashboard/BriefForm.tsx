import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useCampaignStore } from '../../store/campaignStore';
import { supabase } from '../../lib/supabase';
import { sendCampaignBriefToDiscord } from '../../util/discord';

const NICHES = [
  'Gaming',
  'Tech Reviews',
  'Esports',
  'Game Development',
  'Streaming',
  'Mobile Gaming',
  'Retro Gaming',
  'Gaming News',
];

const initialFormData = {
  name: '',
  start_date: '',
  duration: 1,
  deliverable_type: 'short_form' as const,
  niches: [] as string[],
  brief_url: '',
};

export function BriefForm() {
  const { currentCampaign, setCurrentCampaign } = useCampaignStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    if (currentCampaign) {
      setFormData({
        name: currentCampaign.name,
        start_date: currentCampaign.start_date,
        duration: currentCampaign.duration,
        deliverable_type: currentCampaign.deliverable_type,
        niches: currentCampaign.niches,
        brief_url: currentCampaign.brief_url,
      });
    } else {
      setFormData(initialFormData);
    }
  }, [currentCampaign]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    try {
      const campaign = {
        client_id: user.id,
        ...formData,
        status: 'brief_submitted',
      };

      const { data, error } = await supabase
        .from('campaigns')
        .insert([campaign])
        .select()
        .single();

      if (error) throw error;

      const campaignInfo = {
        id: data.id,
        ...campaign,
        created_at: data.created_at,
      };

      setCurrentCampaign(campaignInfo);

      sendCampaignBriefToDiscord(campaignInfo, process.env.allCampaignsChannel);

      navigate('/dashboard/creators');
    } catch (error) {
      console.error('Error submitting brief:', error);
    }
  };

  const handleNicheToggle = (niche: string) => {
    setFormData((prev) => ({
      ...prev,
      niches: prev.niches.includes(niche)
        ? prev.niches.filter((n) => n !== niche)
        : [...prev.niches, niche],
    }));
  };

  // If brief is already submitted, show read-only view
  if (currentCampaign?.status === 'brief_submitted') {
    return (
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-white mb-6">Campaign Brief</h2>
        <div className="bg-gray-800 p-6 rounded-lg">
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-400">
                Campaign Name
              </dt>
              <dd className="text-white">{currentCampaign.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-400">Start Date</dt>
              <dd className="text-white">{currentCampaign.start_date}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-400">Duration</dt>
              <dd className="text-white">{currentCampaign.duration} weeks</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-400">
                Deliverable Type
              </dt>
              <dd className="text-white">
                {currentCampaign.deliverable_type.replace('_', ' ')}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-400">Niches</dt>
              <dd className="text-white">
                {currentCampaign.niches.join(', ')}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-400">Brief URL</dt>
              <dd>
                <a
                  href={currentCampaign.brief_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-500 hover:text-orange-400"
                >
                  View Brief
                </a>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-6">Campaign Brief</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-200"
          >
            Campaign Name
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            className="mt-1 block w-full rounded-md border-gray-700 bg-gray-700 text-white shadow-sm focus:border-orange-500 focus:ring-orange-500"
            required
          />
        </div>

        <div>
          <label
            htmlFor="start_date"
            className="block text-sm font-medium text-gray-200"
          >
            Start Date
          </label>
          <input
            type="date"
            id="start_date"
            value={formData.start_date}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, start_date: e.target.value }))
            }
            className="mt-1 block w-full rounded-md border-gray-700 bg-gray-700 text-white shadow-sm focus:border-orange-500 focus:ring-orange-500"
            required
          />
        </div>

        <div>
          <label
            htmlFor="duration"
            className="block text-sm font-medium text-gray-200"
          >
            Duration (weeks)
          </label>
          <input
            type="number"
            id="duration"
            min="1"
            value={formData.duration}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                duration: parseInt(e.target.value),
              }))
            }
            className="mt-1 block w-full rounded-md border-gray-700 bg-gray-700 text-white shadow-sm focus:border-orange-500 focus:ring-orange-500"
            required
          />
        </div>

        <div>
          <label
            htmlFor="deliverable_type"
            className="block text-sm font-medium text-gray-200"
          >
            Deliverable Type
          </label>
          <select
            id="deliverable_type"
            value={formData.deliverable_type}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                deliverable_type: e.target.value as any,
              }))
            }
            className="mt-1 block w-full rounded-md border-gray-700 bg-gray-700 text-white shadow-sm focus:border-orange-500 focus:ring-orange-500"
            required
          >
            <option value="short_form">Short Form</option>
            <option value="sponsored_segment">Sponsored Segment</option>
            <option value="full_video">Full Video</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-200 mb-2">
            Niches
          </label>
          <div className="grid grid-cols-2 gap-2">
            {NICHES.map((niche) => (
              <label key={niche} className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={formData.niches.includes(niche)}
                  onChange={() => handleNicheToggle(niche)}
                  className="rounded border-gray-700 text-orange-500 focus:ring-orange-500"
                />
                <span className="ml-2 text-white">{niche}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label
            htmlFor="brief_url"
            className="block text-sm font-medium text-gray-200"
          >
            Brief URL
          </label>
          <input
            type="url"
            id="brief_url"
            value={formData.brief_url}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, brief_url: e.target.value }))
            }
            className="mt-1 block w-full rounded-md border-gray-700 bg-gray-700 text-white shadow-sm focus:border-orange-500 focus:ring-orange-500"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
        >
          Submit Brief
        </button>
      </form>
    </div>
  );
}
