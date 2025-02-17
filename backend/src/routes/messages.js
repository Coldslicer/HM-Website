// routes/messages.ts
import express from 'express';
import { DISCORD_CLIENT } from '../util/setup.js';  // Import the Discord client
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
