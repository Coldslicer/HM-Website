/* ================ [ IMPORTS ] ================ */

import React, { useEffect, useState } from "react";
import { useCampaignStore } from "../../store/campaignStore";
import { SUPABASE_CLIENT } from "../../lib/supabase";
import { Eye, Youtube, Share } from "lucide-react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { formatNum } from "../../lib/utility";

/* ================ [ CREATOR SELECTION ] ================ */

type CreatorSelectionProps = {
  campaignId?: string;
};

const Creators: React.FC<CreatorSelectionProps> = ({ campaignId }) => {
  const { currentCampaign } = useCampaignStore();
  const [creators, setCreators] = useState<any[]>([]);
  const [totalRate, setTotalRate] = useState(0);
  const [totalRateCPM, setTotalRateCPM] = useState(0);
  const [selectedStatement, setSelectedStatement] = useState<string | null>(
    null
  );
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCreators();
  }, [currentCampaign]);

  const fetchCreators = async () => {
    const { data: creatorsData } = await SUPABASE_CLIENT.from(
      "campaign_creators"
    )
      .select(
        "id, channel_url, channel_name, rate, rate_cpm, selected, personal_statement, cpm_cap",
      )
      .eq("campaign_id", campaignId || currentCampaign?.id);

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

    const sortedCreators = creatorsWithChannelData.sort(
      (a, b) => b.selected - a.selected
    );
    setCreators(sortedCreators);
    const selected = sortedCreators.filter((c) => c.selected);
    setTotalRate(selected.reduce((acc, c) => acc + c.rate, 0));
    setTotalRateCPM(
      selected.reduce(
        (acc, c) => acc + (c.rate_cpm * (c.averageViews || 0)) / 1000,
        0
      )
    );
  };

  const handleSelectCreator = async (creator: any) => {
    if (currentCampaign?.status !== "brief_submitted") return;

    const updatedCreators = creators.map((c) =>
      c.id === creator.id ? { ...c, selected: !c.selected } : c
    );
    setCreators(updatedCreators);
    const selected = updatedCreators.filter((c) => c.selected);
    setTotalRate(selected.reduce((acc, c) => acc + c.rate, 0));
    setTotalRateCPM(
      selected.reduce(
        (acc, c) => acc + (c.rate_cpm * (c.averageViews || 0)) / 1000,
        0
      )
    );

    await SUPABASE_CLIENT.from("campaign_creators")
      .update({ selected: !creator.selected })
      .eq("id", creator.id);
  };

  const finalizeCreators = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to finalize the selected creators?"
    );
  
    if (!confirmed) return;
  
    try {
      const { error } = await SUPABASE_CLIENT.from("campaigns")
        .update({ status: "creators_selected", total_price: totalRate })
        .eq("id", currentCampaign?.id);
  
      if (error) {
        console.error("Error updating campaign status:", error);
        alert("Something went wrong updating the campaign status.");
        return;
      }
  
      currentCampaign.status = "creators_selected";
  
      // Fire-and-forget: remove unselected creators from Discord
      axios
        .post("/api/campaigns/remove-unselected-discord-channels", {
          campaignId: currentCampaign?.id,
        })
        .catch((err) =>
          console.warn("Failed to remove unselected creators from Discord:", err)
        );
  
      // Fire-and-forget: create the group chat
      axios
        .post("/api/campaigns/create-group-chat", {
          campaignId: currentCampaign?.id,
        })
        .catch((err) =>
          console.warn("Failed to create group chat:", err)
        );
  
      alert("Creators finalized successfully!");
      navigate("/dashboard/creators");
    } catch (error) {
      console.error("Error finalizing creators:", error);
      alert("An unexpected error occurred.");
    }
  };
  

  const handleOpenPopup = (statement: string) =>
    setSelectedStatement(statement);
  const handleClosePopup = () => setSelectedStatement(null);

  const handleSharePage = () => {
    navigator.clipboard.writeText(
      `${window.location.origin}/creator-sharing/${
        campaignId || currentCampaign?.id
      }`
    );
    setCopied(true);
    alert("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 1500);
  };

  if (currentCampaign?.status === "draft") {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Creator Selection
        </h1>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <p className="text-gray-600">
            After submitting your brief, here's where you'll see creators who
            want to work with you!
          </p>
        </div>
      </div>
    );
  }

  if (creators.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Creator Selection
        </h1>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <p className="text-gray-600">
            You'll see creators here as they express interest. Please check back
            later!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Creator Selection
      </h1>

      {/* Table Section */}
      <div className="overflow-x-auto rounded-lg shadow-md mb-4">
        <table className="min-w-full bg-white border-collapse rounded-lg">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-3 px-4 text-left rounded-tl-lg">
                Channel Name
              </th>
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
                onClick={() => handleSelectCreator(creator)}
                className={`border-b cursor-pointer ${
                  creator.selected
                    ? "bg-orange-100 hover:bg-orange-200"
                    : "hover:bg-gray-50"
                } ${
                  currentCampaign?.status !== "brief_submitted"
                    ? "cursor-not-allowed"
                    : ""
                }`}
              >
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <a
                      href={creator.channel_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
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
                  {creator.cpm_cap > 0
                    ? `$${formatNum(creator.cpm_cap)}`
                    : "N/A"}
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

      {/* Instructions */}
      <p className="text-sm text-gray-500 mb-6">
        *Select creators by clicking their respective rows in the table above.
      </p>

      {/* Pricing and Actions Section */}
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

          <div className="flex gap-4">
            {currentCampaign?.status === "brief_submitted" && (
              <button
                onClick={finalizeCreators}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md transition"
              >
                Finalize Creators
              </button>
            )}
            <button
              onClick={handleSharePage}
              className={`bg-orange-500 hover:bg-orange-600 text-white rounded-md transition ${
                currentCampaign?.status === "brief_submitted"
                  ? "p-2"
                  : "px-4 py-2 min-w-[140px]"
              }`}
            >
              {currentCampaign?.status === "brief_submitted" ? (
                <Share className="w-5 h-5" />
              ) : copied ? (
                "Link copied!"
              ) : (
                "Share this page"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Form Link */}
      <div className="mt-4">
        <p className="text-sm text-gray-500">
          *Love a creator but don't like their rate?{" "}
          <Link
            to="https://docs.google.com/forms/d/1P6I3g-l7ENpU0yNHnjkmJ9lAq2uHs9Am4zadRl2tQ_I"
            className="text-orange-500 hover:text-orange-600"
          >
            Fill out this form
          </Link>
        </p>
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

/* ================ [ EXPORTS ] ================ */

export default Creators;
