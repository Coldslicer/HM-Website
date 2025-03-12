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
import { Client, GatewayIntentBits, Partials } from 'discord.js';

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

// Export client
export { DISCORD_CLIENT };
