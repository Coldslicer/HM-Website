import { DISCORD_CLIENT, SUPABASE_CLIENT } from '../util/clients.js'; 
import { ChannelType } from 'discord.js';

export async function fetchMessages(channelId) {
  try {
    const channel = await DISCORD_CLIENT.channels.fetch(channelId);
    if (!channel || channel.type !== ChannelType.GuildText) {
      throw new Error('Channel not found or is not a text channel');
    }

    const messages = await channel.messages.fetch({ limit: 50 });
    return messages
      .filter(message => !message.content.toLowerCase().startsWith("[hidden from clients]".toLowerCase()))
      .map(message => ({
        id: message.id,
        content: message.content,
        bot: message.author.bot,
        author: message.author.username,
        timestamp: message.createdTimestamp,
        profile_picture: message.author.displayAvatarURL({ dynamic: true, size: 64 }),
      }));

  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
}

export async function sendDM(message, id, type) {
  let channelId, webhookUrl;

  try {
    if (type === 'group') {
      const { data, error } = await SUPABASE_CLIENT
        .from("campaigns")
        .select("group_chat_channel_id, webhook_url")
        .eq('id', id)
        .single();
      if (error || !data) throw new Error("No campaign found for the given ID");

      channelId = data.group_chat_channel_id;
      webhookUrl = data.webhook_url;

    } else if (type === 'staff') {
      const { data, error } = await SUPABASE_CLIENT
        .from("campaigns")
        .select("staff_chat_channel_id, staff_chat_webhook_url")
        .eq('id', id)
        .single();
      if (error || !data) throw new Error("No staff chat found for the given ID");

      channelId = data.staff_chat_channel_id;
      webhookUrl = data.staff_chat_webhook_url;

    } else {
      const { data, error } = await SUPABASE_CLIENT
        .from("campaign_creators")
        .select("channel_id, webhook_url")
        .eq('id', id)
        .single();
      if (error || !data) throw new Error("No creator found for the given ID");

      channelId = data.channel_id;
      webhookUrl = data.webhook_url;
    }
  } catch (error) {
    console.error("Database error:", error);
    throw error;
  }

  if (webhookUrl) {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: message }),
    });
    if (!response.ok) {
      throw new Error(`Failed to send message: ${response.statusText}`);
    }
    return { via: 'webhook' };
  }

  const channel = await DISCORD_CLIENT.channels.fetch(channelId);
  if (!channel || channel.type !== ChannelType.GuildText) {
    throw new Error('Channel not found or is not a text channel');
  }
  await channel.send(message);
  return { via: 'channel' };
}

export async function sendMessage(channelId, message) {
  const channel = await DISCORD_CLIENT.channels.fetch(channelId);
  if (!channel || channel.type !== ChannelType.GuildText) {
    throw new Error('Channel not found or is not a text channel');
  }
  await channel.send(message);
}
