import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useCampaignStore } from '../../store/campaignStore';
import { supabase } from '../../lib/supabase';

const initialFormData = {
  company_name: '',
  website: '',
  company_description: '',
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
  const [niches, setNiches] = useState<{ name: string | null; discord_webhook_url: string }[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchNiches = async () => {
      const { data, error } = await supabase
        .from('niches')
        .select('*');
      if (error) {
        console.error('Error fetching niches:', error);
        return;
      }
      console.log('Fetched Niches:', data); // Log fetched data for debugging
      setNiches(data || []); // Keep all niches, including NULL
    };

    fetchNiches();

    const fetchMostRecentCampaign = async () => {
      if (!user) return;

      // Fetch the most recent non-draft campaign for the current client
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('client_id', user.id)
        .neq('status', 'draft')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error fetching most recent campaign:', error);
        return;
      }

      if (data && data.length > 0) {
        const recentCampaign = data[0];
        // Prefill company information if the current campaign is a draft
        if (currentCampaign == null || currentCampaign?.status === 'draft') {
          setFormData((prev) => ({
            ...prev,
            company_name: recentCampaign.company_name || '',
            website: recentCampaign.website || '',
            company_description: recentCampaign.company_description || '',
          }));
        }
      }
    };

    if (currentCampaign) {
      setFormData({
        company_name: currentCampaign.company_name,
        website: currentCampaign.website,
        company_description: currentCampaign.company_description,
        name: currentCampaign.name,
        start_date: currentCampaign.start_date,
        duration: currentCampaign.duration,
        deliverable_type: currentCampaign.deliverable_type,
        niches: currentCampaign.niches,
        brief_url: currentCampaign.brief_url,
      });
    } else {
      setFormData(initialFormData);
      fetchMostRecentCampaign(); // Prefill company info for new drafts
    }
  }, [currentCampaign, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    if (!/^[a-zA-Z0-9 ]+$/.test(formData.name)) {
      setError('Campaign name can only contain letters, numbers, and spaces.');
      return;
    }

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

      const baseUrl = window.location.origin; // Dynamically get the base URL
      const formattedMessage = `
      **Campaign Brief**
        
      🏢 **Company Name**: ${formData.company_name}
      🌐 **Website**: ${formData.website}
      📝 **Company Description**: ${formData.company_description}
        
      📝 **Campaign Name**: ${formData.name}
      📅 **Start Date**: ${new Date(formData.start_date).toLocaleDateString()}
      ⏳ **Duration**: ${formData.duration} weeks
      🎥 **Deliverable Type**: ${formData.deliverable_type.replace('_', ' ').toUpperCase()}
      🔗 **Brief URL**: [View Brief](${formData.brief_url})
        
      ---
        
      🚀 Interested in this campaign? Fill out the [Creator Interest Form](${baseUrl}/creator-form?campaignName=${encodeURIComponent(formData.name)}) to get started!
      Alternatively, react with a ✅ to recieve a custom link
      `;

      // Send to selected niches' webhooks
      const selectedNiches = niches.filter((niche) => formData.niches.includes(niche.name!));
      for (const niche of selectedNiches) {
        await fetch('/api/messages/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channelId: niche.channel_id, // This is the channel where you want to send the message
            message: formattedMessage,  // The message you want to send
          }),
        });
      }

      // Additionally send to the NULL niche's webhook
      const nullChannel = niches.find((niche) => niche.name === null)?.channel_id;
      if (nullChannel) {
        await fetch('/api/messages/send-brief', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channelId: nullChannel, // This is the channel where you want to send the message
            message: formattedMessage,  // The message you want to send
          }),
        });
      } else {
        console.error('No webhook found for NULL niche, could not post to the all sponsorships channel.');
      }

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
  if (currentCampaign != null && currentCampaign?.status !== 'draft') {
    return (
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-black mb-6">Campaign Brief</h2>
        <div className="bg-gray-50 p-6 rounded-lg">
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-black-400">Company Name</dt>
              <dd className="text-black">{currentCampaign?.company_name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-black-400">Website</dt>
              <dd className="text-black">{currentCampaign?.website}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-black-400">Company Description</dt>
              <dd className="text-black">{currentCampaign?.company_description}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-black-400">Campaign Name</dt>
              <dd className="text-black">{currentCampaign?.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-black-400">Start Date</dt>
              <dd className="text-black">{currentCampaign?.start_date}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-black-400">Duration</dt>
              <dd className="text-black">{currentCampaign?.duration} weeks</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-black-400">Deliverable Type</dt>
              <dd className="text-black">
                {currentCampaign?.deliverable_type.replace('_', ' ')}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-black-400">Niches</dt>
              <dd className="text-black">
                {currentCampaign?.niches.join(', ')}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-black-400">Brief URL</dt>
              <dd>
                <a
                  href={currentCampaign?.brief_url}
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
      <h2 className="text-2xl font-bold text-black mb-6">Campaign Brief</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="company_name"
            className="block text-sm font-medium text-black-200"
          >
            Company Name
          </label>
          <input
            type="text"
            id="company_name"
            value={formData.company_name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, company_name: e.target.value }))
            }
            className="mt-1 block w-full rounded-md border-gray-700 bg-white-700 text-black shadow-sm focus:border-orange-500 focus:ring-orange-500"
            required
          />
        </div>

        <div>
          <label
            htmlFor="website"
            className="block text-sm font-medium text-black-200"
          >
            Website
          </label>
          <input
            type="url"
            id="website"
            value={formData.website}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, website: e.target.value }))
            }
            className="mt-1 block w-full rounded-md border-gray-700 bg-white-700 text-black shadow-sm focus:border-orange-500 focus:ring-orange-500"
            required
          />
        </div>

        <div>
          <label
            htmlFor="company_description"
            className="block text-sm font-medium text-black-200"
          >
            Company Description
          </label>
          <textarea
            id="company_description"
            value={formData.company_description}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, company_description: e.target.value }))
            }
            className="mt-1 block w-full rounded-md border-gray-700 bg-white-700 text-black shadow-sm focus:border-orange-500 focus:ring-orange-500"
            required
          />
        </div>

        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-black-200"
          >
            Campaign Name<br/>
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => {
              const value = e.target.value;
              if (/^[a-zA-Z0-9 ]*$/.test(value)) {
                setFormData((prev) => ({ ...prev, name: value }));
                setError('');
              } else {
                setError('Campaign name can only contain letters, numbers, and spaces.');
              }
            }}
            className="mt-1 block w-full rounded-md border-gray-700 bg-white-700 text-black shadow-sm focus:border-orange-500 focus:ring-orange-500"
            required
          />
          <p className="text-sm text-black-400 mt-1">
            Should be something descriptive, only containing letters, numbers, and spaces.
          </p>
          {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
        </div>

        <div>
          <label
            htmlFor="start_date"
            className="block text-sm font-medium text-black-200"
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
            className="mt-1 block w-full rounded-md border-gray-700 bg-white-700 text-black shadow-sm focus:border-orange-500 focus:ring-orange-500"
            required
          />
        </div>

        <div>
          <label
            htmlFor="duration"
            className="block text-sm font-medium text-black-200"
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
            className="mt-1 block w-full rounded-md border-gray-700 bg-white-700 text-black shadow-sm focus:border-orange-500 focus:ring-orange-500"
            required
          />
        </div>

        <div>
          <label
            htmlFor="deliverable_type"
            className="block text-sm font-medium text-black-200"
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
            className="mt-1 block w-full rounded-md border-gray-700 bg-white-700 text-black shadow-sm focus:border-orange-500 focus:ring-orange-500"
            required
          >
            <option value="short_form">Short Form</option>
            <option value="sponsored_segment">Sponsored Segment</option>
            <option value="full_video">Full Video</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-black-200 mb-2">
            Niches
          </label>
          <div className="grid grid-cols-2 gap-2">
            {niches.filter((niche) => niche.name !== null).map((niche) => (
              <label key={niche.name} className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={formData.niches.includes(niche.name!)}
                  onChange={() => handleNicheToggle(niche.name!)}
                  className="rounded border-gray-700 text-orange-500 focus:ring-orange-500"
                />
                <span className="ml-2 text-black">{niche.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label
            htmlFor="brief_url"
            className="block text-sm font-medium text-black-200"
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
            className="mt-1 block w-full rounded-md border-gray-700 bg-white-700 text-black shadow-sm focus:border-orange-500 focus:ring-orange-500"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
        >
          Submit Brief
        </button>
      </form>
    </div>
  );
}