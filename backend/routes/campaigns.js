/* ================ [ CAMPAIGNS ] ================ */

// Imports
import express from 'express';
import { SUPABASE_CLIENT } from '../util/setup.js';  // Import your Supabase client
import { DISCORD_CLIENT } from '../util/setup.js';  // Import your Discord client
import { PermissionsBitField, ChannelType } from 'discord.js';

const router = express.Router();

const SERVER_ID = process.env.SERVER_ID; // Use environment variable for the guild ID

router.get('/validate-discord-id/:discordId', async (req, res) => {
  const { discordId } = req.params;

  // Check if the ID is a valid Discord Snowflake (numeric ID)
  if (!/^\d{17,20}$/.test(discordId)) {
    return res.status(400).json({ valid: false, error: 'Invalid Discord ID format' });
  }

  try {
    // Try fetching the user from Discord
    const user = await DISCORD_CLIENT.users.fetch(discordId);
    return res.status(200).json({ valid: true, username: user.username, discriminator: user.discriminator });
  } catch (error) {
    console.error(`Failed to fetch Discord user ${discordId}:`, error);
    return res.status(404).json({ valid: false, error: 'User not found or bot lacks permissions' });
  }
});


router.post('/setup-discord', async (req, res) => {
  const { campaignId } = req.body;
  console.log('Received request with campaignId:', campaignId);

  if (!campaignId) {
    console.error('Campaign ID is missing in the request body');
    return res.status(400).json({ error: 'Campaign ID is required' });
  }

  try {
    console.log(`Fetching campaign data for campaign ID: ${campaignId}`);
    const { data: campaignData, error: campaignError } = await SUPABASE_CLIENT
      .from('campaigns')
      .select('*')  // Select all columns
      .eq('id', campaignId)
      .single();

    if (campaignError) {
      console.error('Error fetching campaign data:', campaignError);
      return res.status(500).json({ error: 'Error fetching campaign data' });
    }

    if (!campaignData) {
      console.error('Campaign not found');
      return res.status(404).json({ error: 'Campaign not found' });
    }

    console.log('Campaign data fetched:', campaignData);

    const { client_id, company_name, rep_name } = campaignData;

    if (!company_name) {
      console.error('Campaign name is missing');
      return res.status(500).json({ error: 'Campaign name is missing' });
    }

    // Fetch client data to get company_name
    const { data: clientData, error: clientError } = await SUPABASE_CLIENT
      .from('clients')
      .select('profile_picture')
      .eq('id', client_id)
      .single();

    if (clientError) {
      console.error('Error fetching client data:', clientError);
      return res.status(500).json({ error: 'Error fetching client data' });
    }

    const pfpLink = clientData.profile_picture;

    // Create group chat channel
    console.log('Creating group chat channel with name:', company_name);
    const guild = DISCORD_CLIENT.guilds.cache.get(SERVER_ID);
    if (!guild) {
      console.error('Guild not found');
      return res.status(500).json({ error: 'Guild not found' });
    }

    console.log('Fetching selected creators');
    const { data: creatorsData, error: creatorsError } = await SUPABASE_CLIENT
      .from('campaign_creators')
      .select('id, discord_id, channel_id, channel_name')
      .eq('campaign_id', campaignId)
      .eq('selected', true);

    if (creatorsError) {
      console.error('Failed to fetch creators:', creatorsError);
      return res.status(500).json({ error: 'Failed to fetch creators' });
    }

    if (!creatorsData || creatorsData.length === 0) {
      console.error('No selected creators found');
      return res.status(404).json({ error: 'No selected creators found' });
    }

    let groupChatChannel;
    let category_id
    try {

      // Create the category
      const category = await guild.channels.create({
        name: company_name,
        type: ChannelType.GuildCategory,
      });

      if (!category) {
        console.error('Failed to create category');
        return res.status(500).json({ error: 'Failed to create category' });
      }

      category_id = category.id;

      groupChatChannel = await guild.channels.create({
        name: company_name + ' - Group Chat',
        type: ChannelType.GuildText,  // Type for text channel
        reason: 'Group chat for campaign',
        parent: category_id,
        permissionOverwrites: [
          {
            id: guild.id, // This is the ID of the guild (server), which represents @everyone
            deny: [PermissionsBitField.Flags.ViewChannel], // Deny view channel permission for everyone
          },
            ...(await Promise.all(creatorsData.map(async creator => {
              const user = await DISCORD_CLIENT.users.fetch(creator.discord_id);
              return {
                id: user.id,
                allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
              };
            }))),
        ]
      });
    } catch (error) {
      console.error('Error creating group chat channel:', error);
      return res.status(500).json({ error: 'Error creating group chat channel' });
    }

    if (!groupChatChannel) {
      console.error('Failed to create group chat channel');
      return res.status(500).json({ error: 'Failed to create group chat channel' });
    }

    console.log('Group chat channel created:', groupChatChannel.id);

    const webhook_name = rep_name && company_name
  ? `${rep_name} | ${company_name}`
  : company_name || "WARM by Hotslicer Media"; // Fallback in case company_name is undefined

    const groupChatChannelWebhook = await groupChatChannel.createWebhook({
      name: webhook_name,
      avatar: pfpLink || 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WARM%20Transparent-7Qk6aLp8aveeijQInp4caIaejfpZqP.png',
      reason: 'Webhook for group chat notifications',
    });

    console.log('Storing group chat webhook in Supabase');
    const { error: updateCampaignError } = await SUPABASE_CLIENT
      .from('campaigns')
      .update({ group_chat_channel_id: groupChatChannel.id, webhook_url: groupChatChannelWebhook.url})
      .eq('id', campaignId);

    if (updateCampaignError) {
      console.error('Error updating campaign with group chat webhook:', updateCampaignError);
      return res.status(500).json({ error: 'Error updating campaign with group chat webhook' });
    }

    for (const creator of creatorsData) {
      console.log(`Creating private channel for creator: ${creator.discord_id}`);
      let creatorChannel;
      let creatorWebhook;
      try {
        // Fetch the user object based on their ID
        const user = await DISCORD_CLIENT.users.fetch(creator.discord_id);
        if (!user) {
          console.error(`User not found for ID ${creator.discord_id}`);
        }

        console.log(`User fetched: ${user.tag}`);
        creatorChannel = await guild.channels.create({
          name: company_name+'-'+creator.channel_name.replace(/[^a-zA-Z0-9]/g, ""),
          type: ChannelType.GuildText,  // Type for text channel
          reason: `Your private channel for the "${company_name}" campaign`,
          parent: category_id,
          permissionOverwrites: [
            {
              id: guild.id, // This is the ID of the guild (server), which represents @everyone
              deny: [PermissionsBitField.Flags.ViewChannel], // Deny view channel permission for everyone
            },
            {
              id: user.id, // Allow view and send messages permissions for the creator
              allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
            },
          ]
        });
        creatorWebhook = await creatorChannel.createWebhook({
          name: webhook_name,
          avatar: pfpLink || 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WARM%20Transparent-7Qk6aLp8aveeijQInp4caIaejfpZqP.png',
          reason: 'Webhook for creator notifications',
        });
      } catch (error) {
        console.error(`Error creating channel for creator ${creator.discord_id}:`, error);
        return res.status(500).json({ error: `Error creating channel for creator ${creator.discord_id}` });
      }

      if (!creatorChannel) {
        console.error(`Failed to create channel for creator ${creator.discord_id}`);
        return res.status(500).json({ error: `Failed to create channel for creator ${creator.discord_id}` });
      }

      console.log('Storing private channel in Supabase for the creator');
      const { error: updateCreatorError } = await SUPABASE_CLIENT
        .from('campaign_creators')
        .update({ channel_id: creatorChannel.id, webhook_url: creatorWebhook.url })
        .eq('id', creator.id);

      if (updateCreatorError) {
        console.error(`Error updating creator ${creator.discord_id} with channel and webhook URL:`, updateCreatorError);
        return res.status(500).json({ error: `Error updating creator ${creator.discord_id} with channel and webhook URL` });
      }
    }
    
    // Create staff-only channel
let staffChatChannel;
let staffChatWebhook;
try {
  staffChatChannel = await guild.channels.create({
    name: company_name + ' - Staff',
    type: ChannelType.GuildText,
    reason: 'Private staff channel for campaign',
    parent: category_id,
    permissionOverwrites: [
      {
        id: guild.id, // Deny access for @everyone
        deny: [PermissionsBitField.Flags.ViewChannel],
      },
    ],
  });

  staffChatWebhook = await staffChatChannel.createWebhook({
    name: `Staff | ${company_name}`,
    avatar: pfpLink || 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WARM%20Transparent-7Qk6aLp8aveeijQInp4caIaejfpZqP.png',
    reason: 'Webhook for staff chat notifications',
  });
} catch (error) {
  console.error('Error creating staff chat channel:', error);
  return res.status(500).json({ error: 'Error creating staff chat channel' });
}

if (!staffChatChannel) {
  console.error('Failed to create staff chat channel');
  return res.status(500).json({ error: 'Failed to create staff chat channel' });
}

console.log('Staff chat channel created:', staffChatChannel.id);

// Store staff channel info in Supabase
const { error: updateStaffChatError } = await SUPABASE_CLIENT
  .from('campaigns')
  .update({
    staff_chat_channel_id: staffChatChannel.id,
    staff_chat_webhook_url: staffChatWebhook.url
  })
  .eq('id', campaignId);

if (updateStaffChatError) {
  console.error('Error updating campaign with staff chat webhook:', updateStaffChatError);
  return res.status(500).json({ error: 'Error updating campaign with staff chat webhook' });
}


    console.log('Updating campaign status to contract_signed');
    const { error: updateStatusError } = await SUPABASE_CLIENT
      .from('campaigns')
      .update({ status: 'contract_signed' })
      .eq('id', campaignId);

    if (updateStatusError) {
      console.error('Error updating campaign status:', updateStatusError);
      return res.status(500).json({ error: 'Error updating campaign status' });
    }

    console.log('Creators finalized and Discord channels set up successfully');
    res.status(200).json({ message: 'Creators finalized and Discord channels set up' });
  } catch (error) {
    console.error('Error finalizing creators:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
