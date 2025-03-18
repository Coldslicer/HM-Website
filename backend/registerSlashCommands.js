<<<<<<< HEAD

=======
import { DISCORD_CLIENT } from "./util/setup.js";
>>>>>>> 1e97fa03e7c39ea327fa27a9df3cea279bf516f4
import { SlashCommandBuilder } from '@discordjs/builders';

// Imports
import { Client, GatewayIntentBits, Partials } from 'discord.js';

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
    .setName('final')
    .setDescription('Submit your final draft link')
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
    .setName('live')
    .setDescription('Submit your live YouTube URL')
    .addStringOption(option => 
      option.setName('link')
            .setDescription('The YouTube URL for your live video')
            .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName('id')
    .setDescription('Tells you your discord ID to enter into the campaign form')
];

// Register the slash commands with Discord
export async function registerSlashCommands() {
  const commandsData = commands.map(command => command.toJSON());
  try {
<<<<<<< HEAD
    await DISCORD_CLIENT.application.commands.set(commandsData); // Registers commands globally
=======
    await DISCORD_CLIENT.application.commands.set(commandsData);
>>>>>>> 1e97fa03e7c39ea327fa27a9df3cea279bf516f4
    console.log('Slash commands registered');
  } catch (error) {
    console.error('Error registering slash commands:', error);
  }
}

DISCORD_CLIENT.once('ready', async () => {
<<<<<<< HEAD
  console.log("registering slash commands...")
=======
>>>>>>> 1e97fa03e7c39ea327fa27a9df3cea279bf516f4
  await registerSlashCommands();
  console.log("successful");
});

DISCORD_CLIENT.login(process.env.DISCORD_TOKEN);