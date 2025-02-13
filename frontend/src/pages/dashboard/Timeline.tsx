import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useCampaignStore } from '../../store/campaignStore';
import { ChevronRight } from 'lucide-react'; // Icon for visual indication

export const CreatorTimeline = () => {
  const { currentCampaign } = useCampaignStore();
  const [selectedCreators, setSelectedCreators] = useState([]);
  const [popupContent, setPopupContent] = useState(null); // State to manage popup content visibility

  useEffect(() => {
    fetchSelectedCreators();
  }, [currentCampaign]);

  const fetchSelectedCreators = async () => {
    const { data: creatorsData } = await supabase
      .from('campaign_creators')
      .select('id, draft, final, contract_signed, selected, channel_url')
      .eq('campaign_id', currentCampaign?.id)
      .eq('selected', true);

    if (!creatorsData) {
      return;
    }

    const creatorsWithHandle = creatorsData.map((creator) => {
      const handle = creator.channel_url.split('@')[1] || 'Unknown Handle';
      return {
        ...creator,
        handle,
      };
    });

    setSelectedCreators(creatorsWithHandle);
  };

  const isCompleted = (field) => field && field.trim().length > 0; // Checks if the field has a value

  const openPopup = (text) => {
    setPopupContent(text); // Open popup with the selected text
  };

  const closePopup = () => {
    setPopupContent(null); // Close popup
  };

  // Helper function to check if the text is a valid URL
  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const renderTimelineItem = (creator) => {
    const contractComplete = isCompleted(creator.contract_signed);
    const draftComplete = isCompleted(creator.draft);
    const finalComplete = isCompleted(creator.final);

    return (
      <div key={creator.id} className="bg-white rounded-lg p-6 mb-6 shadow-md">
        <h3 className="text-xl font-semibold text-gray-800">{creator.handle}</h3>

        {/* Timeline Row */}
        <div className="flex justify-between items-center mt-6">

          {/* Contract Signed Box */}
          <div className={`relative flex flex-col items-center w-1/3 p-4 rounded-md border-2 ${contractComplete ? 'border-green-500' : 'border-gray-300'} bg-gray-50`}>
            <div className="text-sm text-gray-600">Contract Signed</div>
            <div
              className={`mt-2 text-center text-sm cursor-pointer ${contractComplete ? 'text-green-500' : 'text-gray-500'}`}
              onClick={() => contractComplete && openPopup(creator.contract_signed)}
            >
              {contractComplete ? (
                <span className="flex items-center justify-center">
                  <span>Complete</span>
                  <ChevronRight className="ml-2 w-4 h-4" />
                </span>
              ) : (
                <span>Incomplete</span>
              )}
            </div>
          </div>

          {/* Connector Line from Contract to Draft */}
          <div
            className={`w-1/2 h-1 ${contractComplete && draftComplete ? 'bg-green-500' : 'bg-gray-300'}`}
          ></div>

          {/* Draft Submission Box */}
          <div className={`relative flex flex-col items-center w-1/3 p-4 rounded-md border-2 ${draftComplete ? 'border-green-500' : 'border-gray-300'} bg-gray-50`}>
            <div className="text-sm text-gray-600">Draft Submitted</div>
            <div
              className={`mt-2 text-center text-sm cursor-pointer ${draftComplete ? 'text-green-500' : 'text-gray-500'}`}
            >
              <a
                onClick={() => openPopup(creator.draft)}
                className={`cursor-pointer ${draftComplete ? 'text-green-500' : 'text-gray-500'} ${draftComplete ? 'hover:text-green-700' : 'hover:text-gray-500'} underline`}
              >
                {draftComplete ? (
                  <span className="flex items-center justify-center">
                    <span>Complete</span>
                    <ChevronRight className="ml-2 w-4 h-4" />
                  </span>
                ) : (
                  <span>Incomplete</span>
                )}
              </a>
            </div>
          </div>

          {/* Connector Line from Draft to Final */}
          <div
            className={`w-1/2 h-1 ${draftComplete && finalComplete ? 'bg-green-500' : 'bg-gray-300'}`}
          ></div>

          {/* Final Submission Box */}
          <div className={`relative flex flex-col items-center w-1/3 p-4 rounded-md border-2 ${finalComplete ? 'border-green-500' : 'border-gray-300'} bg-gray-50`}>
            <div className="text-sm text-gray-600">Final Submitted</div>
            <div
              className={`mt-2 text-center text-sm cursor-pointer ${finalComplete ? 'text-green-500' : 'text-gray-500'}`}
            >
              <a
                onClick={() => openPopup(creator.final)}
                className={`cursor-pointer ${finalComplete ? 'text-green-500' : 'text-gray-500'} ${finalComplete ? 'hover:text-green-700' : 'hover:text-gray-500'} underline`}
              >
                {finalComplete ? (
                  <span className="flex items-center justify-center">
                    <span>Complete</span>
                    <ChevronRight className="ml-2 w-4 h-4" />
                  </span>
                ) : (
                  <span>Incomplete</span>
                )}
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-screen-xl mx-auto p-6 bg-white rounded-lg">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Creator Timeline</h2>

      {selectedCreators.length === 0 ? (
        <p className="text-gray-600">No selected creators for this campaign.</p>
      ) : (
        <div className="space-y-6">
          {selectedCreators.map((creator) => renderTimelineItem(creator))}
        </div>
      )}

      {/* Popup Modal */}
      {popupContent && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Step Details</h3>
            <p className="text-gray-600">
              {isValidUrl(popupContent) ? (
                <a
                  href={popupContent}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 underline hover:text-blue-700"
                >
                  {popupContent}
                </a>
              ) : (
                popupContent
              )}
            </p>
            <button
              onClick={closePopup}
              className="mt-4 bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatorTimeline;