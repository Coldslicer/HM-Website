// src/discordUtils.js
import { discordClient } from "./clients.js";

// Create a private channel for each campaign creator (individual chat)
async function createPrivateChannelForCampaign(guildId, campaignId, discordIgn, supabase) {
  const guild = await discordClient.guilds.fetch(guildId);
  const creator = await guild.members.fetch({ query: discordIgn, limit: 1 }).then((res) => res.first());

  if (!creator) {
    throw new Error(`Creator with Discord IGN ${discordIgn} not found`);
  }

  // Create a private channel for the campaign creator
  const channel = await guild.channels.create({
    name: `private-${discordIgn}-${campaignId}`,
    type: 0, // Text Channel
    permissionOverwrites: [
      {
        id: guild.roles.everyone.id,
        deny: ['ViewChannel'],
      },
      {
        id: creator.id,
        allow: ['ViewChannel', 'SendMessages'],
      },
    ],
  });

  // Create a webhook for the private channel
  const webhook = await channel.createWebhook({
    name: `Private Chat - ${discordIgn}`,
  });

  // Store the webhook URL in the `campaign_creators` table in Supabase
  await supabase
    .from('campaign_creators')
    .upsert([{ campaign_id: campaignId, discord_ign: discordIgn, webhook_url: webhook.url, channel_id: channel.id }]);

  return { channel, webhook };
}

// Create a group chat for the campaign
async function createGroupChatForCampaign(guildId, campaignId, userIds, supabase) {
  const guild = await discordClient.guilds.fetch(guildId);

  // Create a group chat channel for the campaign
  const channel = await guild.channels.create({
    name: `group-chat-${campaignId}`,
    type: 0, // Text Channel
    permissionOverwrites: [
      {
        id: guild.roles.everyone.id,
        deny: ['ViewChannel'],
      },
      ...userIds.map((id) => ({
        id,
        allow: ['ViewChannel', 'SendMessages'],
      })),
    ],
  });

  // Create a webhook for the group chat
  const webhook = await channel.createWebhook({ name: `Group Chat - ${campaignId}` });

  // Store the group chat details in the `campaigns` table in Supabase
  await supabase
    .from('campaigns')
    .upsert([{ campaign_id: campaignId, group_chat_channel_id: channel.id, webhook_url: webhook.url }]);

  return { channel, webhook };
}

module.exports = { createPrivateChannelForCampaign, createGroupChatForCampaign };
