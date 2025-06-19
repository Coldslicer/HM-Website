// src/controllers/campaigns.js

import { supabase, discord } from "../util/clients.js";
import { PermissionsBitField, ChannelType } from "discord.js";

/**
 * Validate if discordId corresponds to a Discord user.
 * @param {string} discordId
 * @returns {Promise<{ valid: boolean, username?: string, discriminator?: string, error?: string }>}
 */
export async function validateDiscordId(discordId) {
  if (!/^\d{17,20}$/.test(discordId)) {
    return { valid: false, error: "Invalid Discord ID format" };
  }
  try {
    const user = await discord.users.fetch(discordId);
    return {
      valid: true,
      username: user.username,
      discriminator: user.discriminator,
    };
  } catch (error) {
    return { valid: false, error: "User not found or bot lacks permissions" };
  }
}

/**
 * Remove Discord channels for unselected creators in a campaign, clear their channel info.
 * @param {string} campaignId
 */
export async function removeUnselectedDiscordChannels(campaignId) {
  if (!campaignId) throw new Error("Campaign ID is required");

  const { data: unselectedCreators, error: fetchError } = await supabase
    .from("campaign_creators")
    .select("id, discord_id, channel_id")
    .eq("campaign_id", campaignId)
    .eq("selected", false);

  if (fetchError) throw fetchError;

  if (!unselectedCreators || unselectedCreators.length === 0) {
    return { message: "No unselected creators to remove channels for" };
  }

  for (const creator of unselectedCreators) {
    if (creator.channel_id) {
      try {
        const channel = await discord.channels.fetch(creator.channel_id);
        if (channel)
          await channel.delete("Removing unselected creator channel");
      } catch {
        // ignore if channel doesn't exist or delete failed
      }
      await supabase
        .from("campaign_creators")
        .update({ channel_id: null, webhook_url: "" })
        .eq("id", creator.id);
    }
  }

  return { message: "Unselected creators’ Discord channels removed" };
}

/**
 * Initialize category and staff channel for a campaign.
 * @param {string} campaignId
 */
export async function initCategory(campaignId) {
  if (!campaignId) throw new Error("Campaign ID is required");

  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .select("id, client_id, company_name, server_id, rep_name")
    .eq("id", campaignId)
    .single();
  if (campaignError || !campaign) throw new Error("Campaign not found");

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("profile_picture")
    .eq("id", campaign.client_id)
    .single();
  if (clientError || !client) throw new Error("Client not found");

  const guild = discord.guilds.cache.get(campaign.server_id);
  if (!guild) throw new Error("Discord server not found");

  const category = await guild.channels.create({
    name: campaign.company_name,
    type: ChannelType.GuildCategory,
  });

  const staffChannel = await guild.channels.create({
    name: `${campaign.company_name} - Staff`,
    type: ChannelType.GuildText,
    parent: category.id,
    permissionOverwrites: [
      { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
      {
        id: discord.user.id,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages,
        ],
      },
    ],
  });

  const staffWebhook = await staffChannel.createWebhook({
    name: `${campaign.rep_name || ""} | ${campaign.company_name}`,
    avatar:
      client.profile_picture ||
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WARM%20Transparent-7Qk6aLp8aveeijQInp4caIaejfpZqP.png",
  });

  await supabase
    .from("campaigns")
    .update({
      category_id: category.id,
      staff_chat_channel_id: staffChannel.id,
      staff_chat_webhook_url: staffWebhook.url,
    })
    .eq("id", campaignId);

  return { message: "Category and staff channel created successfully" };
}

/**
 * Purge category and all related channels, clear campaign and creators channel info.
 * @param {string} campaignId
 */
export async function purgeCategory(campaignId) {
  if (!campaignId) throw new Error("Campaign ID is required");

  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .select("id, server_id, category_id, company_name")
    .eq("id", campaignId)
    .single();
  if (campaignError || !campaign) throw new Error("Campaign not found");

  const guild = discord.guilds.cache.get(campaign.server_id);
  if (!guild) throw new Error("Discord server not found");

  const category = await guild.channels
    .fetch(campaign.category_id)
    .catch(() => null);
  if (!category || category.type !== ChannelType.GuildCategory) {
    throw new Error("Invalid or missing category");
  }

  for (const [, childChannel] of category.children.cache) {
    try {
      await childChannel.delete();
    } catch {
      // ignore failure
    }
  }

  await category.delete();

  await supabase
    .from("campaigns")
    .update({
      category_id: null,
      staff_chat_channel_id: null,
      staff_chat_webhook_url: null,
      group_chat_channel_id: null,
      webhook_url: null,
    })
    .eq("id", campaignId);

  await supabase
    .from("campaign_creators")
    .update({
      channel_id: null,
      webhook_url: null,
    })
    .eq("campaign_id", campaignId);

  return { message: "Category and related channels purged successfully" };
}

/**
 * Add a creator to Discord by creating a channel, webhook, and adding to group chat.
 * @param {string} creatorId
 */
export async function addCreatorToDiscord(creatorId) {
  if (!creatorId) throw new Error("Creator ID is required");

  const { data: creator, error: creatorError } = await supabase
    .from("campaign_creators")
    .select("id, discord_id, channel_name, campaign_id")
    .eq("id", creatorId)
    .single();
  if (creatorError || !creator) throw new Error("Creator not found");

  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .select(
      "id, company_name, rep_name, category_id, server_id, client_id, group_chat_channel_id",
    )
    .eq("id", creator.campaign_id)
    .single();
  if (campaignError || !campaign) throw new Error("Campaign not found");

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("profile_picture")
    .eq("id", campaign.client_id)
    .single();
  if (clientError || !client) throw new Error("Client not found");

  const guild = discord.guilds.cache.get(campaign.server_id);
  if (!guild) throw new Error("Guild not found");

  const user = await discord.users.fetch(creator.discord_id);
  if (!user) throw new Error("Discord user not found");

  const rawName = `${campaign.company_name}--${creator.channel_name}`;
  const sanitizedChannelName = rawName
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const channel = await guild.channels.create({
    name: sanitizedChannelName,
    type: ChannelType.GuildText,
    parent: campaign.category_id,
    permissionOverwrites: [
      { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
      {
        id: user.id,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages,
        ],
      },
      {
        id: discord.user.id,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages,
        ],
      },
    ],
  });

  const webhook = await channel.createWebhook({
    name: `${campaign.rep_name || ""} | ${campaign.company_name}`,
    avatar:
      client.profile_picture ||
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WARM%20Transparent-7Qk6aLp8aveeijQInp4caIaejfpZqP.png",
  });

  if (campaign.group_chat_channel_id) {
    const groupChannel = await guild.channels
      .fetch(campaign.group_chat_channel_id)
      .catch(() => null);
    if (groupChannel?.isTextBased()) {
      await groupChannel.permissionOverwrites.edit(user.id, {
        ViewChannel: true,
        SendMessages: true,
      });
    }
  }

  await supabase
    .from("campaign_creators")
    .update({
      channel_id: channel.id,
      webhook_url: webhook.url,
    })
    .eq("id", creatorId);

  return { message: "Creator channel, webhook, and group access set up" };
}

/**
 * Remove a creator from Discord by deleting their channel and removing from group chat.
 * @param {string} creatorId
 */
export async function removeCreatorFromDiscord(creatorId) {
  if (!creatorId) throw new Error("Creator ID is required");

  const { data: creator, error: creatorError } = await supabase
    .from("campaign_creators")
    .select("id, discord_id, channel_name, campaign_id, channel_id")
    .eq("id", creatorId)
    .single();
  if (creatorError || !creator) throw new Error("Creator not found");

  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .select(
      "id, company_name, rep_name, category_id, server_id, client_id, group_chat_channel_id",
    )
    .eq("id", creator.campaign_id)
    .single();
  if (campaignError || !campaign) throw new Error("Campaign not found");

  const guild = discord.guilds.cache.get(campaign.server_id);
  if (!guild) throw new Error("Guild not found");

  if (creator.channel_id) {
    try {
      const channel = await guild.channels.fetch(creator.channel_id);
      if (channel) await channel.delete("Removing creator channel");
    } catch {
      // ignore errors
    }
  }

  if (campaign.group_chat_channel_id) {
    const groupChannel = await guild.channels
      .fetch(campaign.group_chat_channel_id)
      .catch(() => null);
    if (groupChannel?.isTextBased()) {
      await groupChannel.permissionOverwrites
        .delete(creator.discord_id)
        .catch(() => null);
    }
  }

  await supabase
    .from("campaign_creators")
    .update({
      channel_id: null,
      webhook_url: null,
    })
    .eq("id", creatorId);

  return { message: "Creator channel deleted and removed from group chat" };
}

/**
 * Create a group chat text channel for selected creators.
 * @param {string} campaignId
 */
export async function createGroupChat(campaignId) {
  if (!campaignId) throw new Error("Campaign ID is required");

  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .select("id, company_name, rep_name, server_id, category_id, client_id")
    .eq("id", campaignId)
    .single();
  if (campaignError || !campaign) throw new Error("Campaign not found");

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("profile_picture")
    .eq("id", campaign.client_id)
    .single();
  if (clientError || !client) throw new Error("Client not found");

  const { data: creators, error: creatorsError } = await supabase
    .from("campaign_creators")
    .select("discord_id")
    .eq("campaign_id", campaignId)
    .eq("selected", true);
  if (creatorsError || !creators.length)
    throw new Error("No selected creators found");

  const guild = discord.guilds.cache.get(campaign.server_id);
  if (!guild) throw new Error("Guild not found");

  // Fetch user IDs (Discord users) for permission overwrites
  const permissionOverwrites = [];
  for (const c of creators) {
    try {
      const user = await discord.users.fetch(c.discord_id);
      permissionOverwrites.push({
        id: user.id,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages,
        ],
      });
    } catch {
      // skip users that can't be fetched
    }
  }

  permissionOverwrites.unshift({
    id: guild.id,
    deny: [PermissionsBitField.Flags.ViewChannel],
  });
  permissionOverwrites.push({
    id: discord.user.id,
    allow: [
      PermissionsBitField.Flags.ViewChannel,
      PermissionsBitField.Flags.SendMessages,
    ],
  });

  const channel = await guild.channels.create({
    name: `${campaign.company_name} - Group Chat`,
    type: ChannelType.GuildText,
    parent: campaign.category_id,
    permissionOverwrites,
  });

  const webhook = await channel.createWebhook({
    name: `${campaign.rep_name || ""} | ${campaign.company_name}`,
    avatar:
      client.profile_picture ||
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WARM%20Transparent-7Qk6aLp8aveeijQInp4caIaejfpZqP.png",
  });

  await supabase
    .from("campaigns")
    .update({
      group_chat_channel_id: channel.id,
      webhook_url: webhook.url,
    })
    .eq("id", campaignId);

  return { message: "Group chat created successfully" };
}
