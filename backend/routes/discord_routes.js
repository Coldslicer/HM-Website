// src/routes/campaigns.js

import express from "express";
import * as CampaignsController from "../handlers/discord_functions.js";

const router = express.Router();

router.get("/validate-discord-id/:discordId", async (req, res) => {
  try {
    const result = await CampaignsController.validateDiscordId(
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
    const result = await CampaignsController.removeUnselectedDiscordChannels(
      req.body.campaignId,
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

router.post("/init-category", async (req, res) => {
  try {
    const result = await CampaignsController.initCategory(req.body.campaignId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

router.post("/purge-category", async (req, res) => {
  try {
    const result = await CampaignsController.purgeCategory(req.body.campaignId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

router.post("/add-creator-to-discord", async (req, res) => {
  try {
    const result = await CampaignsController.addCreatorToDiscord(
      req.body.creatorId,
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

router.post("/remove-creator-from-discord", async (req, res) => {
  try {
    const result = await CampaignsController.removeCreatorFromDiscord(
      req.body.creatorId,
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

router.post("/create-group-chat", async (req, res) => {
  try {
    const result = await CampaignsController.createGroupChat(
      req.body.campaignId,
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

export default router;
