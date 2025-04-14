import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { SUPABASE_CLIENT } from "../lib/supabase";
import { Eye, Youtube } from "lucide-react";
import axios from "axios";
import { formatNum } from "../lib/utility";

export const CreatorSharingPage: React.FC = () => {
  const { campaignId } = useParams<{ campaignId: string }>();
  const [creators, setCreators] = useState<any[]>([]);
  const [totalRate, setTotalRate] = useState(0);
  const [totalRateCPM, setTotalRateCPM] = useState(0);
  const [selectedStatement, setSelectedStatement] = useState<string | null>(null);

  useEffect(() => {
    if (campaignId) {
      fetchCreators(campaignId);
    }
  }, [campaignId]);

  const fetchCreators = async (campaignId: string) => {
    const { data: creatorsData } = await SUPABASE_CLIENT.from("campaign_creators")
      .select("id, channel_url, channel_name, rate, rate_cpm, selected, personal_statement, cpm_cap")
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
      })
    );

    // Filter to only show selected creators
    const selectedCreators = creatorsWithChannelData
      .filter(c => c.selected)
      .sort((a, b) => b.channel_name.localeCompare(a.channel_name));

    setCreators(selectedCreators);
    setTotalRate(selectedCreators.reduce((acc, c) => acc + c.rate, 0));
    setTotalRateCPM(
      selectedCreators.reduce(
        (acc, c) => acc + (c.rate_cpm * (c.averageViews || 0)) / 1000,
        0
      )
    );
  };

  const handleOpenPopup = (statement: string) => setSelectedStatement(statement);
  const handleClosePopup = () => setSelectedStatement(null);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Selected Creators
      </h1>

      {/* Table Section */}
      <div className="overflow-x-auto rounded-lg shadow-md mb-4">
        <table className="min-w-full bg-white border-collapse rounded-lg">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-3 px-4 text-left rounded-tl-lg">Channel Name</th>
              <th className="py-3 px-4 text-center">Flat Rate</th>
              <th className="py-3 px-4 text-center">CPM Rate</th>
              <th className="py-3 px-4 text-center">CPM Cap</th>
              <th className="py-3 px-4 text-center">Subscribers</th>
              <th className="py-3 px-4 text-center">Avg Views</th>
              <th className="py-3 px-4 text-center">Country</th>
              <th className="py-3 px-4 text-center rounded-tr-lg">Statement</th>
            </tr>
          </thead>
          <tbody>
            {creators.map((creator) => (
              <tr
                key={creator.id}
                className="border-b"
              >
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <a
                      href={creator.channel_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-500 hover:text-gray-600"
                    >
                      <Youtube className="w-5 h-5 text-red-500" />
                    </a>
                    <span className="text-gray-800">
                      {creator.channel_name || creator.channelTitle || "N/A"}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4 text-center">
                  ${formatNum(creator.rate)}
                </td>
                <td className="py-3 px-4 text-center">
                  ${formatNum(creator.rate_cpm)}
                </td>
                <td className="py-3 px-4 text-center">
                  {creator.cpm_cap > 0 ? `$${formatNum(creator.cpm_cap)}` : "N/A"}
                </td>
                <td className="py-3 px-4 text-center">
                  {formatNum(creator.subscriberCount)}
                </td>
                <td className="py-3 px-4 text-center">
                  {formatNum(creator.averageViews)}
                </td>
                <td className="py-3 px-4 text-center">
                  {creator.country || "N/A"}
                </td>
                <td className="py-3 px-4 text-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenPopup(creator.personal_statement);
                    }}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    <Eye size={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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