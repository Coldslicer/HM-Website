import { config } from 'dotenv';
  
if (!process.env.PORT) {
  console.log("loading .env")

  // Load .env from the script's directory
  console.log(config());
  //config({ path: '../.env' });
  console.log("PORT: "+process.env.PORT)
}

import express from 'express';
import cors from 'cors';
import campaignsRouter from './src/routes/campaigns.js';  // Import campaign routes
import messagesRouter from './src/routes/messages.js';    // Import messages routes
import creatorsRouter from './src/routes/creators.js';    // Import creators routes
import contractsRouter from './src/routes/contracts.js';    // Import creators routes
import { discordClient } from './src/clients.js';          // Discord client

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
