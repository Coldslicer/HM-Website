import React, { useEffect, useState } from "react";
import { SUPABASE_CLIENT } from "../../lib/supabase";
import { Card } from "../ui/Card";

interface Campaign {
  company_name: string;
  website: string;
  company_description: string;
  rep_name: string;
  name: string;
  date: string;
  niches: string[];
  per_influencer_budget: string[]; // array of role IDs
  brief_url: string;
}

interface Role {
  id: string;
  title: string;
}

interface CampaignInfoProps {
  currentCampaign: Campaign;
}

export const CampaignInfo: React.FC<CampaignInfoProps> = ({ currentCampaign }) => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRoles() {
      setLoading(true);
      const { data, error } = await SUPABASE_CLIENT
        .from<Role>("roles")
        .select("id,title");

      if (error) {
        console.error("Error fetching roles:", error);
        setRoles([]);
      } else {
        setRoles(data || []);
      }
      setLoading(false);
    }

    fetchRoles();
  }, []);

  const roleTitles = currentCampaign.per_influencer_budget
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
              <dd className="mt-1 text-gray-600">{currentCampaign.company_name}</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-700">Brand Website</dt>
              <dd className="mt-1 text-gray-600">{currentCampaign.website}</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-700">Brand Description</dt>
              <dd className="mt-1 text-gray-600">{currentCampaign.company_description}</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-700">Representative Name</dt>
              <dd className="mt-1 text-gray-600">{currentCampaign.rep_name}</dd>
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
              <dd className="mt-1 text-gray-600">{currentCampaign.name}</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-700">Posting Date</dt>
              <dd className="mt-1 text-gray-600">{currentCampaign.date}</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-700">Channels</dt>
              <dd className="mt-1 text-gray-600">{currentCampaign.niches.join(", ")}</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-700">Per-Influencer Roles</dt>
              <dd className="mt-1 text-gray-600">
                {loading ? "Loading roles..." : roleTitles.join(", ")}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-700">Brief URL</dt>
              <dd className="mt-1">
                <a
                  href={currentCampaign.brief_url}
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
