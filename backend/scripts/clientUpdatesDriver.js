import dotenv from 'dotenv';
import cron from 'node-cron';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import { emailRules } from '../client-updates/emailRules.js';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.UPDATES_EMAIL,
    pass: process.env.UPDATES_EMAIL_PASSWORD
  }
});

async function getOrCreateMemos(campaignId) {
  const { data, error } = await supabase
    .from('campaign_update_memos')
    .select('updates')
    .eq('campaign_id', campaignId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  if (!data) {
    const { error: insertError } = await supabase
      .from('campaign_update_memos')
      .insert([{ campaign_id: campaignId, updates: '{}' }]);

    if (insertError) throw insertError;

    return {};
  }

  return data.updates || {};
}

async function updateMemos(campaignId, updatesToMark) {
  const { error } = await supabase
    .from('campaign_update_memos')
    .update({ updates: updatesToMark })
    .eq('campaign_id', campaignId);

  if (error) throw error;
}

async function getUpdateMessages(campaign, sentMemos) {
  const updatesToSend = [];
  const now = new Date().toISOString();
  const updatedMemo = { ...sentMemos };

  for (const rule of emailRules) {
    if (rule.once && sentMemos[rule.id]) continue;

    // Ensure async rule evaluation is awaited
    const result = await rule.evaluate(campaign, supabase); // <-- Await the evaluation of the rule
    if (result) {
      updatesToSend.push({ id: rule.id, body: result });
      if (rule.once) updatedMemo[rule.id] = now;
    }
  }

  return { updatesToSend, updatedMemo };
}

async function sendDailyEmailUpdates() {
  try {
    console.log(`[${new Date().toLocaleString()}] Running email update task...`);

    const { data: campaigns, error } = await supabase
      .from('campaigns')
      .select('id, name, updates_email, rep_name, status, created_at')
      .not('updates_email', 'is', null);

    if (error) throw error;

    for (const campaign of campaigns) {
      const email = campaign.updates_email?.trim();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) continue;

      const sentMemos = await getOrCreateMemos(campaign.id);
      const { updatesToSend, updatedMemo } = await getUpdateMessages(campaign, sentMemos);

      if (updatesToSend.length === 0) {
        console.log(`ℹ️ No updates for campaign ${campaign.id}`);
        continue;
      }

      const messageBody = updatesToSend.map(u => u.body).join('\n\n---\n\n');

      try {
        // Fix typo and use campaign name or fallback to "Draft Campaign"
        await transporter.sendMail({
          from: `"Campaign Updates" <${process.env.UPDATES_EMAIL}>`,
          to: email,
          subject: `Campaign Update for ${campaign?.name || "Draft Campaign"}`,
          text: messageBody
        });

        console.log(`✅ Email sent to ${email} (Campaign ID: ${campaign.id})`);
        await updateMemos(campaign.id, updatedMemo);
      } catch (err) {
        console.error(`❌ Failed to send to ${email}:`, err.message);
      }
    }

    console.log('✅ Email task complete.\n');
  } catch (err) {
    console.error('❌ Task error:', err.message);
  }
}

// Run once on startup
sendDailyEmailUpdates();

// Schedule daily at 5:00 PM
cron.schedule('0 17 * * *', sendDailyEmailUpdates);
