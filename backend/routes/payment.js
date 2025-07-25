/* ================ [ IMPORTS ] ================ */

import fontkit from "@pdf-lib/fontkit";
import express from "express";
import fs from "fs/promises";
import nodemailer from "nodemailer";
import path from "path";
import { PDFDocument } from "pdf-lib";
import { fileURLToPath } from "url";
import { supabase } from "../util/clients.js";
import axios from "axios";

/* ================ [ HELPERS ] ================ */

// Date formatter
const formatDate = () => {
  const date = new Date();
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

// Calculate text position
const centerPos = (text, font, size, pos) => {
  const textWidth = font.widthOfTextAtSize(text, size);
  return {
    x: pos.x - textWidth / 2,
    y: pos.y - size / 2,
  };
};

// Get video ID from URL
const getVideoID = (url) => {
  const match = url.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
};

/* ================ [ PAYMENT ] ================ */

// Router
const ROUTER = express.Router();

// Email transporter
const TRANSPORTER = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.INVOICE_EMAIL,
    pass: process.env.INVOICE_EMAIL_PASSWORD,
  },
});

// Get path to invoice
const FILE_PATH = fileURLToPath(import.meta.url);
const DIRNAME = path.dirname(FILE_PATH);

// Fetch views on CPM video
const getYouTubeViews = async (videoId) => {
  try {
    const { data, error } = await supabase
      .from("video_data")
      .select(
        Array.from({ length: 30 }, (_, i) => `views_${30 - i}`).join(", "),
      )
      .eq("video_id", videoId)
      .single();

    if (error) throw error;

    for (let day = 30; day >= 1; day--) {
      const key = `views_${day}`;
      const value = data?.[key];
      if (value != null) return parseInt(value);
    }

    return 0;
  } catch (error) {
    console.error("Supabase error:", error);
    throw new Error("Failed to fetch video views");
  }
};

// Create invoice PDF
const modifyPDF = async (campaignData, paymentAmount) => {
  const INVOICE_PATH = path.resolve(DIRNAME, "../assets/invoice.pdf");
  const INVOICE = await PDFDocument.load(await fs.readFile(INVOICE_PATH));

  INVOICE.registerFontkit(fontkit);
  const ROBOTO = await INVOICE.embedFont(
    await fs.readFile(
      path.resolve(DIRNAME, "../assets/fonts/Roboto-Regular.ttf"),
    ),
  );
  const ROBOTO_BOLD = await INVOICE.embedFont(
    await fs.readFile(path.resolve(DIRNAME, "../assets/fonts/Roboto-Bold.ttf")),
  );

  const PAGE = INVOICE.getPages()[0];

  const POS = {
    date: { x: 470, y: 670 },
    id: { x: 470, y: 633 },
    contact_name: { x: 91.5, y: 520.5 },
    company_name: { x: 91.5, y: 501 },
    address: { x: 91.5, y: 482 },
    address2: { x: 91.5, y: 472 },
    phone: { x: 91.5, y: 450.5 },
    email: { x: 91.5, y: 431.5 },
    description: { x: 93.5, y: 365 },
    unit_price: { x: 390, y: 370 },
    total: { x: 470, y: 370 },
    subtotal: { x: 470, y: 346 },
    balance_due: { x: 470, y: 309 },
  };

  const dateText = formatDate();
  PAGE.drawText(dateText, {
    ...centerPos(dateText, ROBOTO_BOLD, 10, POS.date),
    font: ROBOTO_BOLD,
    size: 10,
  });

  const invoiceIdText = "INVOICE NO. " + campaignData.invoice_id.toString();
  PAGE.drawText(invoiceIdText, {
    ...centerPos(invoiceIdText, ROBOTO_BOLD, 10, POS.id),
    font: ROBOTO_BOLD,
    size: 10,
  });

  const drawContactInfo = (text, pos) => {
    PAGE.drawText(text, {
      x: pos.x,
      y: pos.y,
      font: ROBOTO,
      size: 10,
    });
  };

  drawContactInfo(campaignData.rep_name, POS.contact_name);
  drawContactInfo(campaignData.company_name, POS.company_name);

  const address = campaignData.company_address;
  if (address.length > 30) {
    const splitIndex = address.lastIndexOf(" ", 30);
    const [line1, line2] = [
      address.substring(0, splitIndex),
      address.substring(splitIndex + 1),
    ];
    drawContactInfo(line1, POS.address);
    drawContactInfo(line2, POS.address2);
  } else {
    drawContactInfo(address, POS.address);
  }

  drawContactInfo(campaignData.company_phone, POS.phone);
  drawContactInfo(campaignData.payment_email, POS.email);

  const descriptionText = `HSM ${campaignData.type} payment - ${campaignData.creatorName}`;
  PAGE.drawText(descriptionText, {
    x: POS.description.x,
    y: POS.description.y,
    font: ROBOTO,
    size: 10,
  });

  const priceText = `$${paymentAmount.toFixed(2)}`;
  const drawPriceField = (pos) => {
    PAGE.drawText(priceText, {
      ...centerPos(priceText, ROBOTO, 10, pos),
      font: ROBOTO,
      size: 10,
    });
  };

  drawPriceField(POS.unit_price);
  drawPriceField(POS.total);

  PAGE.drawText(priceText, {
    ...centerPos(priceText, ROBOTO_BOLD, 10, POS.subtotal),
    font: ROBOTO_BOLD,
    size: 10,
  });

  PAGE.drawText(priceText, {
    ...centerPos(priceText, ROBOTO_BOLD, 15, POS.balance_due),
    font: ROBOTO_BOLD,
    size: 15,
  });

  return INVOICE.save();
};

/* ================ [ ROUTES ] ================ */

// Get creators
ROUTER.post("/get-creators", async (req, res) => {
  try {
    const { campaign_id } = req.body;

    if (!campaign_id) {
      return res.status(400).json({ error: "campaign_id is required" });
    }

    const { data, error } = await supabase
      .from("campaign_creators")
      .select(
        `
        id,
        channel_name,
        rate,
        rate_cpm,
        flat_paid,
        cpm_paid,
        final_approved,
        flat_emailed,
        cpm_emailed,
        live_submitted,
        cpm_cap,
        selected,
        live_url
      `,
      )
      .eq("campaign_id", campaign_id);

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({ error: error.message });
    }

    res.json(data || []);
  } catch (error) {
    console.error("Error fetching creators:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Initiate payment
ROUTER.post("/initiate-payment", async (req, res) => {
  try {
    const { creator_id, type } = req.body;

    const { data: creatorData, error: creatorError } = await supabase
      .from("campaign_creators")
      .select("campaign_id, rate, rate_cpm, channel_name, live_url, cpm_cap")
      .eq("id", creator_id)
      .single();

    if (creatorError || !creatorData) {
      return res.status(404).json({ error: "Creator not found" });
    }

    if (type === "cpm" && !creatorData.live_url) {
      return res
        .status(400)
        .json({ error: "Live URL not available for CPM calculation" });
    }

    const { data: campaignData, error: campaignError } = await supabase
      .from("campaigns")
      .select(
        "payment_email, rep_name, company_name, company_address, company_phone, invoice_id",
      )
      .eq("id", creatorData.campaign_id)
      .single();

    if (campaignError || !campaignData) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    let paymentAmount;
    if (type === "flat") {
      paymentAmount = creatorData.rate;
    } else {
      const videoId = getVideoID(creatorData.live_url);
      if (!videoId) {
        return res.status(400).json({ error: "Invalid live_url" });
      }
      const views = await getYouTubeViews(videoId);
      const calculatedAmount = (views / 1000) * creatorData.rate_cpm;
      paymentAmount = creatorData.cpm_cap
        ? Math.min(calculatedAmount, creatorData.cpm_cap)
        : calculatedAmount;
    }

    const modifiedPdf = await modifyPDF(
      {
        ...campaignData,
        type: type.toUpperCase(),
        creatorName: creatorData.channel_name,
      },
      paymentAmount,
    );

    await TRANSPORTER.sendMail({
      from: process.env.INVOICE_EMAIL,
      to: campaignData.payment_email,
      subject: "Invoice from Hotslicer Media",
      text: "Please find your attached invoice.",
      attachments: [
        {
          filename: `invoice_${campaignData.invoice_id}.pdf`,
          content: modifiedPdf,
          contentType: "application/pdf",
        },
      ],
    });

    const { error: updateError } = await supabase
      .from("campaign_creators")
      .update({ [`${type}_emailed`]: true })
      .eq("id", creator_id);

    if (updateError) throw updateError;

    const { error: incrementError } = await supabase
      .from("campaigns")
      .update({ invoice_id: campaignData.invoice_id + 1 })
      .eq("id", creatorData.campaign_id);

    if (incrementError) throw incrementError;

    res.json({ success: true, amount: paymentAmount });
  } catch (error) {
    console.error("Payment error:", error);
    res.status(500).json({
      error:
        error.response?.data?.error?.message ||
        error.message ||
        "Payment processing failed",
    });
  }
});

/* ================ [ EXPORTS ] ================ */

export default ROUTER;
