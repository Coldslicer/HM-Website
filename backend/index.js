/* ================ [ SETUP ] ================ */

import "./util/clients.js";

/* ================ [ DRIVER ] ================ */

// Imports
import express from "express";
import cors from "cors";
import { supabase, discord } from "./util/clients.js";
import {
  ON_READY,
  ON_USER_INTERACTION,
  ON_USER_MESSAGE,
  ON_USER_REACTION,
  ON_USER_JOIN,
} from "./util/discordSetup.js";

// Routes
import campaignsRouter from "./routes/discord_routes.js";
import messagesRouter from "./routes/message_routes.js";
import creatorsRouter from "./routes/creators.js";
import contractsRouter from "./routes/contracts.js";
import analyticsRouter from "./routes/analytics.js";
import paymentRouter from "./routes/payment.js";
import joincodesRouter from "./routes/joincode_routes.js";

// Initialize the Express app
const APP = express();
const PORT = process.env.APP_PORT || 3000;

// Middleware
APP.use(express.json());
APP.use(cors());

// Apply routes
APP.use("/api/campaigns", campaignsRouter); // Route for campaigns (finalize creators, etc.)
APP.use("/api/contracts", contractsRouter); // Route for contracts
APP.use("/api/messages", messagesRouter); // Route for messaging
APP.use("/api/creators", creatorsRouter); // Route for creator data
APP.use("/api/analytics", analyticsRouter); // Route for analytics
APP.use("/api/payment", paymentRouter); // Route for payment
APP.use("/api/joincodes", joincodesRouter); // Route for join codes

// Start Express server
APP.listen(PORT, () => {
  console.log(`[HM]: Server started up on http://localhost:${PORT}`);
});

// Event listeners
discord.once("ready", async () => await ON_READY());
discord.on(
  "interactionCreate",
  async (interaction) => await ON_USER_INTERACTION(interaction),
);
discord.on("messageCreate", async (message) => await ON_USER_MESSAGE(message));
discord.on(
  "messageReactionAdd",
  async (reaction, user) => await ON_USER_REACTION(reaction, user),
);
discord.on("guildMemberAdd", async (member) => await ON_USER_JOIN(member));

// Login to Discord
discord.login(process.env.DISCORD_TOKEN);
