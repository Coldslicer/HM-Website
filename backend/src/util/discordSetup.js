/* ================ [ HELPERS ] ================ */

// idk what this does
async function getCampaignCreatorEntryByChannel(channelId, userId) {
  // Check campaign_creators table for direct match on channel_id
  let { data: creatorData, error } = await SUPABASE_CLIENT
      .from('campaign_creators')
      .select('*')
      .eq('channel_id', channelId)
      .single(); // Expect only one entry

  if (creatorData) {
      return creatorData; // Found a match based on channel_id
  }

  // If not found, check the campaigns table for group chat matching
  let { data: campaignData, error: campaignError } = await SUPABASE_CLIENT
      .from('campaigns')
      .select('*')
      .eq('group_chat_channel_id', channelId)
      .single(); // Expect only one entry

  if (campaignData) {
      // If campaign found, search for a matching creator based on discord_id and campaign_id
      let { data: groupCreatorData, error: groupCreatorError } = await SUPABASE_CLIENT
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

/* ================ [ DISCORD ] ================ */

// Imports
import { ChannelType } from 'discord.js';

// On bot ready
const ON_READY = async ( DISCORD_CLIENT ) => {

  console.log(`[HM]: Discord bot logged in as ${DISCORD_CLIENT.user.tag}`);

  try {
    const channel = await DISCORD_CLIENT.channels.fetch(process.env.STARTUP_CHANNEL_ID);
    if (channel && channel.type === ChannelType.GuildText) {
      await channel.send('Bot has started up successfully!');
      console.log('[HM]: Successfully started up discord bot!');
    } else {
      console.error('[HM]: Failed to send startup messsage!');
    }
  } catch (error) {
    console.error('[HM]: Failed to start up bot! ' + error);
  }

};

// On user interaction
const ON_USER_INTERACTION = async ( SUPABASE_CLIENT, interaction) => {

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

        let { data, error } = await SUPABASE_CLIENT
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

};

// On user message
const ON_USER_MESSAGE = async ( SUPABASE_CLIENT, message ) => {
  try {
    // Step 1: Fetch the 'channel_id' from the 'niches' table
    const { data: niches, error } = await SUPABASE_CLIENT
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

// On user reaction
const ON_USER_REACTION = async ( SUPABASE_CLIENT, reaction, user ) => {

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
    const { data: niches, error } = await SUPABASE_CLIENT
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
      // const formMessage = ```
      // Hey there ${user.username}, thank you for your interest! 
      // Sadly custom links aren't available yet
      // Here's your id for the form: ${user.id}
      
      // You can also access this with my /id command, or with discord developer mode enabled```;

      
      // Send the form as a DM to the user who reacted
      const urlRegex = /(https?:\/\/[^\s)]+)/g; // Regex to match URLs
      const matches = reaction.message.content.match(urlRegex); // Find all links
      const message = matches ? `[Here's your custom link!](${matches[matches.length - 1]}&discordId=${user.id})` : 'I had trouble generating a custom link. Sorry!'; // Return last link or null if none

      const dmChannel = await user.createDM();
      console.log(message)
      await dmChannel.send(message);
    } else {
      console.log('Channel not found in niches table, skipping send.');
    }
  } catch (error) {
    console.error('Error handling reaction:', error);
  }

}

// Export functions
export { ON_READY, ON_USER_INTERACTION, ON_USER_MESSAGE, ON_USER_REACTION };
