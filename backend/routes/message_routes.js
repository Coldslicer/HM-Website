import express from "express";
import {
  fetchMessages,
  // message to any channel type
  sendDM,
  // message to a known channel
  sendMessage,
  // literally a DM
  handleDm,
} from "../handlers/message_functions.js";

const router = express.Router();

router.post("/sendDM", async (req, res) => {
  const { message, id, type } = req.body;
  if (!message || !id || !type) {
    return res
      .status(400)
      .json({ error: "Message, id, and type are required" });
  }

  try {
    const result = await sendDM(message, id, type);
    res
      .status(200)
      .json({ message: `Message sent successfully via ${result.via}` });
  } catch (error) {
    console.error("Error in sendDM:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/send", async (req, res) => {
  const { channelId, message } = req.body;
  if (!channelId || !message) {
    return res
      .status(400)
      .json({ error: "Channel ID and message are required" });
  }

  try {
    await sendMessage(channelId, message);
    res.status(200).json({ message: "Message sent successfully" });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/read-messages/:channelId", async (req, res) => {
  const { channelId } = req.params;
  if (!channelId) {
    return res.status(400).json({ error: "Channel ID is required" });
  }

  try {
    const messages = await fetchMessages(channelId);
    res.status(200).json({ messages });
  } catch (error) {
    console.error("Error reading messages:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/dm", async (req, res) => {
  try {
    const { userId, message } = req.body;

    if (!userId || !message) {
      return res.status(400).json({ error: "Missing userId or message." });
    }

    const result = await handleDm({ userId, message });

    if (result.error) {
      return res.status(500).json({ error: result.error });
    }

    return res.status(200).json({ success: true, sentTo: result.sentTo });
  } catch (err) {
    console.error("[/dm] Unhandled error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
});

export default router;
