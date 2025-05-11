import React from "react";
import { useCampaignStore } from "../../store/campaignStore";

interface StepStatusProps {
  requiredStatus: string;
  children: React.ReactNode;
}

export function StepStatus({ requiredStatus, children }: StepStatusProps) {
  const { currentCampaign } = useCampaignStore();
  const isEnabled = currentCampaign?.status === requiredStatus;

  return (
    <div className={`${!isEnabled ? "opacity-50 pointer-events-none" : ""}`}>
      {children}
    </div>
  );
}
