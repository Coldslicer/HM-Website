const axios = require('axios');

import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

// Get the directory of the current script
const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env from the script's directory
config({ path: `${__dirname}/.env` });

const API_KEY = process.env.DOCUSEAL_API_KEY;

async function run() {
  //const { campaign_id, signer_email } = req.params;
  const signer_email = 'sharvil@hotslicer.com';
  const submissionData = {
    template_id: 528118,
    send_email: false,
    submitters: [
      {
        email: 'sharvil@hotslicer.com',
        role: 'agency',
        fields: [
            {
              name: 'Creators',
              default_value: 'If this shows up, prefill is working',
            },
          ]
      },
      {
        email: signer_email,
        role: 'client'
      }
    ]
  };

  const response = await axios.request({
    method: 'POST',
    url: 'https://api.docuseal.com/submissions',
    headers: {
      'X-Auth-Token': API_KEY,
      'content-type': 'application/json'
    },
    data: submissionData
  }).then((response) => {
    console.log(response.data);
    const slug = response.data[0].slug; // Extracting the slug from the response
    console.log({ slug }); // Sending the slug in the response
  }).catch((error) => {
    console.error('an error occured while creating the submission');
  });
}

run();