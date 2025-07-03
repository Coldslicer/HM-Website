/* ================ [ DOTENV ] ================ */

import { config } from "dotenv";

// Check & load environment variables
if (!process.env.APP_PORT) {
  console.log("[HM]: Loading environment variables...");
  console.log(config());
}

/* ================ [ SUPABASE ] ================ */

import { createClient } from "@supabase/supabase-js";

// Supabase client
console.log("[HM]: Connecting to Supabase...");
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
);

// Log current login
const { error } = await supabase.from("backend_logins").insert([
  {}, // Empty row since uuid and time autofill
]);

if (error) console.error("[HM]: Unable to connect to Supabase! ", error);

// Export client
export { supabase };

/* ================ [ DISCORD ] ================ */

// Imports
import { Client, GatewayIntentBits, Partials } from "discord.js";

// Discord client
console.log("[HM]: Connecting to Discord...");
const discord = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

// Export client
export { discord };

/* ================ [ APIFY ] ================ */

// Apify tiktok scraper endpoint
const tiktok = `https://api.apify.com/v2/acts/clockworks~tiktok-scraper/run-sync-get-dataset-items?token=${process.env.APIFY_TOKEN}`

// Export endpoint
export { tiktok };

/* ================ [ CHATGPT ] ================ */

// Imports
import OpenAI from "openai";

// OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
});

// Export client
export { openai };
