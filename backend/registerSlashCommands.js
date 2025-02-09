
import { discordClient } from "./src/clients.js";
import { SlashCommandBuilder } from '@discordjs/builders';

const commands = [
  new SlashCommandBuilder()
    .setName('draft')
    .setDescription('Submit your current draft link')
    .addStringOption(option => 
      option.setName('link')
            .setDescription('The link to your video or folder')
            .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName('final')
    .setDescription('Submit your final draft link')
    .addStringOption(option => 
      option.setName('link')
            .setDescription('The link to your video or folder')
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
    await discordClient.application.commands.set(commandsData); // Registers commands globally
    console.log('Slash commands registered');
  } catch (error) {
    console.error('Error registering slash commands:', error);
  }
}

discordClient.once('ready', async () => {
  await registerSlashCommands();
});