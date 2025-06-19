/* ================ [ IMPORTS ] ================ */

import express from "express";
import axios from "axios";
import SocialBlade from "socialblade";
import { supabase } from "../util/clients.js";

/* ================ [ HELPERS ] ================ */

// Get video ID from URL
const getVideoID = (url) => {
  const match = url.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
};

/* ================ [ ANALYTICS ] ================ */

// Router
const ROUTER = express.Router();

// Fetch video views
const fetchVideoViews = async (videoId, date) => {
  // TODO: socialblade stuff?
};

// Fetch video details
const fetchVideoDetails = async (videoId) => {
  // Check supabase cache
  const { data: existing } = await supabase
    .from("video_data")
    .select("*")
    .eq("video_id", videoId)
    .single();

  let title, channel, datePublished;

  // Video already exists
  if (existing) {
    title = existing.title;
    channel = existing.channel;
    datePublished = existing.date_published;
  } else {
    // Grab video details
    const videoURL = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${process.env.YOUTUBE_API_KEY}`;
    const video = await (await axios.get(videoURL)).data.items?.[0];
    const videoData = video?.snippet;

    // Grab channel details
    const channelURL = `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${video.channelId}&key=${process.env.YOUTUBE_API_KEY}`;
    const channelRes = await (await axios.get(channelURL)).data.items?.[0];
    const channelData = channelRes?.snippet;

    title = videoData?.title;
    channel = channelData?.handle || channelData?.customUrl || "";
    datePublished = videoData?.publishedAt;

    // Insert metadata into Supabase
    const { error } = await supabase.from("video_data").insert({
      video_id: videoId,
      title,
      channel,
      date_published: datePublished,
    });

    if (error) {
      console.error("Error inserting video data:", error);
      return res.status(500).json({ error: "Failed to insert video data" });
    }
  }

  // Grab daily views
  const dailyViews = {};
  const startDate = new Date(datePublished);
  const today = new Date();

  for (let i = 1; i <= 30; i++) {
    const column = `views_${i}`;
    const target = new Date(startDate);
    target.setDate(startDate.getDate() + (i - 1));

    // Limit date to present
    if (target > today) break;

    let dayViews;

    // Check supabase cache
    if (existing) {
      dayViews = existing[column];
    } else {
      // Fetch missing day views
      dayViews = await fetchVideoViews(
        videoId,
        target.toISOString().split("T")[0],
      );

      // Update Supabase
      await supabase
        .from("video_data")
        .update({ [column]: dayViews })
        .eq("video_id", videoId);
    }

    dailyViews[column] = dayViews;
  }

  // Grab current total views
  const statsURL = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&key=${process.env.YOUTUBE_API_KEY}`;
  const statsRes = await (await axios.get(statsURL)).data.items?.[0];
  const views = parseInt(statsRes.statistics.viewCount, 10);

  // Update supabase
  await supabase.from("video_data").update({ views }).eq("video_id", videoId);

  return {
    title,
    channel,
    date_published: datePublished,
    daily_views: dailyViews,
    views,
  };
};

/* ================ [ ROUTES ] ================ */

// Grab videos
ROUTER.post("/grab-video", async (req, res) => {
  try {
    const { video_url } = req.body;

    // Grab video id
    const videoId = getVideoID(video_url);

    if (!videoId) {
      return res.status(400).json({ error: "Invalid YouTube URL" });
    }

    // Grab video details
    const videoDetails = await fetchVideoDetails(videoId);
    res.json(videoDetails);
  } catch (error) {
    console.error("Analytics error:", error);
    res
      .status(500)
      .json({ error: error.message || "Failed to fetch analytics" });
  }
});

/* ================ [ EXPORTS ] ================ */

export default ROUTER;
