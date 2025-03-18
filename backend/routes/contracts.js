import express from 'express';
import axios from 'axios';
import { SUPABASE_CLIENT } from '../util/setup.js';

const router = express.Router();
const API_KEY = process.env.DOCUSEAL_API_KEY;

router.get('/client-form', async (req, res) => {
  const { campaign_id, signer_email, fullyManaged } = req.query;

  const { data: existingData, error: fetchError } = await SUPABASE_CLIENT
      .from("campaigns")
      .select("id, contract_json, name")
      .eq("id", campaign_id)
      .single();

    if (fetchError) {
      console.error('Error fetching Supabase data:', fetchError.message);
      return res.status(500).json({ error: 'Failed to fetch Supabase campaign data' });
    }

    if (existingData && existingData.contract_json) {
      // If the contract data exists, return it
      const clientEmbedSrc = existingData.contract_json[1].embed_src;
      const external_id = existingData.contract_json[1].external_id;
      return res.json({ embed_src: clientEmbedSrc, external_id: external_id });
    }

  if (!campaign_id) {
    console.log('query did not provide campaign_id');
    return res.status(400).json({ error: 'Campaign ID is required' });
  }

  if (!signer_email) {
    console.log('query did not provide signer_email');
    return res.status(400).json({ error: 'Signer email is required' });
  }

  const { data: creatorData, error: error } = await SUPABASE_CLIENT
    .from("campaign_creators")
    .select("channel_name, deliverables, rate, rate_cpm")
    .eq("campaign_id", campaign_id)
  
  if (error) {
    return res.status(500).json({ error: 'Failed to fetch Supabase creator data' });
  }

  try {
    const submissionData = {
      template_id: 747452,
      send_email: false,
      external_id: campaign_id,
      submitters: [
        {
          email: process.env.AGENCY_EMAIL,
          role: 'agency',
          fields: [
            {
              name: 'Creators',
              default_value: creatorData.length
                ? creatorData.map(c => c.channel_name).join(', ')
                : 'No creators assigned',
            },
            {
              name: 'Content Type',
              default_value: creatorData.length
                ? creatorData.map(c => c.deliverables).join('; ')
                : 'No deliverables specified',
            },
            {
              name: 'Campaign',
              default_value: existingData.name || "Unknown",
            },
            {
              name: 'Fees',
              default_value: creatorData.length
              ? `Total: $${Math.round(
                  creatorData.reduce((sum, c) => sum + (c.rate || 0), 0) * (fullyManaged ? 1.2 : 1)
                )}\n` +
                creatorData
                  .map(c => `${c.channel_name}: $${c.rate_cpm || 0} CPM`)
                  .join(', ')
              : 'TBD'
            }            
          ],
        },
        {
          email: signer_email,
          role: 'client',
          external_id: campaign_id,
        },
      ],
    };
    

    const response = await axios.request({
      method: 'POST',
      url: 'https://api.docuseal.com/submissions',
      headers: {
        'X-Auth-Token': API_KEY,
        'content-type': 'application/json'
      },
      data: submissionData
    });

    const clientEmbedSrc = response.data[1].embed_src;
    const external_id = response.data[1].external_id;

    // Send the response to the client
    res.json({ embed_src: clientEmbedSrc, external_id: external_id });

    // Update Supabase with the contract JSON
    const { data, error } = await SUPABASE_CLIENT
      .from("campaigns")
      .update({ contract_json: response.data })
      .eq("id", campaign_id);

    if (error) {
      console.error('Error updating Supabase:', error.message);
    } else {
      console.log('Supabase updated successfully:', data);
    }
  } catch (error) {
    console.error('An error occurred while creating the submission:', error.message);
    console.error('Error response:', error.response?.data || error.message);

    if (!res.headersSent) {
      res.status(500).json({ error: "An error occurred during API call" });
    }
  }
});

export default router;