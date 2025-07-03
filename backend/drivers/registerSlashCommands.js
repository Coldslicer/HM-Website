/* ================ [ SETUP ] ================ */

import { discord } from "../util/clients.js";

/* ================ [ IMPORTS ] ================ */

import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";

/* ================ [ COMMANDS ] ================ */

const commands = [
  // USER UTILITY
  new SlashCommandBuilder()
    .setName("help")
    .setDescription("Shows information on how to use WARM commands"),
  new SlashCommandBuilder()
    .setName("id")
    .setDescription(
      "Get your discord numeric ID (this is used during creator registration)",
    ),

  // VIDEO SUBMISSIONS
  new SlashCommandBuilder()
    .setName("draft")
    .setDescription("Submit a link to your draft video")
    .addStringOption((option) =>
      option
        .setName("link")
        .setDescription(
          "Either the link to an unlisted Youtube video or a Google Drive folder containing your video",
        )
        .setRequired(true),
    ),
  new SlashCommandBuilder()
    .setName("live")
    .setDescription(
      "Submit a link to your LIVE video (only do this after you're approved for posting)",
    )
    .addStringOption((option) =>
      option
        .setName("link")
        .setDescription(
          "The link to your LIVE video (currently only supports Youtube)",
        )
        .setRequired(true),
    ),

  // CREATOR MANAGEMENT
  new SlashCommandBuilder()
  .setName("join")
  .setDescription("Join a campaign using a valid join code")
  .addStringOption((option) =>
    option
      .setName("join_code")
      .setDescription("The join code you were provided")
      .setRequired(true)
  )
  .addNumberOption((option) =>
    option
      .setName("rate")
      .setDescription("Your flat rate (optional)")
      .setRequired(false)
  )
  .addNumberOption((option) =>
    option
      .setName("rate_cpm")
      .setDescription("Your CPM rate (optional)")
      .setRequired(false)
  )
  .addNumberOption((option) =>
    option
      .setName("cpm_cap")
      .setDescription("CPM cap (optional)")
      .setRequired(false)
  ),

  new SlashCommandBuilder()
    .setName("editrates")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDescription("Edit your flat and CPM rates")
    .addNumberOption((option) =>
      option.setName("flat").setDescription("The new flat rate"),
    )
    .addNumberOption((option) =>
      option.setName("cpm").setDescription("The new CPM rate"),
    )
    .addNumberOption((option) =>
      option.setName("cap").setDescription("The new CPM cap"),
    ),

  // CHANNEL MANAGEMENT
  new SlashCommandBuilder()
    .setName("register")
    .setDescription(
      "Register the current channel to be able to recieve sponsorship offers",
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((option) =>
      option
        .setName("niche")
        .setDescription(
          "The niche that the channel is meant for (shown to clients)",
        )
        .setRequired(true),
    ),
  new SlashCommandBuilder()
    .setName("unregister")
    .setDescription(
      "Removes the current channel from the WARM registration list",
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  new SlashCommandBuilder()
    .setName("registrations")
    .setDescription(
      "Lists all channels registered with WARM in the current server",
    ),

  // ROLES MANAGEMENT
  new SlashCommandBuilder()
    .setName("showroles")
    .setDescription("Lists all of the configured roles in WARM"),
  new SlashCommandBuilder()
    .setName("addrole")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDescription(
      "Registers a new role that will conditionally recieve updates depending on client preferences",
    )
    .addStringOption((option) =>
      option
        .setName("title")
        .setDescription("The title of the role")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("description")
        .setDescription("A brief description of the role (shown to clients)")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("role")
        .setDescription(
          "Ping the discord role that you want to attach to this WARM role",
        )
        .setRequired(true),
    ),
  new SlashCommandBuilder()
    .setName("removerole")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setDescription("Removes a role from the WARM registration list")
    .addStringOption((option) =>
      option
        .setName("value")
        .setDescription(
          "Ping the discord role you want to remove the WARM attachment for",
        )
        .setRequired(true),
    ),

  // TODO: Sharvil i got no clue what this one does
  new SlashCommandBuilder()
    .setName("getlink")
    .setDescription("Gives you the form link for the given campaign join code")
    .addStringOption((option) =>
      option
        .setName("join_code")
        .setDescription("The 6 letter join code for the campaign")
        .setRequired(true),
    ),
];

/* ================ [ DRIVER ] ================ */

discord.login(process.env.DISCORD_TOKEN);

discord.once("ready", async () => {
  console.log("[HM]: Registering slash commands...");

  // Wait for discord to be ready
  await discord.application.commands.fetch();

  // Register all slash commands with discord
  const commandsData = commands.map((command) => command.toJSON());
  try {
    await discord.application.commands.set(commandsData);
  } catch (error) {
    console.error("[HM]: Error registering slash commands: ", error);
    process.exit(1);
  }

  console.log("[HM]: SUCCESS!");
  process.exit(0);
});
