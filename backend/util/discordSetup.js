import { SUPABASE_CLIENT } from './setup.js';
import { DISCORD_CLIENT } from './setup.js';
import { PermissionFlagsBits } from 'discord.js'
import { ChannelType } from 'discord.js';

/* ================ [ HELPERS ] ================ */

async function getCampaignCreatorEntryByChannel(channelId, userId) {
  // Check campaign_creators table for direct match on channel_id
  const { data: creatorData } = await SUPABASE_CLIENT
    .from('campaign_creators')
    .select('*')
    .eq('channel_id', channelId)
    .single();

  if (creatorData) return creatorData;

  // Check for group chat campaign match
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

    if (groupCreatorData) return groupCreatorData;
  }

  return null;
}

/* ================ [ DISCORD HANDLERS ] ================ */

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

const handleCommonChecks = (interaction) => {
  if (!interaction.guild) {
    interaction.reply({ content: "This command requires a server context.", ephemeral: true });
    return false;
  }
  return true;
};

const ON_USER_INTERACTION = async (interaction) => {
  if (!interaction.isCommand()) return;

  try {
    switch (interaction.commandName) {
      case 'help':
        return handleHelpCommand(interaction);
      case 'register':
        return handleRegisterCommand(interaction);
      case 'registrations':
        return handleRegistrationsCommand(interaction);
      case 'unregister':
        return handleUnregisterCommand(interaction);
      case 'showroles':
        return handleShowRolesCommand(interaction);
      case 'addrole':
        return handleAddRoleCommand(interaction);
      case 'removerole':
        return handleRemoveRoleCommand(interaction);
      case 'editrates':
        return handleEditRatesCommand(interaction);
      case 'draft':
      case 'final':
      case 'live':
        return handleContentSubmission(interaction);
      case 'id':
        return interaction.reply({ content: `Your Discord ID: ${interaction.user.id}`, ephemeral: true });
    }
  } catch (error) {
    console.error(`Error handling ${interaction.commandName}:`, error);
    interaction.reply({ content: "An error occurred processing your request.", ephemeral: true });
  }
};

/* ================ [ COMMAND HANDLERS ] ================ */

const handleHelpCommand = (interaction) => {
  const helpMessage = `**Welcome to Warm, by Hotslicer Media**...`; // Keep existing help message
  return interaction.reply({ content: helpMessage, ephemeral: true });
};

const handleRegisterCommand = async (interaction) => {
  if (!handleCommonChecks(interaction)) return;
  if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
    return interaction.reply({ content: "Administrator permissions required.", ephemeral: true });
  }

  const { error } = await SUPABASE_CLIENT
    .from('niches')
    .insert([{ 
      name: interaction.options.getString('description'), 
      channel_id: interaction.channel.id,
      server_id: interaction.guild.id 
    }]);

  if (error) {
    console.error('Registration error:', error);
    return interaction.reply({ content: "Registration failed. Please try later.", ephemeral: true });
  }

  return interaction.reply({ content: "Channel registered successfully!", ephemeral: true });
};

const handleRegistrationsCommand = async (interaction) => {
  if (!handleCommonChecks(interaction)) return;

  const { data } = await SUPABASE_CLIENT
    .from('niches')
    .select('name, channel_id')
    .eq('server_id', interaction.guild.id);

  if (!data?.length) {
    return interaction.reply({ content: "No registered channels found.", ephemeral: true });
  }

  const list = data.map((item, i) => `${i+1}. <#${item.channel_id}>: ${item.name}`).join("\n");
  return interaction.reply({ content: `**Registered Channels:**\n${list}`, ephemeral: true });
};

const handleUnregisterCommand = async (interaction) => {
  if (!handleCommonChecks(interaction)) return;
  if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
    return interaction.reply({ content: "Administrator permissions required.", ephemeral: true });
  }

  const { error } = await SUPABASE_CLIENT
    .from('niches')
    .delete()
    .match({ 
      channel_id: interaction.channel.id,
      server_id: interaction.guild.id 
    });

  if (error) {
    console.error('Unregister error:', error);
    return interaction.reply({ content: "Failed to unregister channel.", ephemeral: true });
  }

  return interaction.reply({ content: "Channel unregistered!", ephemeral: true });
};

const handleShowRolesCommand = async (interaction) => {
  if (!handleCommonChecks(interaction)) return;

  const { data } = await SUPABASE_CLIENT
    .from('roles')
    .select('title, description, value')
    .eq('server_id', interaction.guild.id);

  if (!data?.length) {
    return interaction.reply({ content: "No roles configured.", ephemeral: true });
  }

  const roleList = data.map(r => `- **${r.title} (${r.value})**: ${r.description}`).join('\n');
  return interaction.reply({ content: `**Configured Roles:**\n${roleList}`, ephemeral: true });
};

const handleAddRoleCommand = async (interaction) => {
  if (!handleCommonChecks(interaction)) return;
  if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
    return interaction.reply({ content: "Administrator permissions required.", ephemeral: true });
  }

  const { error } = await SUPABASE_CLIENT
    .from('roles')
    .insert([{
      title: interaction.options.getString('title'),
      description: interaction.options.getString('description'),
      value: interaction.options.getString('value'),
      server_id: interaction.guild.id
    }]);

  if (error) {
    console.error('Add role error:', error);
    return interaction.reply({ content: "Failed to add role.", ephemeral: true });
  }

  return interaction.reply({ content: "Role added successfully!", ephemeral: true });
};

const handleRemoveRoleCommand = async (interaction) => {
  if (!handleCommonChecks(interaction)) return;
  if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
    return interaction.reply({ content: "Administrator permissions required.", ephemeral: true });
  }

  const { error } = await SUPABASE_CLIENT
    .from('roles')
    .delete()
    .match({ 
      value: interaction.options.getString('value'),
      server_id: interaction.guild.id 
    });

  if (error) {
    console.error('Remove role error:', error);
    return interaction.reply({ content: "Failed to remove role.", ephemeral: true });
  }

  return interaction.reply({ content: "Role configuration removed!", ephemeral: true });
};

const handleEditRatesCommand = async (interaction) => {
  if (!handleCommonChecks(interaction)) return;

  const creatorEntry = await getCampaignCreatorEntryByChannel(
    interaction.channel.id,
    interaction.user.id
  );

  if (!creatorEntry) {
    return interaction.reply({
      content: "No associated campaign found. Ensure you're in the correct channel.",
      ephemeral: true
    });
  }

  const updateData = {};
  const flatRate = interaction.options.getNumber('flat');
  const cpmRate = interaction.options.getNumber('cpm');
  const cpmCap = interaction.options.getNumber('cap');

  const { data, error: selectError } = await SUPABASE_CLIENT
    .from('campaign_creators')
    .select("rate, rate_cpm, cpm_cap")
    .eq('id', creatorEntry.id);
  
  if (data.rate === 0 && flatRate || data.rate_cpm === 0 && cpmRate || data.cmp_cap === 0 && cpmCap) {
    return interaction.reply({
      content: "You can't add rates that would violate the allowed payment models. Contact support of you think this is a mistake.",
      ephemeral: true
    });
  }

  if (flatRate !== null) updateData.rate = flatRate;
  if (cpmRate !== null) updateData.rate_cpm = cpmRate;
  if (cpmCap !== null) updateData.cmp_cap = cmpCap;

  if (Object.keys(updateData).length === 0) {
    return interaction.reply({
      content: "Please provide at least one rate to update (flat or CPM).",
      ephemeral: true
    });
  }

  const { error } = await SUPABASE_CLIENT
    .from('campaign_creators')
    .update(updateData)
    .eq('id', creatorEntry.id);

  if (error) {
    console.error('Rate update error:', error);
    return interaction.reply({ content: "Failed to update rates.", ephemeral: true });
  }

  return interaction.reply({ 
    content: "Rates updated successfully!",
    ephemeral: true 
  });
};

const handleContentSubmission = async (interaction) => {
  if (!handleCommonChecks(interaction)) return;

  const creatorEntry = await getCampaignCreatorEntryByChannel(
    interaction.channel.id,
    interaction.user.id
  );

  if (!creatorEntry) {
    return interaction.reply({
      content: "No associated campaign found. Ensure you're in the correct channel.",
      ephemeral: true
    });
  }

  const columnMap = {
    draft: 'draft',
    final: 'final',
    live: 'live_url'
  };

  // Create update object with the link
  const updateData = { [columnMap[interaction.commandName]]: interaction.options.getString('link') };

  // Add draft_submitted_at timestamp if this is a draft submission
  if (interaction.commandName === 'draft') {
    updateData.draft_submitted_at = new Date().toISOString();
  }

  const { error } = await SUPABASE_CLIENT
    .from('campaign_creators')
    .update(updateData)
    .eq('id', creatorEntry.id);

  if (error) {
    console.error('Content submission error:', error);
    return interaction.reply({ content: "Submission failed. Please try again later.", ephemeral: true });
  }

  return interaction.reply({ content: "Link submitted successfully!", ephemeral: true });
};

/* ================ [ MESSAGE & REACTION HANDLERS ] ================ */

const ON_USER_MESSAGE = async (message) => {
  if (!message.author.bot) return;

  try {
    const { data } = await SUPABASE_CLIENT
      .from('niches')
      .select()
      .eq('channel_id', message.channel.id);

    if (data?.length) {
      await message.react('🚀');
      console.log(`Reacted to message in ${message.channel.id}`);
    }
  } catch (error) {
    console.error('Message reaction error:', error);
  }
};

const ON_USER_REACTION = async (reaction, user) => {
  if (user.bot) return;

  try {
    const { data } = await SUPABASE_CLIENT
      .from('niches')
      .select()
      .eq('channel_id', reaction.message.channel.id);

    if (data?.length) {
      const messageContent = reaction.message.content || (await reaction.message.fetch()).content;
      const urls = messageContent.match(/(https?:\/\/[^\s)]+)/g);
      const dmChannel = await user.createDM();
      
      await dmChannel.send(urls?.length ? 
        `[Custom link](${urls.pop()}&discordId=${user.id})` : 
        "Error generating custom link"
      );
    }
  } catch (error) {
    console.error('Reaction handling error:', error);
  }
};

const ON_USER_JOIN = async (member) => {
  console.log(`New member joined: ${member.user.tag}`);

  try {
    await member.send(`
Hey ${member.user.username}, welcome to **${member.guild.name}**, so excited to have you here.
This is **not** just a regular Discord server. It’s a **sponsorship hub**. 

Comments or concerns? DM our CEO personally right now: <@655866521117130752>
Otherwise, please check pings from the server, they are **ONLY** for sponsorship offers!

Hope you have a great time here!`);
  } catch (error) {
    console.error(`Could not DM the user: ${error}`);
  }
}

export { ON_READY, ON_USER_INTERACTION, ON_USER_MESSAGE, ON_USER_REACTION, ON_USER_JOIN };