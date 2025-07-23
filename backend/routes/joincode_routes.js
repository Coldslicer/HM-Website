import express from "express";
import * as CodeFunctions from "../handlers/joincode_functions.js";

const router = express.Router();

router.get("/encode", async (req, res) => {
  const campaignId = req.query.campaignId;
  if (typeof campaignId !== "string" || campaignId.length !== 36) {
    return res.status(400).json({ error: "Invalid campaignId (must be UUID)" });
  }

  try {
    const code = await CodeFunctions.encodeCampaignId(campaignId);
    return res.status(200).json({ code });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get("/decode", async (req, res) => {
  const code = req.query.code;
  if (typeof code !== "string") {
    return res.status(400).json({ error: "Invalid code" });
  }

  try {
    const campaign = await CodeFunctions.decodeJoinCode(code.toUpperCase());
    return res.status(200).json({ campaignId: campaign.id, campaign });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

export default router;
