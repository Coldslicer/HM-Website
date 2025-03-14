/* ================ [ SETUP ] ================ */

import "./util/setup.js";

/* ================ [ DRIVER ] ================ */

// Imports
import express from 'express';
import cors from 'cors';
import { SUPABASE_CLIENT, DISCORD_CLIENT } from "./util/setup.js";
import { ON_READY, ON_USER_INTERACTION, ON_USER_MESSAGE, ON_USER_REACTION } from "./util/discordSetup.js";

// Routes
import campaignsRouter from './routes/campaigns.js';
import messagesRouter from './routes/messages.js';
import creatorsRouter from './routes/creators.js';
import contractsRouter from './routes/contracts.js';
import paymentRouter from './routes/payment.js';

// Initialize the Express app
const APP = express();
const PORT = process.env.APP_PORT || 3000;

// Middleware
APP.use(express.json());
APP.use(cors());


// Apply routes
APP.use('/api/campaigns', campaignsRouter); // Route for campaigns (finalize creators, etc.)
APP.use('/api/contracts', contractsRouter); // Route for contracts
APP.use('/api/messages', messagesRouter); // Route for messaging
APP.use('/api/creators', creatorsRouter); // Route for creator data
APP.use('/api/payment', paymentRouter); // Route for payment

// Start Express server
APP.listen(PORT, () => {
  console.log(`[HM]: Server started up on http://localhost:${PORT}`);
});

// Event listeners
DISCORD_CLIENT.once('ready', async() => await ON_READY());
DISCORD_CLIENT.on('interactionCreate', async(interaction) => await ON_USER_INTERACTION(interaction));
DISCORD_CLIENT.on('messageCreate', async(message) => await ON_USER_MESSAGE(message));
DISCORD_CLIENT.on('messageReactionAdd', async(reaction, user) => await ON_USER_REACTION(reaction, user));

// Login to Discord
DISCORD_CLIENT.login(process.env.DISCORD_TOKEN); 