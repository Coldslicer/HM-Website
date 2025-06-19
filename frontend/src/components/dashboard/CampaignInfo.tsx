import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Card } from "../ui/Card";

interface CampaignInfoProps {
  campaignId: string;
}

export const CampaignInfo: React.FC<CampaignInfoProps> = ({ campaignId }) => {
  const [campaign, setCampaign] = useState(null);
  const [roles, setRoles] = useState([]);
  const [loadingCampaign, setLoadingCampaign] = useState(true);
  const [loadingRoles, setLoadingRoles] = useState(true);

  useEffect(() => {
    async function fetchCampaign() {
      setLoadingCampaign(true);
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .eq("id", campaignId)
        .single();

      if (error) {
        console.error("Error fetching campaign:", error);
        setCampaign(null);
      } else {
        setCampaign(data);
      }
      setLoadingCampaign(false);
    }

    async function fetchRoles() {
      setLoadingRoles(true);
      const { data, error } = await supabase
        .from("roles")
        .select("id,title");

      if (error) {
        console.error("Error fetching roles:", error);
        setRoles([]);
      } else {
        setRoles(data || []);
      }
      setLoadingRoles(false);
    }

    if (campaignId) {
      fetchCampaign();
      fetchRoles();
    }
  }, [campaignId]);

  if (loadingCampaign) return <p>Loading campaign info...</p>;
  if (!campaign) return <p>Campaign not found.</p>;

  const roleTitles = campaign.per_influencer_budget
    .map((roleId) => roles.find((role) => role.id === roleId)?.title)
    .filter(Boolean) as string[];

  return (
    <div className="w-full p-6 space-y-6">
      <h2 className="text-3xl font-bold text-gray-800">Campaign Brief</h2>

      <div className="grid grid-cols-1 gap-8">
        {/* Brand Information Card */}
        <Card className="p-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-6">
            Brand Information
          </h3>

          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-700">Brand Name</dt>
              <dd className="mt-1 text-gray-600">{campaign.company_name}</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-700">Brand Website</dt>
              <dd className="mt-1 text-gray-600">{campaign.website}</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-700">Brand Description</dt>
              <dd className="mt-1 text-gray-600">{campaign.company_description}</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-700">Representative Name</dt>
              <dd className="mt-1 text-gray-600">{campaign.rep_name}</dd>
            </div>
          </dl>
        </Card>

        {/* Campaign Information Card */}
        <Card className="p-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-6">
            Campaign Information
          </h3>

          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-700">Campaign Name</dt>
              <dd className="mt-1 text-gray-600">{campaign.name}</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-700">Posting Date</dt>
              <dd className="mt-1 text-gray-600">{campaign.date}</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-700">Channels</dt>
              <dd className="mt-1 text-gray-600">{campaign.niches.join(", ")}</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-700">Per-Influencer Roles</dt>
              <dd className="mt-1 text-gray-600">
                {loadingRoles ? "Loading roles..." : roleTitles.join(", ")}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-700">Brief URL</dt>
              <dd className="mt-1">
                <a
                  href={campaign.brief_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-500 hover:text-orange-600 hover:underline transition-colors"
                >
                  View Brief
                </a>
              </dd>
            </div>
          </dl>
        </Card>
      </div>
    </div>
  );
};
