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
  ReferenceDot,
} from "recharts";

/* ================ [ HELPERS ] ================ */

const getVideoID = (url: string) => {
  const match = url.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
};

const getViews = (daily_views: any, day: number) => {
  let value = daily_views?.[`views_${day}`];
  if (value == null) {
    for (let d = day - 1; d >= 1; d--) {
      const prevKey = `views_${d}`;
      if (daily_views?.[prevKey] != null) {
        value = daily_views[prevKey];
        break;
      }
    }
    if (value == null) value = 0;
  }
  return value;
};

const getCPM = (creator: any, daily_views: any) => {
  const views = getViews(daily_views, 30);
  return (creator.rate_cpm / 1000) * views;
};

/* ================ [ ANALYTICS ] ================ */

const Analytics = () => {
  const { currentCampaign } = useCampaignStore();
  const [videos, setVideos] = useState<any[]>([]);
  const [selectedVideos, setSelectedVideos] = useState<string[]>(["all"]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!currentCampaign?.id) return;

      try {
        const { data } = await axios.post("/api/payment/get-creators", {
          campaign_id: currentCampaign.id,
        });

        const videoData = await Promise.all(
          data.map(async (creator: any) => {
            if (!creator.live_url) return null;

            const videoId = getVideoID(creator.live_url);
            if (!videoId) return null;

            const videoStats = await axios.post("/api/analytics/grab-video", {
              video_url: creator.live_url,
            });

            return {
              video_id: videoId,
              title: creator.channel_name,
              creator,
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
    const values = selectedOptions
      ? selectedOptions.map((o: any) => o.value)
      : [];
    if (values.includes(allVideosOption.value)) {
      setSelectedVideos([allVideosOption.value]);
    } else {
      setSelectedVideos(
        values.filter((v: string) => v !== allVideosOption.value),
      );
    }
  };

  const filteredVideos =
    selectedVideos.includes(allVideosOption.value) ||
    selectedVideos.length === 0
      ? videos
      : videos.filter((v) => selectedVideos.includes(v.video_id));

  const chartData = useMemo(() => {
    if (filteredVideos.length === 0) return [];
    const days = Array.from({ length: 30 }, (_, i) => i + 1);
    return days.map((day) => {
      const point: any = { day };
      filteredVideos.forEach((video) => {
        point[video.title] = getViews(video.daily_views, day);
      });
      return point;
    });
  }, [filteredVideos]);

  const totalPerformanceData = useMemo(() => {
    if (filteredVideos.length === 0) return [];
    const days = Array.from({ length: 30 }, (_, i) => i + 1);
    return days.map((day) => {
      let total = 0;
      filteredVideos.forEach((video) => {
        total += getViews(video.daily_views, day);
      });
      return { day, views: total };
    });
  }, [filteredVideos]);

  const totalCPM = useMemo(() => {
    return filteredVideos.reduce(
      (sum, video) => sum + getCPM(video.creator, video.daily_views),
      0,
    );
  }, [filteredVideos]);

  const todayMap = useMemo(() => {
    const result: Record<string, number> = {};
    filteredVideos.forEach((v) => {
      const published = new Date(v.date_published);
      const now = new Date();
      const diff = Math.floor(
        (now.getTime() - published.getTime()) / (1000 * 60 * 60 * 24),
      );
      result[v.title] = Math.min(30, diff + 1);
    });
    return result;
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
        <p className="mt-4 text-gray-700 font-medium">
          Total Views (30 Days):{" "}
          {filteredVideos.reduce(
            (sum, v) => sum + getViews(v.daily_views, 30),
            0,
          )}
        </p>
        <p className="text-gray-700 font-medium">
          Total CPM of Selected Creators: ${totalCPM.toFixed(2)}
        </p>
      </div>

      {filteredVideos.length > 0 && (
        <>
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-xl font-semibold mb-4">Selected Videos</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={chartData}
                margin={{ top: 20, right: 60, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="day"
                  label={{
                    value: "Days Live",
                    position: "insideBottomRight",
                    offset: -5,
                  }}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                {filteredVideos.map((video, idx) => (
                  <>
                    <Line
                      key={video.video_id}
                      type="monotone"
                      dataKey={video.title}
                      stroke={colors[idx % colors.length]}
                      dot={false}
                    />
                    <ReferenceDot
                      key={`dot-${video.video_id}`}
                      x={todayMap[video.title]}
                      y={getViews(video.daily_views, todayMap[video.title])}
                      r={4}
                      fill={colors[idx % colors.length]}
                      stroke="none"
                      isFront={true}
                      label={{
                        value: "Today",
                        position: "top",
                        fill: colors[idx % colors.length],
                      }}
                    />
                  </>
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-xl font-semibold mb-4">Total Performance</h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart
                data={totalPerformanceData}
                margin={{ top: 20, right: 60, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="day"
                  label={{
                    value: "Days Live",
                    position: "insideBottomRight",
                    offset: -5,
                  }}
                />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="views"
                  stroke="#000000"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
            <p className="mt-4 text-gray-700 font-medium">
              Total Views:{" "}
              {totalPerformanceData.length > 0
                ? totalPerformanceData[29].views
                : 0}
            </p>
            <p className="text-gray-700 font-medium">
              Total CPM: ${totalCPM.toFixed(2)}
            </p>
          </div>

          {filteredVideos.length > 1 &&
            filteredVideos.map((video, idx) => {
              const days = Array.from({ length: 30 }, (_, i) => i + 1);
              const singleData = days.map((day) => ({
                day,
                views: getViews(video.daily_views, day),
              }));
              const individualCPM = getCPM(video.creator, video.daily_views);

              return (
                <div
                  key={video.video_id}
                  className="bg-white p-6 rounded-lg shadow-md mb-8"
                >
                  <h2 className="text-lg font-semibold mb-4">{video.title}</h2>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart
                      data={singleData}
                      margin={{ top: 20, right: 60, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="day"
                        label={{
                          value: "Days Live",
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
                      <ReferenceDot
                        x={todayMap[video.title]}
                        y={getViews(video.daily_views, todayMap[video.title])}
                        r={4}
                        fill={colors[idx % colors.length]}
                        stroke="none"
                        isFront={true}
                        label={{
                          value: "Today",
                          position: "top",
                          fill: colors[idx % colors.length],
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                  <p className="mt-4 text-gray-700 font-medium">
                    Views: {getViews(video.daily_views, 30)}
                  </p>
                  <p className="text-gray-700 font-medium">
                    CPM: ${individualCPM.toFixed(2)}
                  </p>
                </div>
              );
            })}
        </>
      )}
    </div>
  );
};

/* ================ [ EXPORTS ] ================ */

export default Analytics;
