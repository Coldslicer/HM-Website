// clients.js
import { Client, GatewayIntentBits, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import { supabase } from './lib/supabase.js';


const discordClient = new Client({
  intents: [
    //GatewayIntentBits.DirectMessages
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
});

const STARTUP_CHANNEL_ID = process.env.STARTUP_CHANNEL_ID;

async function getCampaignCreatorEntryByChannel(channelId, userId) {
  // Check campaign_creators table for direct match on channel_id
  let { data: creatorData, error } = await supabase
      .from('campaign_creators')
      .select('*')
      .eq('channel_id', channelId)
      .single(); // Expect only one entry

  if (creatorData) {
      return creatorData; // Found a match based on channel_id
  }

  // If not found, check the campaigns table for group chat matching
  let { data: campaignData, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('group_chat_channel_id', channelId)
      .single(); // Expect only one entry

  if (campaignData) {
      // If campaign found, search for a matching creator based on discord_id and campaign_id
      let { data: groupCreatorData, error: groupCreatorError } = await supabase
          .from('campaign_creators')
          .select('*')
          .eq('campaign_id', campaignData.id)
          .eq('discord_id', userId)
          .single(); // Expect only one entry

      if (groupCreatorData) {
          return groupCreatorData; // Found matching creator in the campaign
      }
  }

  // If no entry found, return null to signal error
  return null;
}


// Listen for interactions
discordClient.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;
  if (interaction.commandName === 'draft' || interaction.commandName === 'final') {
    const userId = interaction.user.id;
    const channelId = interaction.channel.id;
    const draftLink = interaction.options.getString('link'); // Assuming the link is passed as a string argument
    
    const creatorEntry = await getCampaignCreatorEntryByChannel(channelId, userId);

    if (creatorEntry) {
        // Update the 'draft' column in the campaign_creators table

        // Dynamically update the column based on the command name ('draft' or 'final')
        const columnToUpdate = interaction.commandName; // 'draft' or 'final'

        let { data, error } = await supabase
            .from('campaign_creators')
            .update({ [columnToUpdate]: draftLink }) // Use dynamic column name
            .eq('id', creatorEntry.id);

        if (error) {
            await interaction.reply({
                content: 'Something went wrong while updating the draft. Please try again later.',
                ephemeral: true,
            });
            console.error('Supabase update error:', error);
            return;
        }

        await interaction.reply({
            content: 'Your link has been successfully submitted!',
            ephemeral: true, // Ensure only the user can see the reply
        });
    } else {
        await interaction.reply({
            content: 'Hmm, I couldn\'t find a matching entry to update. Perhaps you\'re running this command in the wrong channel? Make sure you\'re in a channel associated with the campaign this is for',
            ephemeral: true, // This makes it visible only to the user
        });
        console.log('No matching entry found for the channel and user.');
    }
  } else if (interaction.commandName === 'id') {
    await interaction.reply({
      content: 'Your Discord ID is: ' + interaction.user.id,
      ephemeral: true, // This makes it visible only to the user
    });
  }
});

discordClient.once('ready', async () => {


  console.log(`Discord bot logged in as ${discordClient.user.tag}`);

  try {
    const channel = await discordClient.channels.fetch(STARTUP_CHANNEL_ID);
    if (channel && channel.type === ChannelType.GuildText) {
      await channel.send('Bot has started up successfully!');
      console.log('Startup message sent to the channel');
    } else {
      console.error('Error sending startup message');
    }
  } catch (error) {
    console.error('There was an error starting up the bot');
  }
});

// Handler for reacting to messages in channels from the niches table
const reactToMessagesInChannels = async (message) => {
  try {
    // Step 1: Fetch the 'channel_id' from the 'niches' table
    const { data: niches, error } = await supabase
      .from('niches')
      .select('channel_id')
      .eq('channel_id', message.channel.id);  // Check if the message channel's ID exists in niches

    if (error) {
      console.error('Error fetching channel_id from Supabase:', error);
      return;
    }

    // If no associated niche entry is found, return early
    if (niches.length === 0) {
      console.log('This channel is not in the niches table, skipping reaction.');
      return;
    }

    // Step 2: React to the message with the :rocket: emoji
    await message.react('🚀');

    console.log(`Reacted with :rocket: in channel: ${message.channel.id}`);
  } catch (error) {
    console.error('Error processing message:', error);
  }
};



// Listen for new messages in Discord
discordClient.on('messageCreate', reactToMessagesInChannels);

discordClient.on('messageReactionAdd', async (reaction, user) => {
  console.log('Reaction added:', reaction.emoji.name);
  try {
    // Ensure it's not a bot reaction
    if (user.bot) {
      console.log('Bot reaction detected, skipping form send.');
      return;
    }

    // Get the message's channel ID
    const channelId = reaction.message.channel.id;

    // Fetch the list of channel IDs from the 'niches' table in Supabase
    const { data: niches, error } = await supabase
      .from('niches')
      .select('channel_id')
      .eq('channel_id', channelId);

    if (error) {
      console.error('Error fetching channels from Supabase:', error);
      return;
    }

    // If the channel is in the 'niches' table
    if (niches && niches.length > 0) {
      // Send the form to the user who reacted
      const formMessage = 
      ```
      Hey there ${user.username}, thank you for your interest! 
      Sadly custom links aren't available yet
      Here's your id for the form: ${user.id}
      
      You can also access this with my /id command, or with discord developer mode enabled```;

      
      // Send the form as a DM to the user who reacted
      const dmChannel = await user.createDM();
      await dmChannel.send(formMessage);
    } else {
      console.log('Channel not found in niches table, skipping send.');
    }
  } catch (error) {
    console.error('Error handling reaction:', error);
  }
});


discordClient.login(process.env.DISCORD_TOKEN); 


export { discordClient };
