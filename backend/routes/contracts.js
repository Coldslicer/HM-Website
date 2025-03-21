import express from 'express';
import axios from 'axios';
import { SUPABASE_CLIENT } from '../util/setup.js';

import fs from 'fs';
import path from 'path';
import ejs from 'ejs';
import he from 'he';  // Import the 'he' library for decoding HTML entities

import { fileURLToPath } from 'url'; // Import necessary method from 'url'

const API_KEY = process.env.DOCUSEAL_API_KEY;

// Function to get campaign details from Supabase
async function getCampaignDetails(campaignId) {
  const { data, error } = await SUPABASE_CLIENT
    .from('campaigns')
    .select('*')
    .eq('id', campaignId)
    .single();

  if (error) {
    console.error('Error fetching campaign details:', error);
    return null;
  }
  return data;
}

// Function to get creator details from Supabase
async function getCreatorsForCampaign(campaignId) {
  const { data, error } = await SUPABASE_CLIENT
    .from('campaign_creators')
    .select('*')
    .eq('campaign_id', campaignId);

  if (error) {
    console.error('Error fetching creators:', error);
    return [];
  }
  return data;
}


// Function to load HTML template from file and decode HTML entities
function loadHtmlTemplate(templatePath = '../assets/CAMPAIGNCONTRACTWITHFIELDS.html') {
  try {
    // Get the directory of the current module (using import.meta.url)
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    // Resolve the path to the HTML template using __dirname
    const templateFilePath = path.resolve(__dirname, templatePath);
    
    // Read the HTML template file
    const template = fs.readFileSync(templateFilePath, 'utf-8');
    
    // Decode HTML entities in the template to get the correct text
    const decodedTemplate = he.decode(template);
    
    return decodedTemplate;
  } catch (err) {
    console.error('Error loading template file:', err);
    return '';
  }
}


// Function to upload the contract template to DocuSeal
async function uploadTemplateToDocuSeal(htmlContent) {
  try {
    // Create a full HTML document if necessary (make sure the structure is correct)
    const fullHtml = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Campaign Contract</title>
        </head>
        <body>
          ${htmlContent}  <!-- This is where your contract HTML will be placed -->
        </body>
      </html>
    `;
    
    // Make a POST request to DocuSeal to upload the template
    const response = await axios.post('https://api.docuseal.com/templates/html', {
      name: 'Campaign Contract', // Template name
      html_body: fullHtml, // Send the full HTML structure here as 'html_body'
      folder_name: 'Client Contracts', // Specify the category here
    }, {
      headers: {
        'X-Auth-Token': API_KEY,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('Template uploaded successfully:', response.data);
    return response.data.id; // Get the document ID from the response
  } catch (error) {
    console.error('Error uploading template to DocuSeal:', error);
    return null;
  }
}

// Function to generate the contract from the template
async function generateContract(campaignId) {
  // Fetch campaign details
  const campaign = await getCampaignDetails(campaignId);
  if (!campaign) {
    return;
  }

  // Fetch creators for the campaign
  const creators = await getCreatorsForCampaign(campaignId);

  // Load the HTML template and decode HTML entities
  const htmlTemplate = loadHtmlTemplate();

  // Ensure that the data passed matches the placeholders in the HTML template
  const renderedHtml = ejs.render(htmlTemplate, {
    campaign: campaign,
    creators: creators
  });

  // Upload the rendered HTML to DocuSeal
  const documentId = await uploadTemplateToDocuSeal(renderedHtml);
  if (documentId) {
    console.log(`Template uploaded successfully with Document ID: ${documentId}`);
  } else {
    console.log('Failed to upload template.');
  }
  return documentId;
}

// Example usage
// const campaignId = 'd4b0873d-19d7-48ae-83d5-31a81e0e7fa5';  // Replace with actual campaign ID
// generateContract(campaignId);

const router = express.Router();

router.get('/client-form', async (req, res) => {
  const { campaign_id, signer_email, fully_managed } = req.query;

  if (!campaign_id) {
    console.log('query did not provide campaign_id');
    return res.status(400).json({ error: 'Campaign ID is required' });
  }

  // Fetch existing contract data
  const { data: existingData, error: fetchError } = await SUPABASE_CLIENT
    .from("campaigns")
    .select("id, contract_json, name")
    .eq("id", campaign_id)
    .single();

  if (fetchError) {
    console.error('Error fetching Supabase data:', fetchError.message);
    return res.status(500).json({ error: 'Failed to fetch Supabase campaign data' });
  }

  if (existingData?.contract_json && Array.isArray(existingData.contract_json) && existingData.contract_json.length > 1) {
    console.log('Returning stored contract JSON.');
    return res.json({
      embed_src: existingData.contract_json[1].embed_src,
      external_id: existingData.contract_json[1].external_id
    });
  }

  // If no stored contract, ensure signer_email is provided for generating a new one
  if (!signer_email) {
    console.log('query did not provide signer_email');
    return res.status(400).json({ error: 'Signer email is required' });
  }

  try {
    const templateId = await generateContract(campaign_id);
    if (!templateId) {
      res.status(500).json({ error: 'Error creating submission' });
    }
    const submissionData = {
      template_id: templateId,
      send_email: false,
      // external_id: campaign_id,
      order: 'preserved',
      submitters: [
        { email: signer_email, role: 'client', external_id: campaign_id },
        {
          email: process.env.AGENCY_EMAIL,
          role: 'agency',
        },
      ],
    };

    const response = await axios.post('https://api.docuseal.com/submissions', submissionData, {
      headers: { 'X-Auth-Token': API_KEY, 'content-type': 'application/json' }
    });

    const clientEmbedSrc = response.data[0].embed_src;
    const external_id = response.data[0].external_id;

    res.json({ embed_src: clientEmbedSrc, external_id });

    // Update Supabase with the contract JSON
    const { error: updateError } = await SUPABASE_CLIENT
      .from("campaigns")
      .update({ contract_json: response.data })
      .eq("id", campaign_id);

    if (updateError) console.error('Error updating Supabase:', updateError.message);

  } catch (error) {
    console.error('An error occurred while creating the submission:', error);
    console.error('Error response:', error.response?.data || error.message);

    if (!res.headersSent) {
      res.status(500).json({ error: "An error occurred during API call" });
    }
  }
});


export default router;