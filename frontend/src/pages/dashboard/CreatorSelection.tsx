import React, { useEffect, useState } from 'react';
import { useCampaignStore } from '../../store/campaignStore';
import { supabase } from '../../lib/supabase';
import { Eye } from 'lucide-react';
import axios from 'axios';

export const CreatorSelection: React.FC = () => {
  const { currentCampaign } = useCampaignStore();
  const [creators, setCreators] = useState([]);
  const [selectedCreators, setSelectedCreators] = useState([]);
  const [totalRate, setTotalRate] = useState(0);
  const [selectedStatement, setSelectedStatement] = useState<string | null>(null); // State for popup content

  useEffect(() => {
    fetchCreators();
  }, [currentCampaign]);

  const fetchCreators = async () => {
    const { data: creatorsData } = await supabase
      .from('campaign_creators')
      .select('id, channel_url, rate, selected, personal_statement') // Added personal_statement
      .eq('campaign_id', currentCampaign?.id);

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

    await supabase
      .from('campaign_creators')
      .update({ selected: !creator.selected })
      .eq('id', creator.id);
  };

  const finalizeCreators = async () => {
    const confirmed = window.confirm('Are you sure you want to finalize the selected creators?');
    if (confirmed) {
      try {
        currentCampaign.status = 'creators_selected';
        const { error } = await supabase
          .from('campaigns')
          .update({ status: 'creators_selected' })
          .eq('id', currentCampaign.id);

        if (error) {
          console.error('Error updating campaign status in Supabase:', error.message);
          alert('Failed to update campaign status in Supabase.');
        } else {
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

  if (currentCampaign?.status === 'draft') {
    return (
      <div className="max-w-screen-xl mx-auto p-4 bg-gray-800 rounded-md">
        <h2 className="text-2xl font-bold text-white mb-6">Creator Selection</h2>
        <div className="text-white">
          After submitting your brief, here's where you'll see creators who want to work with you!
        </div>
      </div>
    );
  } else if (creators.length === 0) {
    return (
      <div className="max-w-screen-xl mx-auto p-4 bg-gray-800 rounded-md">
        <h2 className="text-2xl font-bold text-white mb-6">Creator Selection</h2>
        <div className="text-white">
          You'll see creators here as they express interest to participate. Please check back later to give creators time to view your brief! We typically get responses within a day.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto p-4 bg-gray-800 rounded-md">
      <h2 className="text-2xl font-bold text-white mb-6">Creator Selection</h2>

      <div className="overflow-x-auto bg-gray-700 rounded-md mt-4 text-sm">
        <table className="min-w-full text-white">
          <thead>
            <tr className="bg-gray-800">
              <th className="py-3 px-4 text-left w-1/6">Channel Name</th>
              <th className="py-3 px-4 text-left w-1/6">Channel Link</th>
              <th className="py-3 px-4 text-right w-1/6">Rate</th>
              <th className="py-3 px-4 text-right w-1/6">Followers/Subs</th>
              <th className="py-3 px-4 text-right w-1/6">Avg Views</th>
              <th className="py-3 px-4 text-right w-1/6">Country</th>
              <th className="py-3 px-4 text-center w-1/6">Personal Statement</th> {/* New column */}
            </tr>
          </thead>
          <tbody>
            {creators.map((creator) => (
              <tr
                key={creator.channel_url}
                onClick={() => handleSelectCreator(creator)}
                className={`cursor-pointer ${creator.selected ? 'bg-green-600 hover:bg-green-700' : 'hover:bg-gray-600'} ${currentCampaign?.status === 'brief_submitted' ? '' : 'cursor-not-allowed'}`}
              >
                <td className="py-3 px-4">{creator.channelTitle || ""}</td>
                <td className="py-3 px-4">
                  <a href={creator.channel_url} target="_blank" rel="noopener noreferrer" className="text-blue-400">
                    LINK
                  </a>
                </td>
                <td className="py-3 px-4 text-right">{creator.rate}</td>
                <td className="py-3 px-4 text-right">{creator.subscriberCount}</td>
                <td className="py-3 px-4 text-right">{creator.averageViews}</td>
                <td className="py-3 px-4 text-right">{creator.country}</td>
                <td className="py-3 px-4 text-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent row selection
                      handleOpenPopup(creator.personal_statement);
                    }}
                    className="text-yellow-400 hover:text-yellow-500"
                  >
                    <Eye size={20} color="#FFFF" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-white text-right mt-4">
        <p>Total Rate: {totalRate}</p>
      </div>

      {currentCampaign?.status === 'brief_submitted' && (
        <div className="flex justify-center mt-4">
          <button onClick={finalizeCreators} className="bg-orange-500 text-white px-4 py-2 rounded-md">
            Finalize Creators
          </button>
        </div>
      )}

      {/* Popup Modal for Personal Statement */}
      {selectedStatement && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full">
            <h3 className="text-xl font-semibold text-white mb-4">Personal Statement</h3>
            <p className="text-white">{selectedStatement}</p>
            <button
              onClick={handleClosePopup}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatorSelection;
