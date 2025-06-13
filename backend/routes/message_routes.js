import express from 'express';
import { fetchMessages, sendDM, sendMessage } from '../handlers/message_functions.js';

const router = express.Router();

router.post('/sendDM', async (req, res) => {
  const { message, id, type } = req.body;
  if (!message || !id || !type) {
    return res.status(400).json({ error: 'Message, id, and type are required' });
  }

  try {
    const result = await sendDM(message, id, type);
    res.status(200).json({ message: `Message sent successfully via ${result.via}` });
  } catch (error) {
    console.error('Error in sendDM:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/send', async (req, res) => {
  const { channelId, message } = req.body;
  if (!channelId || !message) {
    return res.status(400).json({ error: 'Channel ID and message are required' });
  }

  try {
    await sendMessage(channelId, message);
    res.status(200).json({ message: 'Message sent successfully' });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/read-messages/:channelId', async (req, res) => {
  const { channelId } = req.params;
  if (!channelId) {
    return res.status(400).json({ error: 'Channel ID is required' });
  }

  try {
    const messages = await fetchMessages(channelId);
    res.status(200).json({ messages });
  } catch (error) {
    console.error('Error reading messages:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
