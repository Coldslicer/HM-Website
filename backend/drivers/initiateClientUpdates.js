/* ================ [ SETUP ] ================ */

import "../util/clients.js";

/* ================ [ IMPORTS ] ================ */

import cron from "node-cron";
import nodemailer from "nodemailer";
import validator from "validator";
import { nudges } from "../util/emailNudges.js";

/* ================ [ EMAILS ] ================ */

// Create email sender
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.UPDATES_EMAIL,
    pass: process.env.UPDATES_EMAIL_PASSWORD,
  },
});

async function getOrCreateMemos(campaign) {
  const { data, error } = await supabase
    .from("campaign_update_memos")
    .select("updates")
    .eq("campaign_id", campaign)
    .single();

  if (error && error.code !== "PGRST116") {
    throw error;
  }

  if (!data) {
    const { error: insertError } = await supabase
      .from("campaign_update_memos")
      .insert([{ campaign_id: campaign, updates: "{}" }]);

    if (insertError) throw insertError;

    return {};
  }

  return data.updates || {};
}

async function updateMemos(campaignId, updatesToMark) {
  const { error } = await supabase
    .from("campaign_update_memos")
    .update({ updates: updatesToMark })
    .eq("campaign_id", campaignId);

  if (error) throw error;
}

async function getUpdateMessages(campaign, sentMemos) {
  const updatesToSend = [];
  const now = new Date().toISOString();
  const updatedMemo = { ...sentMemos };

  for (const nudge of nudges) {
    if (nudge.once && sentMemos[nudge.id]) continue;

    // Ensure async rule evaluation is awaited
    const result = await nudge.evaluate(campaign, supabase); // <-- Await the evaluation of the rule
    if (result) {
      updatesToSend.push({ id: nudge.id, body: result });
      if (nudge.once) updatedMemo[nudge.id] = now;
    }
  }

  return { updatesToSend, updatedMemo };
}

// Send out daily email updates
async function sendDailyUpdates() {
  try {
    console.log(`[${new Date().toLocaleString()}] Sending daily updates...`);

    // Fetch campaigns with updates email
    const { data: campaigns } = await supabase
      .from("campaigns")
      .select("id, name, updates_email, rep_name, status, created_at")
      .not("updates_email", "is", null);

    // Send out updates for each campaign
    for (const campaign of campaigns) {
      const email = campaign.updates_email?.trim();

      // Validate email address
      if (!email || !validator.isEmail(email)) continue;

      const sentMemos = await getOrCreateMemos(campaign.id);
      const { updatesToSend, updatedMemo } = await getUpdateMessages(
        campaign,
        sentMemos,
      );

      if (updatesToSend.length === 0) {
        console.log(`ℹ️ No updates for campaign ${campaign.id}`);
        continue;
      }

      const messageBody = updatesToSend.map((u) => u.body).join("\n\n---\n\n");

      try {
        // Fix typo and use campaign name or fallback to "Draft Campaign"
        await transporter.sendMail({
          from: `"Campaign Updates" <${process.env.UPDATES_EMAIL}>`,
          to: email,
          subject: `Campaign Update for ${campaign?.name || "Draft Campaign"}`,
          text: messageBody,
        });

        console.log(`✅ Email sent to ${email} (Campaign ID: ${campaign.id})`);
        await updateMemos(campaign.id, updatedMemo);
      } catch (err) {
        console.error(`❌ Failed to send to ${email}:`, err.message);
      }
    }

    console.log("✅ Email task complete.\n");
  } catch (err) {
    console.error("❌ Task error:", err.message);
  }
}

/* ================ [ DRIVER ] ================ */

// Run code on startup
sendDailyUpdates();

// Schedule daily at 5:00 PM
cron.schedule("0 17 * * *", sendDailyUpdates);
