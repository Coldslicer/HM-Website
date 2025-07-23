// src/routes/campaigns.js

import express from "express";
import * as Controller from "../handlers/discord_functions.js";
import stringSimilarity from "string-similarity";

const router = express.Router();

router.get("/validate-discord-id/:discordId", async (req, res) => {
  try {
    const result = await Controller.validateDiscordId(
      req.params.discordId,
    );
    if (!result.valid) return res.status(400).json(result);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/remove-unselected-discord-channels", async (req, res) => {
  try {
    const result = await Controller.removeUnselectedDiscordChannels(
      req.body.campaignId,
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

router.post("/init-category", async (req, res) => {
  try {
    const result = await Controller.initCategory(req.body.campaignId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

router.post("/purge-category", async (req, res) => {
  try {
    const result = await Controller.purgeCategory(req.body.campaignId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

router.post("/add-creator-to-discord", async (req, res) => {
  try {
    const result = await Controller.addCreatorToDiscord(
      req.body.creatorId,
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

router.post("/remove-creator-from-discord", async (req, res) => {
  try {
    const result = await Controller.removeCreatorFromDiscord(
      req.body.creatorId,
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

router.post("/create-group-chat", async (req, res) => {
  try {
    const result = await Controller.createGroupChat(
      req.body.campaignId,
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});


router.get("/discord-lookup", async (req, res) => {
  try {
    const result = await Controller.getDiscordIdFromTag(discord, req.query.tag);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message || "Internal server error" });
  }
});

export default router;
