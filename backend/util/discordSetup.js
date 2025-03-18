import { SUPABASE_CLIENT } from './setup.js';
import { DISCORD_CLIENT } from './setup.js';
import { ChannelType, MessageFlags } from 'discord.js';

async function getCampaignCreatorEntryByChannel(channelId, userId) {
  const { data: creatorData } = await SUPABASE_CLIENT
    .from('campaign_creators')
    .select('*')
    .eq('channel_id', channelId)
    .single();

  if (creatorData) return creatorData;

  const { data: campaignData } = await SUPABASE_CLIENT
    .from('campaigns')
    .select('*')
    .eq('group_chat_channel_id', channelId)
    .single();

  if (campaignData) {
    const { data: groupCreatorData } = await SUPABASE_CLIENT
      .from('campaign_creators')
      .select('*')
      .eq('campaign_id', campaignData.id)
      .eq('discord_id', userId)
      .single();
      
    return groupCreatorData || null;
  }

  return null;
}

function isValidYouTubeUrl(url) {
  return /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)/.test(url);
}

const ON_READY = async () => {
  console.log(`[HM]: Discord bot logged in as ${DISCORD_CLIENT.user.tag}`);
  try {
    const channel = await DISCORD_CLIENT.channels.fetch(process.env.STARTUP_CHANNEL_ID);
    if (channel?.type === ChannelType.GuildText) {
      console.log('[HM]: Successfully started up discord bot!');
    }
  } catch (error) {
    console.error('[HM]: Startup error:', error);
  }
};

const ON_USER_INTERACTION = async (interaction) => {
  if (!interaction.isCommand()) return;

  try {
    if (['draft', 'final', 'live'].includes(interaction.commandName)) {
      const userId = interaction.user.id;
      const channelId = interaction.channel.id;
      const link = interaction.options.getString('link');

      if (interaction.commandName === 'live' && !isValidYouTubeUrl(link)) {
        return await interaction.reply({
          content: 'Please provide a valid YouTube URL (e.g., https://www.youtube.com/watch?v=... or https://youtu.be/...)',
          flags: MessageFlags.Ephemeral,
        });
      }

      const creatorEntry = await getCampaignCreatorEntryByChannel(channelId, userId);
      
      if (!creatorEntry) {
        return await interaction.reply({
          content: 'No matching campaign found. Ensure you\'re in the correct channel.',
          flags: MessageFlags.Ephemeral,
        });
      }

      let updateData = {};
      if (interaction.commandName === 'live') {
        updateData = {
          live_url: link,
          live_submitted: new Date().toISOString()
        };
      } else {
        updateData = { [interaction.commandName]: link };
      }

      const { error } = await SUPABASE_CLIENT
        .from('campaign_creators')
        .update(updateData)
        .eq('id', creatorEntry.id);

      if (error) {
        console.error('Supabase error:', error);
        return await interaction.reply({
          content: 'Error updating link. Please try again.',
          flags: MessageFlags.Ephemeral,
        });
      }

      return await interaction.reply({ 
        content: 'Link successfully submitted!', 
        flags: MessageFlags.Ephemeral 
      });
    } 
    
    if (interaction.commandName === 'id') {
      return await interaction.reply({
        content: `Your Discord ID: ${interaction.user.id}`,
        flags: MessageFlags.Ephemeral,
      });
    }
  } catch (error) {
    console.error('Interaction error:', error);
    if (!interaction.replied) {
      await interaction.reply({
        content: 'An error occurred while processing your request.',
        flags: MessageFlags.Ephemeral,
      });
    }
  }
};

const ON_USER_MESSAGE = async (message) => {
  if (!message.author.bot) return;

  try {
    const { data: niches } = await SUPABASE_CLIENT
      .from('niches')
      .select('channel_id')
      .eq('channel_id', message.channel.id);

    if (niches?.length > 0) {
      await message.react('🚀');
      console.log(`Reacted in channel: ${message.channel.id}`);
    }
  } catch (error) {
    console.error('Message processing error:', error);
  }
};

const ON_USER_REACTION = async (reaction, user) => {
  if (user.bot) return;

  try {
    const { data: niches } = await SUPABASE_CLIENT
      .from('niches')
      .select('channel_id')
      .eq('channel_id', reaction.message.channel.id);

    if (niches?.length > 0) {
      const urlRegex = /(https?:\/\/[^\s)]+)/g;
      const matches = reaction.message.content.match(urlRegex);
      const message = matches?.[matches.length - 1];
      
      if (message) {
        const dmChannel = await user.createDM();
        await dmChannel.send(`${message}&discordId=${user.id}`);
      }
    }
  } catch (error) {
    console.error('Reaction handling error:', error);
  }
};

export { ON_READY, ON_USER_INTERACTION, ON_USER_MESSAGE, ON_USER_REACTION };