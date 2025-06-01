import React from "react";

interface TimelineItemProps {
  creator: {
    id: string;
    handle: string;
    channel_url: string;
    contract_signed: boolean;
    draft: string;
    live_url: string;
    final_approved: boolean;
  };
  onOpenPopup: (url: string, creatorId: string, isDraft: boolean) => void;
}

const TimelineItem: React.FC<TimelineItemProps> = ({
  creator,
  onOpenPopup,
}) => {
  const contractComplete = creator.contract_signed;
  const draftComplete = isCompleted(creator.draft);
  const finalComplete = isCompleted(creator.live_url);
  const finalApproved = creator.final_approved;

  return (
    // <CreatorCard creator={creator}/>
    <></>
  );
};

// Helper function to check if a field is completed
const isCompleted = (field: string) =>
  typeof field === "string" && field.trim().length > 0;

export default TimelineItem;
