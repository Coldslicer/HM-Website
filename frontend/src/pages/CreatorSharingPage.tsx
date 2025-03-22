import React from "react";
import { useParams } from "react-router-dom";
import CreatorSelection from "./dashboard/CreatorSelection";

export const CreatorSharingPage: React.FC = () => {
  const { campaignId } = useParams<{ campaignId: string }>();

  return <CreatorSelection campaignId={campaignId} />;
};

export default CreatorSharingPage;
