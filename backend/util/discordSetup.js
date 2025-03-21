import { SUPABASE_CLIENT } from './setup.js';
import { DISCORD_CLIENT } from './setup.js';
import { PermissionFlagsBits } from 'discord.js'

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
const ON_READY = async () => {

  console.log(`[HM]: Discord bot logged in as ${DISCORD_CLIENT.user.tag}`);

  try {
    const channel = await DISCORD_CLIENT.channels.fetch(process.env.STARTUP_CHANNEL_ID);
    if (channel && channel.type === ChannelType.GuildText) {
      // await channel.send('Bot has started up successfully!');
      console.log('[HM]: Successfully started up discord bot!');
    } else {
      console.error('[HM]: Failed to send startup messsage!');
    }
  } catch (error) {
    console.error('[HM]: Failed to start up bot! ' + error);
  }

};

// On user interaction
const ON_USER_INTERACTION = async (interaction) => {

  if (!interaction.isCommand()) return;
  if (interaction.commandName === 'help') {
    const helpMessage = `
  **Welcome to Warm, by Hotslicer Media**
  
  **For Creators**
    **/draft** - Submit or update campaign drafts (YouTube or Google Drive links).  
    **/live** - Submit your live YouTube video link.  
    **/id** - Get your Discord user ID.
  ---
  
  **For Campaign Managers**
    **/register** - Register the current channel for sponsorships. (Admin only)  
    **/registrations** - View all channel registrations in the server.  
    **/unregister** - Remove the current channel’s registration. (Admin only)  

    **/showroles** - View all configured roles in the server.  
    **/addrole** - Add a new role configuration. (Admin only)  
    **/removerole** - Remove an existing role configuration. (Admin only)
  ---
  
  For questions or assistance, contact:
    Hotslicer (<@655866521117130752>) for media inquiries.
    Coldslicer (<@767458854249824328>) for feature requests.
  `;
  
    return interaction.reply({ content: helpMessage, ephemeral: true });
  }
  
  
  if (interaction.commandName === 'register') {
    if (!interaction.guild) {
      return interaction.reply({ content: "Sorry, this command can only be used in a server.", ephemeral: true });
    }
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        content: "You do not have the required permissions to use this command.",
        ephemeral: true
      });
    }
    

    const channel_id = interaction.channel.id;  // The user's Discord ID
    const server_id = interaction.guild.id;  // The Discord server ID

    // Insert data into Supabase
    const { data, error } = await SUPABASE_CLIENT
      .from('niches')
      .insert([{ name: interaction.options.getString('description'), channel_id, server_id }]);

    if (error) {
      console.error('Error inserting into Supabase:', error.message);
      return interaction.reply({ content: "Failed to register. Please try again later.", ephemeral: true });
    }

    return interaction.reply({ content: "Successfully registered!", ephemeral: true });
  }
  if (interaction.commandName === 'registrations') {
    if (!interaction.guild) {
      return interaction.reply({ content: "Sorry, this command can only be used in a server.", ephemeral: true });
    }
  
    const server_id = interaction.guild.id;  // The Discord server ID
  
    // Fetch all the registrations for the server from Supabase
    const { data, error } = await SUPABASE_CLIENT
      .from('niches')
      .select('name, channel_id')
      .eq('server_id', server_id);  // Querying by server ID
  
    if (error) {
      console.error('Error fetching registrations from Supabase:', error.message);
      return interaction.reply({ content: "Failed to fetch registrations. Please try again later.", ephemeral: true });
    }
  
    if (!data || data.length === 0) {
      return interaction.reply({ content: "No registrations found for this server.", ephemeral: true });
    }
  
    // Format the response to display all the registrations
    const registrationList = data.map((item, index) => {
      return `${index + 1}. <#${item.channel_id}>: ${item.name}`;
    }).join("\n");
  
    return interaction.reply({ content: `**Registered Channels:**\n${registrationList}`, ephemeral: true });
  }

  if (interaction.commandName === 'unregister') {
    if (!interaction.guild) {
      return interaction.reply({ content: "Sorry, this command can only be used in a server.", ephemeral: true });
    }
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        content: "You do not have the required permissions to use this command.",
        ephemeral: true
      });
    }
  
    const channel_id = interaction.channel.id;  // The channel ID of the current channel
    const server_id = interaction.guild.id;  // The Discord server ID
  
    // Delete the registration for the current channel from Supabase
    const { data, error } = await SUPABASE_CLIENT
      .from('niches')
      .delete()
      .eq('channel_id', channel_id)
      .eq('server_id', server_id);  // Ensure we only remove from the specific server
  
    if (error) {
      console.error('Error removing registration from Supabase:', error.message);
      return interaction.reply({ content: "Failed to unregister the channel. Please try again later.", ephemeral: true });
    }
  
    if (data && data.length === 0) {
      return interaction.reply({ content: "No registration found for this channel.", ephemeral: true });
    }
  
    return interaction.reply({ content: "Successfully unregistered the channel!", ephemeral: true });
  }
  
  
  // Handle /showroles command
  if (interaction.commandName === 'showroles') {
    if (!interaction.guild) {
      return interaction.reply({ content: "Sorry, this command can only be used in a server.", ephemeral: true });
    }

    const server_id = interaction.guild.id;

    // Fetch roles from Supabase
    const { data: roles, error } = await SUPABASE_CLIENT
      .from('roles')
      .select('id, title, description, value')
      .eq('server_id', server_id);

    if (error) {
      console.error('Error fetching roles:', error.message);
      return interaction.reply({ content: "Failed to retrieve role configurations. Please try again later.", ephemeral: true });
    }

    if (!roles || roles.length === 0) {
      return interaction.reply({ content: "There are no roles configured for this server.", ephemeral: true });
    }

    // Construct the response with role titles, descriptions, and values
    const roleList = roles.map(role => `- **${role.title} (${role.value})**: ${role.description}`).join('\n');

    return interaction.reply({ content: `Here are the roles configured for this server:\n${roleList}`, ephemeral: true });
  }

  // Handle /addrole command
  if (interaction.commandName === 'addrole') {
    if (!interaction.guild) {
      return interaction.reply({ content: "Sorry, this command can only be used in a server.", ephemeral: true });
    }
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        content: "You do not have the required permissions to use this command.",
        ephemeral: true
      });
    }

    const title = interaction.options.getString('title');
    const description = interaction.options.getString('description');
    const value = interaction.options.getString('value');
    const server_id = interaction.guild.id;

    // Add the new role to Supabase
    const { data, error } = await SUPABASE_CLIENT
      .from('roles')
      .insert([{ title, description, value, server_id }]);

    if (error) {
      console.error('Error adding role:', error.message);
      return interaction.reply({ content: "Failed to add the role. Please try again later.", ephemeral: true });
    }

    return interaction.reply({ content: `Role "${title}" (${value}) added successfully!`, ephemeral: true });
  }

  // Handle /removerole command
  if (interaction.commandName === 'removerole') {
    if (!interaction.guild) {
      return interaction.reply({ content: "Sorry, this command can only be used in a server.", ephemeral: true });
    }
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        content: "You do not have the required permissions to use this command.",
        ephemeral: true
      });
    }

    const value = interaction.options.getString('value');
    const server_id = interaction.guild.id;

    // Remove the role from Supabase by value
    const { data, error } = await SUPABASE_CLIENT
      .from('roles')
      .delete()
      .match({ value, server_id });

    if (error) {
      console.error('Error removing role:', error.message);
      return interaction.reply({ content: "Failed to remove the role. Please try again later.", ephemeral: true });
    }

    return interaction.reply({ content: `Role configurations for ${value} removed successfully!`, ephemeral: true });
  }
  if (interaction.commandName === 'draft' || interaction.commandName === 'final' || interaction.commandName === 'live') {
    if (!interaction.guild) {
      return interaction.reply({ content: "Sorry, this command can only be used in a server.", ephemeral: true });
    }
    const userId = interaction.user.id;
    const channelId = interaction.channel.id;
    const draftLink = interaction.options.getString('link'); // Assuming the link is passed as a string argument
    
    const creatorEntry = await getCampaignCreatorEntryByChannel(channelId, userId);

    if (creatorEntry) {
        // Update the 'draft' column in the campaign_creators table

        // Dynamically update the column based on the command name ('draft' or 'final')
        let columnToUpdate;
        switch (interaction.commandName) {
          case 'draft':
            columnToUpdate = 'draft';
            break;
          case 'final':
            columnToUpdate = 'final';
            break;
          case 'live':
            columnToUpdate = 'live_url';
            break;
        }

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
const ON_USER_MESSAGE = async ( message ) => {
  try {
    if (!message.bot) return;

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
const ON_USER_REACTION = async ( reaction, user ) => {

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

    console.log("fetched matching niches");

    // If the channel is in the 'niches' table
    if (niches && niches.length > 0) {
      // Send the form to the user who reacted
      // const formMessage = ```
      // Hey there ${user.username}, thank you for your interest! 
      // Sadly custom links aren't available yet
      // Here's your id for the form: ${user.id}
      
      // You can also access this with my /id command, or with discord developer mode enabled```;

      if (!reaction.message || !reaction.message.content) {
        try {
            reaction.message = await reaction.message.fetch(); // Fetch the reaction object
        } catch (error) {
            console.error("Failed to fetch reaction message:", error);
            return; // Exit to prevent errors
        }
      }

      console.log(reaction.message);
      console.log(reaction.message.content);
      
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
