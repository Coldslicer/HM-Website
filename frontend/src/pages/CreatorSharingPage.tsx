import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import axios from "axios";
import { formatNum } from "../lib/utility";
import CreatorTable from "../components/dashboard/CreatorTable";

export const CreatorSharingPage: React.FC = () => {
  const { campaignId } = useParams<{ campaignId: string }>();
  const [creators, setCreators] = useState<any[]>([]);
  const [totalRate, setTotalRate] = useState(0);
  const [totalRateCPM, setTotalRateCPM] = useState(0);
  const [selectedStatement, setSelectedStatement] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (campaignId) {
      fetchCreators(campaignId);
    }
  }, [campaignId]);

  const fetchCreators = async (campaignId: string) => {
    const { data: creatorsData } = await supabase.from(
      "campaign_creators",
    )
      .select(
        "id, channel_url, channel_name, rate, rate_cpm, selected, personal_statement, cpm_cap",
      )
      .eq("campaign_id", campaignId);

    const creatorsWithChannelData = await Promise.all(
      creatorsData.map(async (creator) => {
        try {
          const response = await axios.get("/api/creators/channel-data", {
            params: { url: creator.channel_url, id: creator.id },
          });
          return {
            ...creator,
            ...response.data,
          };
        } catch (error) {
          console.error("Error fetching YouTube data:", error);
          return creator;
        }
      }),
    );

    const sortedCreators = creatorsWithChannelData.sort(
      (a, b) => b.selected - a.selected,
    );
    setCreators(sortedCreators);

    const selected = sortedCreators.filter((c) => c.selected);
    setTotalRate(selected.reduce((acc, c) => acc + c.rate, 0));
    setTotalRateCPM(
      selected.reduce(
        (acc, c) => acc + (c.rate_cpm * (c.averageViews || 0)) / 1000,
        0,
      ),
    );
  };

  const handleSelectCreator = async (creator: any) => {
    const updatedCreators = creators.map((c) =>
      c.id === creator.id ? { ...c, selected: !c.selected } : c,
    );
    setCreators(updatedCreators);

    const selected = updatedCreators.filter((c) => c.selected);
    setTotalRate(selected.reduce((acc, c) => acc + c.rate, 0));
    setTotalRateCPM(
      selected.reduce(
        (acc, c) => acc + (c.rate_cpm * (c.averageViews || 0)) / 1000,
        0,
      ),
    );

    await supabase.from("campaign_creators")
      .update({ selected: !creator.selected })
      .eq("id", creator.id);
  };

  const handleOpenPopup = (statement: string) =>
    setSelectedStatement(statement);
  const handleClosePopup = () => setSelectedStatement(null);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Creator Selection
      </h1>

      {/* Table Section */}
      <CreatorTable
        creators={creators}
        onSelectCreator={handleSelectCreator}
        onViewStatement={handleOpenPopup}
      />

      {/* Pricing Section */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center">
          <div className="text-left">
            <p className="font-medium text-gray-700">
              Total Flat Price: ${formatNum(totalRate)}
            </p>
            <p className="text-sm text-gray-600">
              Expected CPM: ${formatNum(Math.round(totalRateCPM))}
            </p>
          </div>
        </div>
      </div>

      {selectedStatement && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Personal Statement
            </h3>
            <p className="text-gray-600 whitespace-pre-wrap">
              {selectedStatement}
            </p>
            <button
              onClick={handleClosePopup}
              className="mt-4 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatorSharingPage;
