/* ================ [ IMPORTS ] ================ */

import { useEffect, useState, useMemo } from "react";
import { useCampaignStore } from "../../store/campaignStore";
import axios from "axios";
import Select from "react-select";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

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
  const [selectedVideos, setSelectedVideos] = useState<string[]>(["all"]);

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
      } catch (error) {
        console.error("Error fetching analytics:", error);
      }
    };

    fetchAnalytics();
  }, [currentCampaign]);

  const allVideosOption = {
    label: "All videos",
    value: "all",
  };

  const videoOptions = videos.map((video) => ({
    label: video.title,
    value: video.video_id,
  }));

  const handleChange = (selectedOptions: any) => {
    const values = selectedOptions ? selectedOptions.map((o: any) => o.value) : [];
    if (values.includes(allVideosOption.value)) {
      setSelectedVideos([allVideosOption.value]);
    } else {
      setSelectedVideos(values.filter((v: string) => v !== allVideosOption.value));
    }
  };

  const filteredVideos =
    selectedVideos.includes(allVideosOption.value) || selectedVideos.length === 0
      ? videos
      : videos.filter((v) => selectedVideos.includes(v.video_id));

  const chartData = useMemo(() => {
    if (filteredVideos.length === 0) return [];
    const days = Array.from({ length: 30 }, (_, i) => i + 1);
    return days.map((day) => {
      const point: any = { day };
      filteredVideos.forEach((video) => {
        const dv = video.daily_views || {};
        const key = `views_${day}`;
        let value = dv[key];
        if (value == null) {
          for (let d = day - 1; d >= 1; d--) {
            const prevKey = `views_${d}`;
            if (dv[prevKey] != null) {
              value = dv[prevKey];
              break;
            }
          }
          if (value == null) value = 0;
        }
        point[video.title] = value;
      });
      return point;
    });
  }, [filteredVideos]);

  const colors = [
    "#8884d8",
    "#82ca9d",
    "#ffc658",
    "#ff7300",
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
  ];

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Analytics</h1>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <Select
          isMulti
          value={
            selectedVideos.includes(allVideosOption.value)
              ? [allVideosOption]
              : videoOptions.filter((option) =>
                  selectedVideos.includes(option.value),
                )
          }
          onChange={handleChange}
          options={[allVideosOption, ...videoOptions]}
          closeMenuOnSelect={false}
          placeholder="Select Videos"
        />
      </div>

      {filteredVideos.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">Selected Videos</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              data={chartData}
              margin={{ top: 20, right: 40, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="day"
                label={{
                  value: "Days After Publish",
                  position: "insideBottomRight",
                  offset: -5,
                }}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              {filteredVideos.map((video, idx) => (
                <Line
                  key={video.video_id}
                  type="monotone"
                  dataKey={video.title}
                  stroke={colors[idx % colors.length]}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {filteredVideos.length > 1 &&
        filteredVideos.map((video, idx) => {
          const days = Array.from({ length: 30 }, (_, i) => i + 1);
          const singleData = days.map((day) => {
            const dv = video.daily_views || {};
            const key = `views_${day}`;
            let value = dv[key];
            if (value == null) {
              for (let d = day - 1; d >= 1; d--) {
                const prevKey = `views_${d}`;
                if (dv[prevKey] != null) {
                  value = dv[prevKey];
                  break;
                }
              }
              if (value == null) value = 0;
            }
            return { day, views: value };
          });

          return (
            <div key={video.video_id} className="bg-white p-6 rounded-lg shadow-md mb-8">
              <h2 className="text-lg font-semibold mb-4">{video.title}</h2>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart
                  data={singleData}
                  margin={{ top: 20, right: 40, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="day"
                    label={{
                      value: "Days After Publish",
                      position: "insideBottomRight",
                      offset: -5,
                    }}
                  />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="views"
                    stroke={colors[idx % colors.length]}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          );
        })}
    </div>
  );
};

/* ================ [ EXPORTS ] ================ */

export default Analytics;
