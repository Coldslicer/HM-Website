/*

This script creates our template
THIS SHOULD ONLY BE RUN ONCE
after running this script, you will get a document ID
configure the document ID in the contracts script in the backend
*/

const axios = require('axios');
const fs = require('fs');

import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

// Get the directory of the current script
const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env from the script's directory
config({ path: `${__dirname}/.env` });

const API_KEY = process.env.DOCUSEAL_API_KEY;
var documentId;

// Read the file synchronously and encode it to base64
const filePath = './templates/CLIENT Contract Template.pdf'; // Replace this with your file path
const fileData = fs.readFileSync(filePath, { encoding: 'base64' });

axios.post('https://api.docuseal.com/templates/pdf', {
  name: 'Client Agreement', // Template name
  file: fileData, // Pass the encoded file data here
}, {
  headers: {
    'X-Auth-Token': API_KEY,
    'Content-Type': 'application/json',
  },
}).then((response) => {
  console.log(response.data);
  documentId = response.data.documents[0].id; // Access the document ID from the response
  console.log('Document ID:', documentId);
  console.log('Template created successfully\nRemember to put the template ID in the codebase');
}).catch((error) => {
  console.error('an error occured while creating the document');
});
