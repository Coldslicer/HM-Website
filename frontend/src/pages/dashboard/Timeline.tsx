/* ================ [ IMPORTS ] ================ */

import { useEffect, useState } from "react";
import { SUPABASE_CLIENT } from "../../lib/supabase";
import { useCampaignStore } from "../../store/campaignStore";
import { AnimatePresence } from "framer-motion";
import TimelineItem from "../../components/dashboard/TimelineItem";
import TimelinePopup from "../../components/dashboard/TimelinePopup";

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

  // Render timeline items using the new TimelineItem component
  const renderTimelineItem = (creator: any) => {
    return (
      <TimelineItem
        key={creator.id}
        creator={creator}
        onOpenPopup={openPopup}
      />
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
          <div className="space-y-6">
            {selectedCreators.map(renderTimelineItem)}
          </div>
        </AnimatePresence>
      )}

      {popupContent && popupCreatorId && (
        <TimelinePopup
          content={popupContent}
          creatorId={popupCreatorId}
          isDraft={popupIsDraft}
          onClose={closePopup}
          onApprove={handleApproval}
          isApproved={selectedCreators.find(c => c.id === popupCreatorId)?.final_approved}
        />
      )}
    </div>
  );
};

/* ================ [ EXPORTS ] ================ */

export default Timeline;
