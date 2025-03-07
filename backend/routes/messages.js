// routes/messages.ts
import express from 'express';
import { DISCORD_CLIENT, SUPABASE_CLIENT } from '../util/setup.js'; 
import { ChannelType } from 'discord.js';

const router = express.Router();

async function fetchMessages(channelId) {
  try {
    const channel = await DISCORD_CLIENT.channels.fetch(channelId);
    if (!channel || channel.type !== ChannelType.GuildText) {
      throw new Error('Channel not found or is not a text channel');
    }

    const messages = await channel.messages.fetch({ limit: 50 }); // Fetch the last 50 messages
return messages
  .filter((message) => !message.content.toLowerCase().startsWith("[hidden from clients]".toLowerCase()))
  .map((message) => ({
    id: message.id,
    content: message.content,
    bot: message.author.bot,
    author: message.author.username,
    timestamp: message.createdTimestamp,
  }));


  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
}

router.post('/sendDM', async (req, res) => {
  const { message, id, isGroup } = req.body;
  let channelId, webhookUrl;

  // Fetch channel_id and webhook_url from Supabase
  let data, error;
  try {
  if (isGroup) {
    ({ data, error } = await SUPABASE_CLIENT
      .from("campaigns")
      .select("group_chat_channel_id, webhook_url")
      .eq('id', id)
      .single());
    channelId = data.group_chat_channel_id;
  } else {
    ({ data, error } = await SUPABASE_CLIENT
      .from("campaign_creators")
      .select("channel_id, webhook_url")
      .eq('id', id)
      .single());
    channelId = data.channel_id;
  }
  } catch {
    res.status(500).json({ error: 'Error fetching database information' });
  }

  console.log("recieved channel data: "+data);

  if (error) {
    console.log("Error fetching creator DM information:", error);
    return res.status(500).json({ error: 'Error fetching creator DM info' });
  }

  if (!data) {
    console.log("No data found for the given ID");
    return res.status(404).json({ error: 'No data found for the given ID' });
  }

  webhookUrl = data.webhook_url;

  if (webhookUrl) {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: message }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.statusText}`);
      }

      console.log('Message sent successfully!');
      res.status(200).json({ message: 'Message sent successfully via webhook' }); // Add response
    } catch (error) {
      console.error('Error sending webhook message:', error.message);
      res.status(500).json({ error: error.message }); // Add error response
    }
  } else {
    try {
      const channel = await DISCORD_CLIENT.channels.fetch(channelId);
      if (!channel || channel.type !== ChannelType.GuildText) {
        throw new Error('Channel not found or is not a text channel');
      }

      await channel.send(message);
      console.log('A message sent successfully to channel:', channelId);
      res.status(200).json({ message: 'Message sent successfully' });
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ error: error.message }); // Ensure response is sent
    }
  }
});

router.post('/send', async (req, res) => {
  const { channelId, message } = req.body;
  if (!channelId || !message) {
    return res.status(400).json({ error: 'Channel ID and message are required' });
  }

  try {
    const channel = await DISCORD_CLIENT.channels.fetch(channelId);
    if (!channel || channel.type !== ChannelType.GuildText) {
      throw new Error('Channel not found or is not a text channel');
    }

    await channel.send(message);
    console.log('A message sent successfully to channel:', channelId);
    res.status(200).json({ message: 'Message sent successfully' });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/read-messages/:channelId', async (req, res) => {
  const { channelId } = req.params;
  if (!channelId) {
    return res.status(400).json({ error: 'Channel ID is required' });
  }

  try {
    const messages = await fetchMessages(channelId);
    res.status(200).json({ messages });
  } catch (error) {
    console.error('Error reading messages:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
