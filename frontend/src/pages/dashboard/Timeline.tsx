import React, { useEffect, useState } from 'react';
import { SUPABASE_CLIENT } from '../../lib/supabase';
import { useCampaignStore } from '../../store/campaignStore';
import { ChevronRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export const CreatorTimeline = () => {
  const { currentCampaign } = useCampaignStore();
  const [selectedCreators, setSelectedCreators] = useState([]);
  const [popupContent, setPopupContent] = useState(null);

  useEffect(() => {
    fetchSelectedCreators();
  }, [currentCampaign]);

  const fetchSelectedCreators = async () => {
    const { data: creatorsData } = await SUPABASE_CLIENT
      .from('campaign_creators')
      .select('id, draft, final, contract_signed, selected, channel_url, channel_name, final_approved, discord_id')
      .eq('campaign_id', currentCampaign?.id)
      .eq('selected', true);

    if (!creatorsData) return;

    const creatorsWithHandle = creatorsData.map((creator) => {
      const handle = creator.channel_name || creator.channel_url.split('@')[1] || "Unknown";
      return { ...creator, handle };
    });

    const sortedCreators = creatorsWithHandle.sort((a, b) => {
      if (a.final_approved && !b.final_approved) return 1;
      if (!a.final_approved && b.final_approved) return -1;
      if (isCompleted(a.final) && !a.final_approved) return -1;
      if (isCompleted(b.final) && !b.final_approved) return 1;
      if (isCompleted(a.draft) && !isCompleted(b.draft)) return -1;
      if (!isCompleted(a.draft) && isCompleted(b.draft)) return 1;
      if (isCompleted(a.contract_signed) && !isCompleted(b.contract_signed)) return -1;
      if (!isCompleted(a.contract_signed) && isCompleted(b.contract_signed)) return 1;
      return 0;
    });

    setSelectedCreators((prevCreators) => [...sortedCreators]);
  };

  const isCompleted = (field) => field && field.trim().length > 0;

  const openPopup = (text) => setPopupContent(text);
  const closePopup = () => setPopupContent(null);

  const handleApproval = async (creatorId) => {
    const { data: creator } = await supabase
      .from('campaign_creators')
      .select('discord_id')
      .eq('id', creatorId)
      .single();

    if (!creator) return;

    await supabase
      .from('campaign_creators')
      .update({ final_approved: true })
      .eq('id', creatorId);

    fetchSelectedCreators();
    
    // Send formatted message upon approval
    fetch('/api/messages/sendDM', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `[hidden from clients] Hey there <@${creator.discord_id}>, the client has approved your final draft. Good work!`,
        id: creatorId,
        type: "dm",
      }),
    });
  };

  const renderTimelineItem = (creator) => {
    const contractComplete = isCompleted(creator.contract_signed);
    const draftComplete = isCompleted(creator.draft);
    const finalComplete = isCompleted(creator.final);
    const finalApproved = creator.final_approved;

    return (
      <motion.div 
        key={creator.id} 
        className="bg-white rounded-lg p-6 mb-6 shadow-md"
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <h3 className="text-xl font-semibold text-gray-800">{creator.handle}</h3>
        <div className="flex justify-between items-center mt-6">
          <div className={`relative flex flex-col items-center w-1/4 p-4 rounded-md border-2 ${contractComplete ? 'border-green-500' : 'border-gray-300'} bg-gray-50`}>
            <div className="text-sm text-gray-600">Contract Signed</div>
            <div className={`mt-2 text-sm ${contractComplete ? 'text-green-500' : 'text-gray-500'}`}>{contractComplete ? 'Complete' : 'Incomplete'}</div>
          </div>
          <div className={`w-1/6 h-1 ${contractComplete && draftComplete ? 'bg-green-500' : 'bg-gray-300'}`}></div>
          <div className={`relative flex flex-col items-center w-1/4 p-4 rounded-md border-2 ${draftComplete ? 'border-green-500' : 'border-gray-300'} bg-gray-50`}>
            <div className="text-sm text-gray-600">Draft Submitted</div>
            <div className={`mt-2 text-sm ${draftComplete ? 'text-green-500' : 'text-gray-500'}`}>{draftComplete ? 'Complete' : 'Incomplete'}</div>
          </div>
          <div className={`w-1/6 h-1 ${draftComplete && finalComplete ? 'bg-green-500' : 'bg-gray-300'}`}></div>
          <div className={`relative flex flex-col items-center w-1/4 p-4 rounded-md border-2 ${finalComplete ? 'border-green-500' : 'border-gray-300'} bg-gray-50`}>
            <div className="text-sm text-gray-600">Final Submitted</div>
            <div className={`mt-2 text-sm ${finalComplete ? 'text-green-500' : 'text-gray-500'}`}>{finalComplete ? 'Complete' : 'Incomplete'}</div>
          </div>
        </div>
        {finalComplete && (
          <div className="flex justify-center mt-4">
            <button
              onClick={() => handleApproval(creator.id)}
              disabled={finalApproved}
              className={`px-4 py-2 rounded-md text-white ${finalApproved ? 'bg-green-500 cursor-default' : 'bg-orange-500 hover:bg-orange-600'}`}
            >
              {finalApproved ? 'Approved' : 'Approve for Submission'}
            </button>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="max-w-screen-xl mx-auto p-6 bg-white rounded-lg">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Creator Timeline</h2>
      {selectedCreators.length === 0 ? (
        <p className="text-gray-600">Loading...</p>
      ) : (
        <AnimatePresence>
          <div className="space-y-6">{selectedCreators.map(renderTimelineItem)}</div>
        </AnimatePresence>
      )}
    </div>
  );
};

export default CreatorTimeline;
