/* ================ [ CAMPAIGNS ] ================ */

// Imports
import express from 'express';
import { SUPABASE_CLIENT } from '../util/setup.js';  // Import your Supabase client
import { DISCORD_CLIENT } from '../util/setup.js';  // Import your Discord client
import { PermissionsBitField, ChannelType } from 'discord.js';

const router = express.Router();

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

router.post('/remove-unselected-discord-channels', async (req, res) => {
  const { campaignId } = req.body;

  console.log('Received request to remove unselected creators’ channels for campaignId:', campaignId);

  if (!campaignId) {
    console.error('Campaign ID is missing in the request body');
    return res.status(400).json({ error: 'Campaign ID is required' });
  }

  try {
    // Fetch all unselected creators with channel info
    const { data: unselectedCreators, error: fetchError } = await SUPABASE_CLIENT
      .from('campaign_creators')
      .select('id, discord_id, channel_id')
      .eq('campaign_id', campaignId)
      .eq('selected', false);

    if (fetchError) {
      console.error('Error fetching unselected creators:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch unselected creators' });
    }

    if (!unselectedCreators || unselectedCreators.length === 0) {
      console.log('No unselected creators found, nothing to delete');
      return res.status(200).json({ message: 'No unselected creators to remove channels for' });
    }

    // Delete Discord channels for each unselected creator
    for (const creator of unselectedCreators) {
      if (creator.channel_id) {
        try {
          const channel = await DISCORD_CLIENT.channels.fetch(creator.channel_id);
          if (channel) {
            await channel.delete('Removing unselected creator channel');
            console.log(`Deleted channel ${creator.channel_id} for creator ${creator.discord_id}`);
          }
        } catch (err) {
          console.warn(`Channel ${creator.channel_id} could not be deleted or was already deleted`);
        }

        // Clear channel_id and webhook_url in Supabase for this creator
        const { error: updateError } = await SUPABASE_CLIENT
          .from('campaign_creators')
          .update({ channel_id: null, webhook_url: "" })
          .eq('id', creator.id);

        if (updateError) {
          console.error(`Failed to clear channel info for creator ${creator.id}`, updateError);
        }
      }
    }

    res.status(200).json({ message: 'Unselected creators’ Discord channels removed' });

  } catch (error) {
    console.error('Unexpected error removing unselected Discord channels:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/init-category', async (req, res) => {
  const { campaignId } = req.body;

  if (!campaignId) {
    return res.status(400).json({ error: 'Campaign ID is required' });
  }

  try {
    const { data: campaign, error: campaignError } = await SUPABASE_CLIENT
      .from('campaigns')
      .select('id, client_id, company_name, server_id, rep_name')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      return res.status(500).json({ error: 'Campaign not found' });
    }

    const { data: client, error: clientError } = await SUPABASE_CLIENT
      .from('clients')
      .select('profile_picture')
      .eq('id', campaign.client_id)
      .single();

    if (clientError || !client) {
      return res.status(500).json({ error: 'Client not found' });
    }

    const guild = DISCORD_CLIENT.guilds.cache.get(campaign.server_id);
    if (!guild) {
      return res.status(500).json({ error: 'Discord server not found' });
    }

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
        { id: DISCORD_CLIENT.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
      ],
    });

    const staffWebhook = await staffChannel.createWebhook({
      name: `${campaign.rep_name || ''} | ${campaign.company_name}`,
      avatar: client.profile_picture || 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WARM%20Transparent-7Qk6aLp8aveeijQInp4caIaejfpZqP.png',
    });

    await SUPABASE_CLIENT.from('campaigns').update({
      category_id: category.id,
      staff_chat_channel_id: staffChannel.id,
      staff_chat_webhook_url: staffWebhook.url,
    }).eq('id', campaignId);

    res.status(200).json({ message: 'Category and staff channel created successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/add-creator-to-discord', async (req, res) => {
  const { creatorId } = req.body;
  if (!creatorId) return res.status(400).json({ error: 'Creator ID is required' });

  try {
    const { data: creator, error: creatorError } = await SUPABASE_CLIENT
      .from('campaign_creators')
      .select('id, discord_id, channel_name, campaign_id')
      .eq('id', creatorId)
      .single();

    if (creatorError || !creator) {
      console.error(creatorError);
      return res.status(500).json({ error: 'Creator not found' });
    }

    const { data: campaign, error: campaignError } = await SUPABASE_CLIENT
      .from('campaigns')
      .select('id, company_name, rep_name, category_id, server_id, client_id')
      .eq('id', creator.campaign_id)
      .single();

    if (campaignError || !campaign) {
      console.error(campaignError);
      return res.status(500).json({ error: 'Campaign not found' });
    }

    const { data: client, error: clientError } = await SUPABASE_CLIENT
      .from('clients')
      .select('profile_picture')
      .eq('id', campaign.client_id)
      .single();

    if (clientError || !client) return res.status(500).json({ error: 'Client not found' });

    const guild = DISCORD_CLIENT.guilds.cache.get(campaign.server_id);
    if (!guild) return res.status(500).json({ error: 'Guild not found' });

    const user = await DISCORD_CLIENT.users.fetch(creator.discord_id);
    if (!user) return res.status(500).json({ error: 'Discord user not found' });

    const rawName = `${campaign.company_name}--${creator.channel_name}`;
    const sanitizedChannelName = rawName
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')   // retain intentional double dashes
      .replace(/^-+|-+$/g, '');

    const channel = await guild.channels.create({
      name: sanitizedChannelName,
      type: ChannelType.GuildText,
      parent: campaign.category_id,
      permissionOverwrites: [
        { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
        { id: user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
        { id: DISCORD_CLIENT.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
      ],
    });

    const webhook = await channel.createWebhook({
      name: `${campaign.rep_name || ''} | ${campaign.company_name}`,
      avatar: client.profile_picture || 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WARM%20Transparent-7Qk6aLp8aveeijQInp4caIaejfpZqP.png',
    });

    await SUPABASE_CLIENT.from('campaign_creators').update({
      channel_id: channel.id,
      webhook_url: webhook.url,
    }).eq('id', creatorId);

    res.status(200).json({ message: 'Creator channel and webhook created' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/create-group-chat', async (req, res) => {
  const { campaignId } = req.body;
  if (!campaignId) return res.status(400).json({ error: 'Campaign ID is required' });

  try {
    const { data: campaign, error: campaignError } = await SUPABASE_CLIENT
      .from('campaigns')
      .select('id, company_name, rep_name, server_id, category_id, client_id')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) return res.status(500).json({ error: 'Campaign not found' });

    const { data: client, error: clientError } = await SUPABASE_CLIENT
      .from('clients')
      .select('profile_picture')
      .eq('id', campaign.client_id)
      .single();

    const { data: creators, error: creatorsError } = await SUPABASE_CLIENT
      .from('campaign_creators')
      .select('discord_id')
      .eq('campaign_id', campaignId)
      .eq('selected', true);

    if (creatorsError || !creators.length) return res.status(500).json({ error: 'No selected creators found' });

    const guild = DISCORD_CLIENT.guilds.cache.get(campaign.server_id);
    if (!guild) return res.status(500).json({ error: 'Guild not found' });

    const channel = await guild.channels.create({
      name: `${campaign.company_name} - Group Chat`,
      type: ChannelType.GuildText,
      parent: campaign.category_id,
      permissionOverwrites: [
        { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
        ...(await Promise.all(creators.map(async c => ({
          id: (await DISCORD_CLIENT.users.fetch(c.discord_id)).id,
          allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
        })))),
        { id: DISCORD_CLIENT.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
      ],
    });

    const webhook = await channel.createWebhook({
      name: `${campaign.rep_name || ''} | ${campaign.company_name}`,
      avatar: client.profile_picture || 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WARM%20Transparent-7Qk6aLp8aveeijQInp4caIaejfpZqP.png',
    });

    await SUPABASE_CLIENT.from('campaigns').update({
      group_chat_channel_id: channel.id,
      webhook_url: webhook.url,
    }).eq('id', campaignId);

    res.status(200).json({ message: 'Group chat created successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// THIS IS OLD CODE, DO NOT USE
router.post('/setup-discord', async (req, res) => {
  console.warn("/setup-discord is deprecated and should not be used. Replace with /init-category")
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
    const guild = DISCORD_CLIENT.guilds.cache.get(campaignData.server_id);
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
          {
            id: DISCORD_CLIENT.user.id, // Allow the bot to view and send messages in the channel
            allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
          },
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
            {
              id: DISCORD_CLIENT.user.id, // Allow the bot to view and send messages in the channel
              allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
            }
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
      {
        id: DISCORD_CLIENT.user.id, // Allow the bot to view and send messages in the channel
        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
      }
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
