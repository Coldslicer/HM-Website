import React, { useEffect, useState } from 'react';
import { useCampaignStore } from '../../store/campaignStore';
import { SUPABASE_CLIENT } from '../../lib/supabase';
import { Eye } from 'lucide-react';
import axios from 'axios';
import { Link } from 'react-router-dom';
type CreatorSelectionProps = {
  campaignId?: string;
};

export const CreatorSelection: React.FC<CreatorSelectionProps> = ({ campaignId }) => {
  const { currentCampaign } = useCampaignStore();
  const [creators, setCreators] = useState([]);
  const [selectedCreators, setSelectedCreators] = useState([]);
  const [totalRate, setTotalRate] = useState(0);
  const [totalRateCPM, setTotalRateCPM] = useState(0);
  const [selectedStatement, setSelectedStatement] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchCreators();
  }, [currentCampaign]);

  const fetchCreators = async () => {
    const { data: creatorsData } = await SUPABASE_CLIENT
      .from('campaign_creators')
      .select('id, channel_url, channel_name, rate, rate_cpm, selected, personal_statement')
      .eq('campaign_id', campaignId || currentCampaign?.id);

    const creatorsWithChannelData = await Promise.all(
      creatorsData.map(async (creator) => {
        try {
          const response = await axios.get('/api/creators/channel-data', {
            params: { url: creator.channel_url, id: creator.id },
          });
          return {
            ...creator,
            ...response.data,
          };
        } catch (error) {
          console.error('Error fetching YouTube data:', error);
          return {
            ...creator,
            channelTitle: '',
            subscriberCount: '',
            avgViews: '',
            country: '',
          };
        }
      })
    );

    const sortedCreators = creatorsWithChannelData.sort((a, b) => b.selected - a.selected);

    setCreators(sortedCreators);
    const selected = sortedCreators.filter((c) => c.selected);
    setSelectedCreators(selected);
    setTotalRate(selected.reduce((acc, c) => acc + c.rate, 0));
    setTotalRateCPM(selected.reduce((acc, c) => acc + c.rate_cpm, 0));
  };

  const handleSelectCreator = async (creator) => {
    if (currentCampaign?.status !== 'brief_submitted') return;

    const updatedCreators = creators.map((c) =>
      c.channel_url === creator.channel_url ? { ...c, selected: !c.selected } : c
    );
    setCreators(updatedCreators);

    const selected = updatedCreators.filter((c) => c.selected);
    setSelectedCreators(selected);
    setTotalRate(selected.reduce((acc, c) => acc + c.rate, 0));
    setTotalRateCPM(selected.reduce((acc, c) => acc + c.rate_cpm, 0));

    await SUPABASE_CLIENT
      .from('campaign_creators')
      .update({ selected: !creator.selected })
      .eq('id', creator.id);
  };

  const finalizeCreators = async () => {
    const confirmed = window.confirm('Are you sure you want to finalize the selected creators?');
    if (confirmed) {
      try {
        const { error } = await SUPABASE_CLIENT
          .from('campaigns')
          .update({ 
            status: 'creators_selected', 
            total_price: totalRate 
          })
          .eq('id', currentCampaign.id);

        if (error) {
          console.error('Error updating campaign in Supabase:', error.message);
          alert('Failed to update campaign in Supabase.');
        } else {
          currentCampaign.status = 'creators_selected';
          alert('Creators finalized successfully!');
        }
      } catch (error) {
        console.error('Error finalizing creators:', error);
        alert('Failed to finalize creators.');
      }
    }
  };

  const handleOpenPopup = (statement: string) => {
    setSelectedStatement(statement);
  };

  const handleClosePopup = () => {
    setSelectedStatement(null);
  };

  const formatNumber = (num) => {
    return num?.toLocaleString() || '';
  };

  if (currentCampaign?.status === 'draft') {
    return (
      <div className="max-w-screen-xl mx-auto p-4 bg-gray-50 rounded-md">
        <h2 className="text-2xl font-bold text-black mb-6">Creator Selection</h2>
        <div className="text-black">
          After submitting your brief, here's where you'll see creators who want to work with you!
        </div>
      </div>
    );
  } else if (creators.length === 0) {
    return (
      <div className="max-w-screen-xl mx-auto p-4 bg-gray-50 rounded-md">
        <h2 className="text-2xl font-bold text-black mb-6">Creator Selection</h2>
        <div className="text-black">
          You'll see creators here as they express interest to participate. Please check back later to give creators time to view your brief! We typically get responses within a day.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto p-4 bg-gray-50 rounded-md">
      <h2 className="text-2xl font-bold text-black mb-6">Creator Selection</h2>

      <div className="overflow-x-auto bg-white-700 rounded-md mt-4 text-sm">
        <table className="min-w-full text-black">
          <thead>
            <tr className="bg-gray-50">
              <th className="py-3 px-4 text-left w-1/6">Channel Name</th>
              <th className="py-3 px-4 text-left w-1/6">Channel Link</th>
              <th className="py-3 px-4 text-right w-1/6">Flat Rate</th>
              <th className="py-3 px-4 text-right w-1/6">CPM Rate</th>
              <th className="py-3 px-4 text-right w-1/6">Followers/Subs</th>
              <th className="py-3 px-4 text-right w-1/6">Avg Views</th>
              <th className="py-3 px-4 text-right w-1/6">Country</th>
              <th className="py-3 px-4 text-center w-1/6">Personal Statement</th>
            </tr>
          </thead>
          <tbody>
            {creators.map((creator) => (
              <tr
                key={creator.channel_url}
                onClick={() => handleSelectCreator(creator)}
                className={`cursor-pointer ${creator.selected ? 'bg-green-400 hover:bg-green-300' : 'hover:bg-white-600'} ${currentCampaign?.status === 'brief_submitted' ? '' : 'cursor-not-allowed'}`}
              >
                <td className="py-3 px-4">{creator.channel_name || creator.channelTitle || ""}</td>
                <td className="py-3 px-4">
                  <a href={creator.channel_url} target="_blank" rel="noopener noreferrer" className="text-blue-400">
                    LINK
                  </a>
                </td>
                <td className="py-3 px-4 text-right">${formatNumber(creator.rate)}</td>
                <td className="py-3 px-4 text-right">${formatNumber(creator.rate_cpm)}</td>
                <td className="py-3 px-4 text-right">{formatNumber(creator.subscriberCount)}</td>
                <td className="py-3 px-4 text-right">{formatNumber(creator.averageViews)}</td>
                <td className="py-3 px-4 text-right">{creator.country}</td>
                <td className="py-3 px-4 text-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenPopup(creator.personal_statement);
                    }}
                    className="text-white-400 hover:text-white-500"
                  >
                    <Eye size={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between bg-gray-100 p-3 rounded-md text-sm text-black">
  <span className="font-medium">Total Rate: ${formatNumber(totalRate)} + CPM Payments</span>
  {!campaignId && currentCampaign?.status === 'brief_submitted' && (
    <button 
      onClick={finalizeCreators} 
      className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md transition"
    >
      Finalize Creators
    </button>
  )}
</div>


      {selectedStatement && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="bg-gray-50 p-6 rounded-lg max-w-md w-full">
            <h3 className="text-xl font-semibold text-black mb-4">Personal Statement</h3>
            <p className="text-black">{selectedStatement}</p>
            <button
              onClick={handleClosePopup}
              className="mt-4 bg-red-600 text-black px-4 py-2 rounded-md hover:bg-red-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
<div className="mt-4 p-2 bg-gray-100 text-black rounded-md text-sm flex items-center">
  <span className="mr-2">🔗 Love a creator but don't like their rate? </span>
  <Link to='https://docs.google.com/forms/d/1P6I3g-l7ENpU0yNHnjkmJ9lAq2uHs9Am4zadRl2tQ_I' className='text-blue-500 underline hover:text-blue-600'>Fill out this form</Link>
</div>

<div className="mt-4 p-2 bg-gray-100 text-black rounded-md text-sm flex items-center">
  <span className="mr-2">🔗 Share this page:</span>
  <button
    onClick={() => {
      navigator.clipboard.writeText(`${window.location.origin}/creatorsharing/${campaignId || currentCampaign?.id}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }}
    className={`ml-2 px-2 py-1 rounded text-xs ${
      copied ? "bg-blue-800 text-white" : "bg-blue-500 text-white hover:bg-blue-600"
    }`}
  >
    {copied ? "Copied!" : "Copy Link"}
  </button>
</div>


    </div>
  );
};

export default CreatorSelection;