import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import ejs from 'ejs';
import { config } from 'dotenv';
import axios from 'axios';
import he from 'he';  // Import the 'he' library for decoding HTML entities

// Load .env from the script's directory
config();

// Supabase setup
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const DOCUSEAL_API_KEY = process.env.DOCUSEAL_API_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Function to get campaign details from Supabase
async function getCampaignDetails(campaignId) {
  const { data, error } = await supabase
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
  const { data, error } = await supabase
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
function loadHtmlTemplate(templatePath = 'templates/CAMPAIGNCONTRACTWITHFIELDS.html') {
  try {
    const template = fs.readFileSync(path.resolve(templatePath), 'utf-8');
    
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
        'X-Auth-Token': DOCUSEAL_API_KEY,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('Template uploaded successfully:', response.data);
    return response.data.documents[0].id; // Get the document ID from the response
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
}

// Example usage
const campaignId = 'd4b0873d-19d7-48ae-83d5-31a81e0e7fa5';  // Replace with actual campaign ID
generateContract(campaignId);
