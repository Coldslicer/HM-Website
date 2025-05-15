/* ================ [ IMPORTS ] ================ */

import { useEffect, useState } from "react";
import { SUPABASE_CLIENT } from "../../lib/supabase";
import { useCampaignStore } from "../../store/campaignStore";
import { AnimatePresence, motion } from "framer-motion";
import { ReviewMessaging } from "./ReviewMessaging.tsx";
import { Youtube } from "lucide-react";

/* ================ [ TIMELINE ] ================ */

const Timeline = () => {
  const { currentCampaign } = useCampaignStore();
  const [selectedCreators, setSelectedCreators] = useState<any[]>([]);
  const [popupContent, setPopupContent] = useState<string | null>(null);
  const [popupCreatorId, setPopupCreatorId] = useState<string | null>(null);
  const [popupIsDraft, setPopupIsDraft] = useState<boolean>(false);

  useEffect(() => {
    fetchSelectedCreators();
  }, [currentCampaign]);

  const isURL = (str: string) =>
    typeof str === "string" && /^https?:\/\//.test(str.trim());

  const getEmbedURL = (url: string) => {
    if (!isURL(url)) return null;

    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
    if (ytMatch) {
      return `https://www.youtube.com/embed/${ytMatch[1]}`;
    }

    return url; // fallback for non-YouTube links
  };

  const fetchSelectedCreators = async () => {
    const { data: creatorsData } = await SUPABASE_CLIENT.from(
      "campaign_creators",
    )
      .select(
        "id, draft, live_url, contract_signed, selected, channel_url, channel_name, final_approved, discord_id",
      )
      .eq("campaign_id", currentCampaign?.id)
      .eq("selected", true);

    if (!creatorsData) return;

    const creatorsWithHandle = creatorsData.map((creator) => ({
      ...creator,
      handle:
        creator.channel_name || creator.channel_url.split("@")[1] || "Unknown",
      live_url: creator.live_url ?? "",
    }));

    const sortedCreators = creatorsWithHandle.sort((a, b) => {
      if (a.final_approved && !b.final_approved) return 1;
      if (!a.final_approved && b.final_approved) return -1;
      if (isCompleted(a.live_url) && !a.final_approved) return -1;
      if (isCompleted(b.live_url) && !b.final_approved) return 1;
      if (isCompleted(a.draft) && !isCompleted(b.draft)) return -1;
      if (!isCompleted(a.draft) && isCompleted(b.draft)) return 1;
      return 0;
    });

    setSelectedCreators(sortedCreators);
  };

  const isCompleted = (field: string) =>
    typeof field === "string" && field.trim().length > 0;

  // Updated to accept both URL and creator ID
  const openPopup = (url: string, creatorId: string, isDraft: boolean) => {
    setPopupContent(url);
    setPopupCreatorId(creatorId);
    setPopupIsDraft(isDraft);
  };
  const closePopup = () => {
    setPopupContent(null);
    setPopupCreatorId(null);
    setPopupIsDraft(false);
  };

  const handleApproval = async (creatorId: string) => {
    const { data: creator } = await SUPABASE_CLIENT.from("campaign_creators")
      .select("discord_id")
      .eq("id", creatorId)
      .single();

    if (!creator) return;

    await SUPABASE_CLIENT.from("campaign_creators")
      .update({ final_approved: true })
      .eq("id", creatorId);

    fetchSelectedCreators();

    fetch("/api/messages/sendDM", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `[hidden from clients] Hey there <@${creator.discord_id}>, the client has approved your live draft. Good work!`,
        id: creatorId,
        type: "dm",
      }),
    });
  };

  const renderTimelineItem = (creator: any) => {
    const contractComplete = creator.contract_signed;
    const draftComplete = isCompleted(creator.draft);
    const finalComplete = isCompleted(creator.live_url);
    const finalApproved = creator.final_approved;

    return (
      <motion.div
        key={creator.id}
        className="bg-white rounded-lg shadow-md p-6 mb-6"
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <a
              href={creator.channel_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Youtube className="w-5 h-5 text-red-600" />
            </a>
            <h3 className="text-xl font-semibold text-gray-800">
              {creator.handle}
            </h3>
          </div>

          {/* Removed approval button here per request, approval moved inside draft popup */}
        </div>

        <div className="flex items-center w-full">
          {/* Contract Signed */}
          <div className="flex-1">
            <div
              className={`p-3 rounded-md border-2 ${
                contractComplete ? "border-orange-500" : "border-gray-300"
              } bg-gray-50 text-center mx-1`}
            >
              <div className="text-sm text-gray-600 mb-1">Contract Signed</div>
              <div className="text-sm text-gray-500 flex items-center justify-center gap-1">
                {contractComplete ? (
                  <>
                    <span className="text-orange-500">Complete</span>
                    <div className="relative group">
                      <span className="text-orange-500 opacity-70 cursor-help">
                        ?
                      </span>
                      <div className="absolute z-50 bottom-full mb-2 left-1/2 transform -translate-x-1/2 w-64 text-xs bg-white text-gray-700 border border-gray-300 rounded-md p-2 shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
                        Creator contracts are between Hotslicer Media and
                        creators. We don't show them to clients at this time,
                        but be assured that this creator is contractually
                        obligated to follow through with the campaign.
                      </div>
                    </div>
                  </>
                ) : (
                  <span>Incomplete</span>
                )}
              </div>
            </div>
          </div>

          <div
            className={`flex-1 h-0.5 ${
              contractComplete && draftComplete
                ? "bg-orange-500"
                : "bg-gray-300"
            }`}
          />

          {/* Draft Submitted */}
          <div className="flex-1">
            <div
              className={`p-3 rounded-md border-2 ${
                draftComplete ? "border-orange-500" : "border-gray-300"
              } bg-gray-50 text-center mx-1`}
            >
              <div className="text-sm text-gray-600 mb-1">Draft Submitted</div>
              {draftComplete ? (
  <button
    className="text-orange-500 font-semibold underline cursor-pointer text-sm"
    onClick={() => openPopup(creator.draft, creator.id, true)}
  >
    {creator.final_approved ? "Completed" : "Pending Review"}
  </button>
) : (
  <div className="text-gray-500 text-sm">Incomplete</div>
)}

            </div>
          </div>

          <div
            className={`flex-1 h-0.5 ${
              draftComplete && finalComplete ? "bg-orange-500" : "bg-gray-300"
            }`}
          />

          {/* Live Submitted */}
          <div className="flex-1">
            <div
              className={`p-3 rounded-md border-2 ${
                finalComplete ? "border-orange-500" : "border-gray-300"
              } bg-gray-50 text-center mx-1`}
            >
              <div className="text-sm text-gray-600 mb-1">Live Submitted</div>
              {finalComplete ? (
                <button
                  className="text-orange-500 font-semibold underline cursor-pointer text-sm"
                  onClick={() => openPopup(creator.live_url, creator.id, false)}
                >
                  Complete
                </button>
              ) : (
                <div className="text-gray-500 text-sm">Incomplete</div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Creator Timeline
      </h1>

      {selectedCreators.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <p className="text-gray-500">No creators selected yet</p>
        </div>
      ) : (
        <AnimatePresence>
          <div className="space-y-6">{selectedCreators.map(renderTimelineItem)}</div>
        </AnimatePresence>
      )}

      {popupContent && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">

            <div className="text-gray-600 mb-4">
              {(() => {
                const embedURL = getEmbedURL(popupContent);
                return embedURL ? (
                  <iframe
                    src={embedURL}
                    className="w-full h-64 rounded-md border"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <p>{popupContent}</p>
                );
              })()}
            </div>

            {/* Show ReviewMessaging */}
            {popupCreatorId && <ReviewMessaging creatorId={popupCreatorId} />}

            {/* Show approval button only if draft popup */}
            {popupIsDraft && popupCreatorId && (() => {
  const creator = selectedCreators.find(c => c.id === popupCreatorId);
  const isApproved = creator?.final_approved;

  return (
    <button
      disabled={isApproved}
      onClick={() => {
        if (!isApproved) {
          handleApproval(popupCreatorId);
          closePopup();
        }
      }}
      className={`w-full px-4 py-2 rounded-md mt-4 transition
        ${isApproved
          ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
          : 'bg-orange-500 hover:bg-orange-600 text-white'
        }`}
    >
      {isApproved ? 'Draft Already Approved' : 'Approve Draft'}
    </button>
  );
})()}



            <button
              onClick={closePopup}
              className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md transition mt-2"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ================ [ EXPORTS ] ================ */

export default Timeline;
