
// Imports
import { SlashCommandBuilder, Client, GatewayIntentBits, Partials, PermissionFlagsBits } from 'discord.js';

import { config } from 'dotenv';
config();

// Discord client
console.log('[HM]: Connecting to Discord...');
const DISCORD_CLIENT = new Client({
  intents: [
    //GatewayIntentBits.DirectMessages
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.Reaction
  ],
});

const commands = [
  new SlashCommandBuilder()
    .setName('draft')
    .setDescription('Submit your current draft link')
    .addStringOption(option => 
      option.setName('link')
            .setDescription('The link to your unlisted video or online draft folder')
            .setRequired(true)
    ),
    new SlashCommandBuilder()
    .setName('live')
    .setDescription('Submit your LIVE video link after you\'re approved for posting')
    .addStringOption(option => 
      option.setName('link')
            .setDescription('The link to your live video on the platform you make content on')
            .setRequired(true)
    ),
    new SlashCommandBuilder()
    .setName('register')
    .setDescription('registers the channel this is used in to recieve sponsorship offers')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option => 
      option.setName('description')
            .setDescription('The name of the niche this channel is meant for. THIS IS SHOWN TO CLIENTS.')
            .setRequired(true)
    ),
    new SlashCommandBuilder()
    .setName('registrations')
    .setDescription('shows all Warm channel registrations on this server'),
    new SlashCommandBuilder()
    .setName('unregister')
    .setDescription('removes all Warm registrations for this channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
// Roles Management Commands
new SlashCommandBuilder()
.setName('showroles')
.setDescription('Shows all the configured roles in Warm'),


new SlashCommandBuilder()
.setName('addrole')
.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
.setDescription('Configures a role to conditionally recieve updates depending on the clients\' preferences')
.addStringOption(option =>
  option.setName('title')
    .setDescription('The title of the role to add')
    .setRequired(true)
)
.addStringOption(option =>
  option.setName('description')
    .setDescription('A brief description of the role to be shown to clients')
    .setRequired(true)
)
.addStringOption(option =>
  option.setName('value')
    .setDescription('Ping the role you want to add. Ex. @tech')
    .setRequired(true)
),

new SlashCommandBuilder()
.setName('removerole')
.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
.setDescription('Removes a role configuration from Warm')
.addStringOption(option =>
  option.setName('value')
    .setDescription('Ping the role you want to remove. Ex. @tech')
    .setRequired(true)
),
    new SlashCommandBuilder()
    .setName('id')
    .setDescription('Tells you your discord ID to enter into the campaign form'),

    new SlashCommandBuilder()
    .setName('getlink')
    .setDescription('Gives you the form link for the given campaign join code')
    .addStringOption(option =>
      option.setName('join_code')
      .setDescription('The 6 letter join code for the campaign')
      .setRequired(true)
    ),

    new SlashCommandBuilder()
    .setName('editrates')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDescription('Edit your flat and CPM rates')
    .addNumberOption(option => 
      option.setName('flat')
            .setDescription('The new flat rate')
    )
    .addNumberOption(option => 
      option.setName('cpm')
            .setDescription('The new CPM rate')
    )
    .addNumberOption(option => 
      option.setName('cap')
            .setDescription('The new CPM cap')
    ),

    new SlashCommandBuilder()
    .setName('help')
    .setDescription('Shows information about how to use Warm commands'),

    new SlashCommandBuilder()
      .setName('join')
      .setDescription('Join a campaign using a valid join code')
      .addStringOption(option =>
        option.setName('join_code')
          .setDescription('The join code you were provided')
          .setRequired(true)
      )
      .addStringOption(option =>
        option.setName('name')
          .setDescription('Your name')
          .setRequired(true)
      )
      .addStringOption(option =>
        option.setName('email')
          .setDescription('Your contact email')
          .setRequired(true)
      )
      .addStringOption(option =>
        option.setName('channel_name')
          .setDescription('The name of your channel')
          .setRequired(true)
      )
      .addStringOption(option =>
        option.setName('channel_url')
          .setDescription('A direct link to your channel')
          .setRequired(true)
      )
      .addStringOption(option =>
        option.setName('deliverables')
          .setDescription('Select your deliverable type')
          .setRequired(true)
          .addChoices(
            { name: 'Longform Integration (30s)', value: 'Longform Integration (30s)' },
            { name: 'Longform Integration (60s)', value: 'Longform Integration (60s)' },
            { name: 'Shortform Video', value: 'Shortform Video' },
            { name: 'Dedicated Longform', value: 'Dedicated Longform' }
          )
      )
      .addStringOption(option =>
        option.setName('personal_statement')
          .setDescription('Why should we select you?')
          .setRequired(true)
      )
      .addBooleanOption(option =>
        option.setName('agreement')
          .setDescription(
`I agree that Hotslicer Media takes a 15% cut and that I will follow through if selected`)
          .setRequired(true)
      )
      .addNumberOption(option =>
        option.setName('rate')
          .setDescription('Your flat rate (optional)')
          .setRequired(false)
      )
      .addNumberOption(option =>
        option.setName('rate_cpm')
          .setDescription('Your CPM rate (optional)')
          .setRequired(false)
      )
      .addNumberOption(option =>
        option.setName('cpm_cap')
          .setDescription('Your CPM cap (optional)')
          .setRequired(false)
      )
      .addStringOption(option =>
        option.setName('discord_id')
          .setDescription('The Discord user ID. Registering others is only available to Admins!')
          .setRequired(false)
      )

];

// Register the slash commands with Discord
export async function registerSlashCommands() {
  const commandsData = commands.map(command => command.toJSON());
  try {
    await DISCORD_CLIENT.application.commands.set(commandsData); // Registers commands globally
    console.log('Slash commands registered');
  } catch (error) {
    console.error('Error registering slash commands:', error);
  }
}

DISCORD_CLIENT.once('ready', async () => {
  console.log("registering slash commands...")
  await DISCORD_CLIENT.application.commands.fetch(); // Ensures the application is ready
  await registerSlashCommands();
  console.log("successful");
});

DISCORD_CLIENT.login(process.env.DISCORD_TOKEN);