import express from "express";
import axios from "axios";
import {supabase} from "../util/clients.js";

const router = express.Router();

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

async function extractChannelId(url) {
  const usernameMatch = url.match(/@([\w\d._-]+)/);
  const channelIdMatch = url.match(/\/channel\/([\w\d_-]+)/);

  if (channelIdMatch) {
    return channelIdMatch[1];
  } else if (usernameMatch) {
    const username = usernameMatch[1];
    const response = await axios.get(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${username}&key=${YOUTUBE_API_KEY}`,
    );
    const data = response.data;
    if (data.items && data.items.length > 0) {
      return data.items[0].snippet.channelId;
    }
    throw new Error("Channel not found for username.");
  }

  throw new Error("Invalid YouTube URL format.");
}

async function getChannelData(channelId) {
  const response = await axios.get(
    `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${YOUTUBE_API_KEY}`,
  );

  const channelData = response.data.items[0];
  if (!channelData) {
    throw new Error("Channel not found.");
  }

  const snippet = channelData.snippet;
  const stats = channelData.statistics;

  return {
    channelTitle: snippet.title,
    subscriberCount: parseInt(stats.subscriberCount, 10),
    country: snippet.country || "",
  };
}

async function getVideoData(channelId) {
  const response = await axios.get(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=10&order=date&type=video&key=${YOUTUBE_API_KEY}`,
  );

  const data = response.data;

  if (!data.items || data.items.length === 0) {
    throw new Error("No videos found for the channel.");
  }

  const videoIds = data.items.map((video) => video.id.videoId).join(",");

  if (!videoIds) {
    throw new Error("No valid videos found for the channel.");
  }

  const videoResponse = await axios.get(
    `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds}&key=${YOUTUBE_API_KEY}`,
  );

  console.log("[Info] YouTube API response: " + videoResponse.data);

  const videos = videoResponse.data.items;
  const totalViews = videos.reduce((sum, video) => {
    return sum + parseInt(video.statistics.viewCount || "0", 10);
  }, 0);

  const averageViews = totalViews / videos.length;
  console.log("Average view: " + averageViews);
  return {
    averageViews: averageViews.toString(),
  };
}

router.get("/discord-tag-to-id", async (req, res) => {
  const {discord_tag} = req.query;

    if (!discord_tag) {
      console.log("[Error] No discord tag provided");
      return res.status(400).json({error: "Discord tag is required"});
    }
    try {
      // await fetchAllGuildMembers(); // for seeing the server's members

      const response = {
        discordId: await lookupDiscordId(discord_tag)
      };

      res.json(response);
    } catch (err) {
      console.log("[Error] Problem with getting discord ID: " + err);
      return res.status(400).json({error: "Problem with getting discord ID"});
    }
});

router.get("/channel-data", async (req, res) => {
  const { url, id } = req.query;

  const { data, error } = await supabase
    .from("channel_data")
    .select("*")
    .eq("creator_id", id)
    .single();

  if (!error) {
    console.log(
      "[Info] Fetched cache for channel " +
      url +
      "\n" +
      `channelTitle: ${data.handle},\nsubscriberCount: ${data.follower_count},\ncountry: ${data.country},\naverageViews: ${data.average_views}`,
    );
    return res.json({
      channelTitle: data.handle,
      subscriberCount: data.follower_count,
      country: data.country,
      averageViews: data.average_views,
      // Add more fields as needed
    });
  }

  console.log(
    "[Info] Unable to fetch cache for channel " +
    url +
    "\nIf this is not the first query, please check infrastructure to limit api calls",
  );

  if (!url) {
    return res.status(400).json({ error: "Channel URL is required" });
  }

  try {
    const channelId = await extractChannelId(url);
    const channelData = await getChannelData(channelId);
    const videoData = await getVideoData(channelId);

    const response = {
      channelTitle: channelData.channelTitle || "",
      subscriberCount: channelData.subscriberCount || "",
      country: channelData.country || "",
      averageViews: videoData.averageViews || "",
      // Add more fields as needed
    };

    res.json(response);

    const { data, error } = await supabase
      .from("channel_data")
      .insert([
        {
          creator_id: id,
          handle: channelData.channelTitle,
          follower_count: channelData.subscriberCount,
          country: channelData.country,
          average_views: videoData.averageViews,
        },
      ])
      .select()
      .single();
  } catch (error) {
    console.log("error: " + error);
    res.json({
      channelTitle: "",
      subscriberCount: "",
      country: "",
      averageViews: "",
      // Add more fields as needed
    });
  }
});

/**
 * @typedef {Object} DiscordUser
 * @property {string} id              – Snowflake ID (e.g. "767458854249824328")
 * @property {string} username        – The user’s display name
 * @property {string} [discriminator] – Optional four-digit tag
 */

/**
 * @typedef {Object} DiscordMember
 * @property {DiscordUser} user
 */

/**
 * Given a Discord “tag” (either "username#1234" or just "username"),
 * looks up that user in a guild and returns their snowflake ID.
 *
 * @param {string} discordTag – The tag string from the query
 * @returns {Promise<string>} Resolves to the user’s ID
 * @throws {Error} If the format is invalid or the user isn’t found
 */
async function lookupDiscordId(discordTag) {
  // Split into [username, discriminator?]
  /** @type {[string, string|undefined]} */
  const parts = discordTag.includes("#")
    ? discordTag.split("#")
    : [discordTag, undefined];

  const username = parts[0];
  const discriminator = parts[1];

  if (!username) {
    throw new Error('Invalid Discord tag; must include at least a username');
  }

  /** @type {string} Guild (server) ID from your .env */
  const guildId = process.env.HOTSLICER_MEDIA_SERVER_ID;
  /** @type {string} Bot token from your .env */
  const botToken = process.env.DISCORD_TOKEN;

  // Fetch up to 1,000 members whose username matches
  // @type {DiscordMember[]}
  const res = await axios.get(
    `https://discord.com/api/v9/guilds/${guildId}/members/search`,
    {
      headers: {Authorization: `Bot ${botToken}`},
      params: {query: username, limit: 1000},
    }
  );
  const members = res.data;
  console.log("[Info] Discord members: "+members);

  // Find exact match on name + (if provided) discriminator
  const match = members.find((m) =>
    m.user.username === username &&
    (discriminator ? m.user.discriminator === discriminator : true)
  );

  if (!match) {
    throw new Error(`Discord user "${discordTag}" not found in guild ${guildId}`);
  }

  return match.user.id;
}

/**
 * Fetches all members in a guild via the REST API (paginating by 1000).
 * Logs each member as "username#discriminator ⇒ id".
 */
async function fetchAllGuildMembers() {
  const guildId   = process.env.HOTSLICER_MEDIA_SERVER_ID;
  const botToken  = process.env.DISCORD_TOKEN;
  let allMembers = [];
  let after      = '0';

  try {
    while (true) {
      const res = await axios.get(
        `https://discord.com/api/v9/guilds/${guildId}/members`,
        {
          headers: { Authorization: `Bot ${botToken}` },
          params: { limit: 1000, after },
        }
      );
      const batch = res.data;
      console.log(`Fetched ${batch.length} members (after=${after})`);
      allMembers = allMembers.concat(batch);
      if (batch.length < 1000) break;
      after = batch[batch.length - 1].user.id;
    }

    console.log(`\nTotal members fetched: ${allMembers.length}`);
    allMembers.forEach(m => {
      const u = m.user;
      console.log(`${u.username}#${u.discriminator} ⇒ ${u.id}`);
    });
  } catch (err) {
    console.error('Error fetching members:', err.response?.data || err.message);
  }
}

export default router;
