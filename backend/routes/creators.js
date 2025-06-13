import express from 'express';
import axios from 'axios';
import { SUPABASE_CLIENT } from '../util/clients.js';

const router = express.Router();

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY; // Replace with your YouTube API key

async function extractChannelId(url) {
  const usernameMatch = url.match(/@([\w\d._-]+)/);
  const channelIdMatch = url.match(/\/channel\/([\w\d_-]+)/);

  if (channelIdMatch) {
    return channelIdMatch[1];
  } else if (usernameMatch) {
    const username = usernameMatch[1];
    const response = await axios.get(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${username}&key=${YOUTUBE_API_KEY}`
    );
    const data = response.data;
    if (data.items && data.items.length > 0) {
      return data.items[0].snippet.channelId;
    }
    throw new Error('Channel not found for username.');
  }

  throw new Error('Invalid YouTube URL format.');
}

async function getChannelData(channelId) {
  const response = await axios.get(
    `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${YOUTUBE_API_KEY}`
  );

  const channelData = response.data.items[0];
  if (!channelData) {
    throw new Error('Channel not found.');
  }

  const snippet = channelData.snippet;
  const stats = channelData.statistics;

  return {
    channelTitle: snippet.title,
    subscriberCount: parseInt(stats.subscriberCount, 10),
    country: snippet.country || '',
  };
}

async function getVideoData(channelId) {
  const response = await axios.get(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=10&order=date&type=video&key=${YOUTUBE_API_KEY}`
  );

  const data = response.data;

  if (!data.items || data.items.length === 0) {
    throw new Error('No videos found for the channel.');
  }

  const videoIds = data.items
    .map((video) => video.id.videoId)
    .join(',');

  if (!videoIds) {
    throw new Error('No valid videos found for the channel.');
  }

  const videoResponse = await axios.get(
    `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds}&key=${YOUTUBE_API_KEY}`
  );

  console.log("response: "+videoResponse.data);

  const videos = videoResponse.data.items;
  const totalViews = videos.reduce((sum, video) => {
    return sum + parseInt(video.statistics.viewCount || '0', 10);
  }, 0);

  const averageViews = totalViews / videos.length;
  console.log("Average view: "+averageViews)
  return {
    averageViews: averageViews.toString(),
  };
}

router.get('/channel-data', async (req, res) => {
  const { url, id } = req.query;

  const { data, error } = await SUPABASE_CLIENT
    .from('channel_data')
    .select('*')
    .eq('creator_id',id)
    .single();

  if (!error) {
    console.log("fetched cache for channel "+url+'\n'+`channelTitle: ${data.handle},\nsubscriberCount: ${data.follower_count},\ncountry: ${data.country},\naverageViews: ${data.average_views}`);
    return res.json({
      channelTitle: data.handle,
      subscriberCount: data.follower_count,
      country: data.country,
      averageViews: data.average_views,
      // Add more fields as needed
    });
  }

  console.log("unable to fetch cache for channel "+url+"\nIf this is not the first query, please check infrastructure to limit api calls");

  if (!url) {
    return res.status(400).json({ error: 'Channel URL is required' });
  }

  try {
    const channelId = await extractChannelId(url);
    const channelData = await getChannelData(channelId);
    const videoData = await getVideoData(channelId);

    const response = {
      channelTitle: channelData.channelTitle || '',
      subscriberCount: channelData.subscriberCount || '',
      country: channelData.country || '',
      averageViews: videoData.averageViews || '',
      // Add more fields as needed
    };

    res.json(response);

    const { data, error } = await SUPABASE_CLIENT
            .from('channel_data')
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
    console.log("error: "+error);
    res.json({
      channelTitle: '',
      subscriberCount: '',
      country: '',
      averageViews: '',
      // Add more fields as needed
    });
  }
});

export default router;