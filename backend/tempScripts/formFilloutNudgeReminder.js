import { Client, GatewayIntentBits, Partials } from "discord.js";
import { config } from "dotenv";
import fs from "fs";
import path from "path";

config();

const token = process.env.BOT_TOKEN;
const serverId = process.env.SERVER_ID;

if (!token) {
  console.error("BOT_TOKEN environment variable not found");
  process.exit(1);
}

if (!serverId) {
  console.error("SERVER_ID environment variable not found");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [Partials.Channel],
});

const NAMES_FILE = path.join(__dirname, "names_of_people_to_DM.txt");
const SENT_FILE = path.join(__dirname, "sent.json");

function loadNames() {
  const data = fs.readFileSync(NAMES_FILE, "utf8");
  return data
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split("\t")[0]);
}

function loadSent() {
  try {
    const ids = JSON.parse(fs.readFileSync(SENT_FILE, "utf8"));
    return new Set(ids);
  } catch {
    return new Set();
  }
}

function saveSent(sent) {
  fs.writeFileSync(SENT_FILE, JSON.stringify(Array.from(sent), null, 2));
}

const messageTemplate =
  "Hey @[username]!\n\n" +
  "This is the WARM Bot from Hotslicer Media, the sponsorships Discord server. \n\n" +
  "Can you please take 2 minutes fill out this form? https://forms.gle/QuYAorMpW5c4LJvu9\n\n" +
  "Without this info, **you will be missing out on sponsorships!** Brands need this data to decide who to sponsor. \nPlease fill it out ASAP!\n\n" +
  "If you have already filled this out, we may have made a mistake, you can ignore this message";

client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);

  const names = loadNames();
  const sent = loadSent();

  const guild = await client.guilds.fetch(serverId);
  const members = await guild.members.fetch();

  const unfound = new Set(names);
  const toMessage = [];

  for (const member of members.values()) {
    if (unfound.has(member.user.username)) {
      toMessage.push(member);
      unfound.delete(member.user.username);
    }
  }

  for (const member of toMessage) {
    if (sent.has(member.id)) continue;
    try {
      const msg = messageTemplate.replace("[username]", member.user.username);
      await member.send(msg);
      console.log(`✅ Sent to ${member.user.tag}`);
      sent.add(member.id);
      saveSent(sent);
    } catch (err) {
      console.error(`⚠️ Error sending to ${member.user.tag}:`, err);
    }
  }

  if (unfound.size) {
    console.log("\nUnresolved usernames:");
    for (const name of unfound) {
      console.log(` - ${name}`);
    }
  }

  await client.destroy();
});

client.login(token);
