import React from "react";
import { useParams } from "react-router-dom";
import Creators from "./dashboard/Creators";

export const CreatorSharingPage: React.FC = () => {
  const { campaignId } = useParams<{ campaignId: string }>();

  return <Creators campaignId={campaignId} />;
};

export default CreatorSharingPage;
