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
  const { message, id, type } = req.body;
  let channelId, webhookUrl;
  console.log(`Message: ${message}, ID: ${id}, Type: ${type}`);

  try {
    if (type === 'group') {
      // Fetch group chat details
      const { data, error } = await SUPABASE_CLIENT
        .from("campaigns")
        .select("group_chat_channel_id, webhook_url")
        .eq('id', id)
        .single();
      
      if (error || !data) {
        console.error("Error fetching group chat data:", error);
        return res.status(404).json({ error: 'No campaign found for the given ID' });
      }

      channelId = data.group_chat_channel_id;
      webhookUrl = data.webhook_url;

    } else if (type === 'staff') {
      // Fetch staff chat details
      const { data, error } = await SUPABASE_CLIENT
        .from("campaigns")
        .select("staff_chat_channel_id, staff_chat_webhook_url")
        .eq('id', id)
        .single();
      
      if (error || !data) {
        console.error("Error fetching staff chat data:", error);
        return res.status(404).json({ error: 'No staff chat found for the given ID' });
      }

      channelId = data.staff_chat_channel_id;
      webhookUrl = data.staff_chat_webhook_url;

    } else {
      // Fetch private DM details for a creator
      const { data, error } = await SUPABASE_CLIENT
        .from("campaign_creators")
        .select("channel_id, webhook_url")
        .eq('id', id)
        .single();
      
      if (error || !data) {
        console.error("Error fetching creator DM data:", error);
        return res.status(404).json({ error: 'No creator found for the given ID' });
      }

      channelId = data.channel_id;
      webhookUrl = data.webhook_url;
    }
  } catch (error) {
    console.error("Database error:", error);
    return res.status(500).json({ error: 'Error fetching database information' });
  }

  // Send message via webhook if available
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

      console.log('Message sent successfully via webhook!');
      return res.status(200).json({ message: 'Message sent successfully via webhook' });

    } catch (error) {
      console.error('Error sending webhook message:', error.message);
      return res.status(500).json({ error: error.message });
    }
  }

  // If no webhook, send directly to the Discord channel
  try {
    const channel = await DISCORD_CLIENT.channels.fetch(channelId);
    if (!channel || channel.type !== ChannelType.GuildText) {
      throw new Error('Channel not found or is not a text channel');
    }

    await channel.send(message);
    console.log('Message sent successfully to channel:', channelId);
    return res.status(200).json({ message: 'Message sent successfully' });

  } catch (error) {
    console.error('Error sending message:', error);
    return res.status(500).json({ error: error.message });
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
    const channel = await DISCORD_CLIENT.channels.fetch(channelId);
    if (!channel || channel.type !== ChannelType.GuildText) {
      throw new Error('Channel not found or is not a text channel');
    }

    const messages = await channel.messages.fetch({ limit: 50 });

    const filteredMessages = messages
      .filter((message) => !message.content.toLowerCase().startsWith("[hidden from clients]".toLowerCase()))
      .map((message) => ({
        id: message.id,
        content: message.content,
        bot: message.author.bot,
        author: message.author.username,
        profile_picture: message.author.displayAvatarURL({ dynamic: true, size: 64 }), // Include profile picture
        timestamp: message.createdTimestamp,
      }));

    res.status(200).json({ messages: filteredMessages });
  } catch (error) {
    console.error('Error reading messages:', error);
    res.status(500).json({ error: error.message });
  }
});


export default router;
