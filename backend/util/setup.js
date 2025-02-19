/* ================ [ DOTENV ] ================ */

import { config } from 'dotenv';

// Check & load environment variables
if (!process.env.APP_PORT) {
  console.log('[HM]: Loading environment variables...');
  console.log(config());
}

/* ================ [ SUPABASE ] ================ */

import { createClient } from '@supabase/supabase-js';

// Supabase client
console.log('[HM]: Connecting to Supabase...');
const SUPABASE_CLIENT = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Log current login
const logLogin = async () => {

  const { error } = await SUPABASE_CLIENT
      .from('backend_logins')
      .insert([
        {} // Empty row since uuid and time autofill
      ]);

  if (error) console.error('[HM]: Unable to connect to Supabase! ', error);
  else console.log('[HM]: Successfully connected to Supabase!');

};

// Driver code
logLogin();

// Export client
export { SUPABASE_CLIENT };

/* ================ [ DISCORD ] ================ */

// Imports
import { Client, GatewayIntentBits } from 'discord.js';
import { ON_READY, ON_USER_INTERACTION, ON_USER_MESSAGE, ON_USER_REACTION } from './discordSetup.js';

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
});

// Event listeners
DISCORD_CLIENT.once('ready', () => ON_READY(DISCORD_CLIENT));
DISCORD_CLIENT.on('interactionCreate', (interaction) => ON_USER_INTERACTION(SUPABASE_CLIENT, interaction));
DISCORD_CLIENT.on('messageCreate', (message) => ON_USER_MESSAGE(SUPABASE_CLIENT, message));
DISCORD_CLIENT.on('messageReactionAdd', (reaction, user) => ON_USER_REACTION(SUPABASE_CLIENT, reaction, user));

// Login to Discord
DISCORD_CLIENT.login(process.env.DISCORD_TOKEN); 

// Export client
export { DISCORD_CLIENT };
