import express from 'express';
import axios from 'axios';
import { DISCORD_CLIENT, SUPABASE_CLIENT } from '../util/setup.js';

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
async function getCreatorsForCampaign(campaignId, fully_managed) {
  const { data, error } = await SUPABASE_CLIENT
    .from('campaign_creators')
    .select('*')
    .eq('campaign_id', campaignId);

  if (error) {
    console.error('Error fetching creators:', error);
    return [];
  }

  if (fully_managed) {
    data.forEach((creator) => {
      creator.rate *= 1.15;
      creator.rate_cpm *= 1.15;
      creator.cpm_cap *= 1.15;
    });
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
async function uploadTemplateToDocuSeal(htmlContent, campaignId) {
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
      name: 'Campaign Contract '+campaignId, // Template name
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
async function generateContract(campaignId, fully_managed) {
  // Fetch campaign details
  const campaign = await getCampaignDetails(campaignId);
  if (!campaign) {
    return;
  }

  // Fetch creators for the campaign
  const creators = await getCreatorsForCampaign(campaignId, fully_managed);

  // Load the HTML template and decode HTML entities
  const htmlTemplate = loadHtmlTemplate();

  // Ensure that the data passed matches the placeholders in the HTML template
  const renderedHtml = ejs.render(htmlTemplate, {
    campaign: campaign,
    creators: creators
  });

  // Upload the rendered HTML to DocuSeal
  const documentId = await uploadTemplateToDocuSeal(renderedHtml,campaignId);
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
    const templateId = await generateContract(campaign_id, fully_managed);
    if (!templateId) {
      res.status(500).json({ error: 'Error creating submission' });
    }
    const submissionData = {
      template_id: templateId,
      send_email: false,
      // external_id: campaign_id,
      order: 'preserved',
      submitters: [
        {
          email: signer_email,
          role: 'client',
          external_id: campaign_id,
          fields: [
            {
              name: 'FullyManagedCampaign',
              default_value: fully_managed ? "Client has opted for Fully Managed Campaign services. Client acknowledges an additional 15% fee applies to each Influencer’s rate as reflected in the table or invoice." : "Client has not opted for Fully Managed Campaign services and agrees to manage all Influencer communications and logistics.",
              readonly: false
            },
          ]
        },
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

    res.json({ embed_src: clientEmbedSrc, external_id: campaign_id });

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

router.post('/creator-forms', async (req, res) => {
  const { campaign_id } = req.body; // Using req.body to retrieve the campaign_id

  // Validate inputs
  if (!campaign_id) {
    console.log('query did not provide campaign_id');
    return res.status(400).json({ error: 'Campaign ID is required' });
  }

  try {
    // Fetch creators who are selected for the campaign
    const { data: creatorsData, error: fetchCreatorsError } = await SUPABASE_CLIENT
      .from('campaign_creators')
      .select('id, campaign_id, channel_name, deliverables, rate, rate_cpm, channel_url, name, discord_id, webhook_url, email')
      .eq('campaign_id', campaign_id)
      .eq('selected', true); // Only selected creators

    if (fetchCreatorsError) {
      console.error('Error fetching creators data:', fetchCreatorsError.message);
      return res.status(500).json({ error: 'Failed to fetch creator data' });
    }

    // Check if creators data exists
    if (!creatorsData || creatorsData.length === 0) {
      console.log('No selected creators found for the given campaign_id');
      return res.status(400).json({ error: 'No selected creators found for the provided campaign_id' });
    }

    // Fetch campaign data using campaign_id
    const { data: campaignData, error: fetchCampaignError } = await SUPABASE_CLIENT
      .from('campaigns')
      .select('date, brief_url, company_name')
      .eq('id', campaign_id)
      .single();

    if (fetchCampaignError) {
      console.error('Error fetching campaign data:', fetchCampaignError.message);
      return res.status(500).json({ error: 'Failed to fetch campaign data' });
    }

    // Check if campaign data exists
    if (!campaignData) {
      console.log('No campaign data found for the given campaign_id');
      return res.status(400).json({ error: 'No campaign data found for the provided campaign_id' });
    }

    // Process each selected creator and submit the contract for them
    for (const creatorData of creatorsData) {
      try {
        // Prepare submission data for the creator contract
        const submissionData = {
          template_id: 772682,  // Assuming this template ID is correct for creator contracts
          send_email: false,
          external_id: creatorData.id,
          submitters: [
            {
              email: process.env.AGENCY_EMAIL,  // Assuming the agency email is used here
              role: 'agency',
              fields: [
                {
                  name: 'Handle',
                  default_value: creatorData.channel_name || 'No handle provided', // Use the creator's channel name
                },
                {
                  name: 'URL',
                  default_value: creatorData.channel_url || 'No URL provided', // Use the creator's channel URL
                },
                {
                  name: 'Brand',
                  default_value: campaignData.company_name || 'Unknown Brand',  // Use the campaign's company name
                },
                {
                  name: 'Brief',
                  default_value: campaignData.brief_url || 'No brief URL provided',  // Use the campaign's brief URL
                },
                {
                  name: 'Deliverable',
                  default_value: creatorData.deliverables || 'No deliverables specified',  // Use creator's deliverables if available
                },
                {
                  name: 'Rate',
                  default_value: (creatorData.rate || creatorData.rate_cpm || creatorData.cpm_cap
                  ? [
                      creatorData.rate ? `$${creatorData.rate} Flat` : null,
                      creatorData.rate_cpm ? `$${creatorData.rate_cpm} CPM` : null,
                      creatorData.cpm_cap ? `$${creatorData.cpm_cap} CPM Cap` : null,
                    ]
                      .filter(Boolean)
                      .join(', ')
                  : 'TBD')
                
                },
                {
                  name: 'Platform',
                  default_value: 'YouTube',  // Default to YouTube
                },
              ],
            },
            {
              email: creatorData.email,
              name: creatorData.name,
              role: 'creator',
              external_id: creatorData.id,
            },
          ],
        };

        // Make the API request to create the submission for the creator
        const response = await axios.request({
          method: 'POST',
          url: 'https://api.docuseal.com/submissions',
          headers: {
            'X-Auth-Token': API_KEY,
            'content-type': 'application/json',
          },
          data: submissionData,
        });

        // Get the embed source (link to sign)
        const embedSrc = response.data[1]?.embed_src;
        if (embedSrc) {
          // Update Supabase with the contract embed link for the creator
          const { error: updateError } = await SUPABASE_CLIENT
            .from('campaign_creators')
            .update({ contract_embed_link: embedSrc })
            .eq('id', creatorData.id);

          if (updateError) {
            console.error('Error updating Supabase with embed link:', updateError.message);
          } else {
            console.log('Supabase updated with contract embed link successfully for creator:', creatorData.id);
          }

          // If discord_id and webhook_url exist, send the Discord ping
          if (creatorData.discord_id && creatorData.webhook_url) {
            const discordMessage = {
              content: `[hidden from clients]\n<@${creatorData.discord_id}>, please review and sign the [creator contract](https://warm.hotslicer.com/creator-contract?creatorId=${creatorData.id})`,
            };

            try {
              // Send the message to the Discord webhook
              await axios.post(creatorData.webhook_url, discordMessage);
              console.log('Discord ping sent successfully for creator:', creatorData.id);
            } catch (discordError) {
              console.error('Error sending Discord ping:', discordError.message);
            }
          }

        } else {
          console.error('Failed to retrieve the contract link for creator:', creatorData.id);
        }
      } catch (error) {
        console.error('An error occurred while creating the contract for creator:', creatorData.id, error);
      }
    }

    // Send a success response
    res.json({ message: 'Contracts submitted for all selected creators successfully' });
  } catch (error) {
    console.error('An error occurred while processing the creator contracts:', error.message);
    res.status(500).json({ error: 'An error occurred during contract creation for creators' });
  }
});




export default router;