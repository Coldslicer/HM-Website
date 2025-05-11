/* ================ [ IMPORTS ] ================ */

import { useEffect, useState } from "react";
import { useCampaignStore } from "../../store/campaignStore";
import axios from "axios";
import Select from "react-select";

/* ================ [ HELPERS ] ================ */

const getVideoID = (url: string) => {
  const match = url.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
};

/* ================ [ ANALYTICS ] ================ */

const Analytics = () => {
  // State variables
  const { currentCampaign } = useCampaignStore();
  const [videos, setVideos] = useState<any[]>([]);
  const [selectedVideos, setSelectedVideos] = useState<any[]>([]);

  // Fetch creator videos
  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!currentCampaign?.id) return;

      try {
        // Get creators
        const { data } = await axios.post("/api/payment/get-creators", {
          campaign_id: currentCampaign.id,
        });

        const videoData = await Promise.all(
          data.map(async (creator: any) => {
            if (!creator.final) return null;

            const videoId = getVideoID(creator.final);
            if (!videoId) return null;

            const videoStats = await axios.post("/api/analytics/grab-video", {
              video_url: creator.final,
            });

            return {
              video_id: videoId,
              title: videoStats.data.title,
              channel: videoStats.data.channel,
              date_published: videoStats.data.date_published,
              daily_views: videoStats.data.daily_views,
              views: videoStats.data.views,
            };
          }),
        );

        setVideos(videoData.filter((v) => v !== null));

        console.log("Videos fetched:", videoData);
      } catch (error) {
        console.error("Error fetching analytics:", error);
      }
    };

    fetchAnalytics();
  }, [currentCampaign]);

  const handleChange = (selectedOptions: any) => {
    setSelectedVideos(selectedOptions || []);
  };

  const allVideosOption = {
    label: "All videos",
    value: "all",
  };

  const videoOptions = videos.map((video) => ({
    label: video.title,
    value: video.videoId,
  }));

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedVideos(videoOptions.map((option) => option.value));
    } else {
      setSelectedVideos([]);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Analytics</h1>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <Select
          isMulti
          value={selectedVideos.map((videoId) =>
            videoOptions.find((option) => option.value === videoId),
          )}
          onChange={handleChange}
          options={[allVideosOption, ...videoOptions]}
          closeMenuOnSelect={false}
          placeholder="Select Videos"
        />
      </div>
    </div>
  );
};

/* ================ [ EXPORTS ] ================ */

export default Analytics;
