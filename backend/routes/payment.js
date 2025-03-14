import express from 'express';
import { SUPABASE_CLIENT } from '../util/setup.js'; // Backend Supabase import
import nodemailer from 'nodemailer';

const ROUTER = express.Router();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

ROUTER.post('/get-creators', async (req, res) => {
  try {
    console.log('Request body:', req.body);

    const { campaign_id } = req.body;
    if (!campaign_id) {
      return res.status(400).json({ error: 'campaign_id is required' });
    }

    const { data, error } = await SUPABASE_CLIENT
      .from('campaign_creators')
      .select('id, channel_name, rate, rate_cpm, flat_paid, cpm_paid')
      .eq('campaign_id', campaign_id);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log('Supabase data:', data);
    res.json(data || []);
  } catch (error) {
    console.error('Error fetching creators:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

ROUTER.post('/initiate-payment', async (req, res) => {
  try {
    const { creator_id, type } = req.body;

    // Fetch campaign email
    const { data: campaignData, error: campaignError } = await SUPABASE_CLIENT
      .from('campaigns')
      .select('payment_email')
      .eq('id', (await SUPABASE_CLIENT
        .from('campaign_creators')
        .select('campaign_id')
        .eq('id', creator_id)
        .single()
      ).data.campaign_id);

    if (campaignError || !campaignData) {
      throw new Error('Campaign not found');
    }

    // Send email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: campaignData.payment_email,
      subject: 'Invoice Email',
      text: 'Invoice email',
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Payment error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default ROUTER;