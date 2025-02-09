// server.js
import dotenv from 'dotenv';
dotenv.config(); 
import express from 'express';
import cors from 'cors';
import campaignsRouter from './src/routes/campaigns.js';  // Import campaign routes
import messagesRouter from './src/routes/messages.js';    // Import messages routes
import creatorsRouter from './src/routes/creators.js';    // Import creators routes
import contractsRouter from './src/routes/contracts.js';    // Import creators routes
import { discordClient } from './src/clients.js';          // Discord client

import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

// Get the directory of the current script
const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env from the script's directory
config({ path: `${__dirname}/.env` });

// Initialize the Express app
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());   // For parsing JSON request bodies
app.use(cors());           // To allow CORS requests

// Route imports
app.use('/api/campaigns', campaignsRouter);   // Route for campaigns (finalize creators, etc.)
app.use('/api/contracts', contractsRouter);     // Route for contracts
app.use('/api/messages', messagesRouter);     // Route for sending messages
app.use('/api/creators', creatorsRouter);     // Route for creator data

// Start the Express server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
