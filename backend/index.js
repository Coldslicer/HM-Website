/* ================ [ SETUP ] ================ */

import "./util/clients.js";

/* ================ [ IMPORTS ] ================ */

import express from "express";
import cors from "cors";
import { discord } from "./util/clients.js";
import {
  ON_READY,
  ON_USER_INTERACTION,
  ON_USER_MESSAGE,
  ON_USER_REACTION,
  ON_USER_JOIN,
} from "./util/discordSetup.js";

import campaignsRouter from "./routes/discord_routes.js";
import messagesRouter from "./routes/message_routes.js";
import creatorsRouter from "./routes/creators.js";
import contractsRouter from "./routes/contracts.js";
import analyticsRouter from "./routes/analytics.js";
import paymentRouter from "./routes/payment.js";
import joincodesRouter from "./routes/joincode_routes.js";

/* ================ [ DRIVER ] ================ */

// Initialize app
const APP = express();
const PORT = process.env.APP_PORT || 3000;
APP.use(express.json());
APP.use(cors());

// Connect routes
APP.use("/api/campaigns", campaignsRouter);
APP.use("/api/contracts", contractsRouter);
APP.use("/api/messages", messagesRouter);
APP.use("/api/creators", creatorsRouter);
APP.use("/api/analytics", analyticsRouter);
APP.use("/api/payment", paymentRouter);
APP.use("/api/joincodes", joincodesRouter);

// Start Express server
APP.listen(PORT, () => {
  console.log(`[HM]: Server started up on http://localhost:${PORT}`);
});

// Discord setup
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
