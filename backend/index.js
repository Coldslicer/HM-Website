/* ================ [ SETUP ] ================ */

import "./util/setup.js";

/* ================ [ DRIVER ] ================ */

// Imports
import express from 'express';
import cors from 'cors';
// import Stripe from "stripe";
import { SUPABASE_CLIENT, DISCORD_CLIENT } from "./util/setup.js";

// Routes
import campaignsRouter from './routes/campaigns.js';
import messagesRouter from './routes/messages.js';
import creatorsRouter from './routes/creators.js';
import contractsRouter from './routes/contracts.js';
//import paymentRouter from './routes/payment.js';

// Initialize the Express app
const APP = express();
const PORT = process.env.APP_PORT || 3000;
const HOST = '0.0.0.0';


// Middleware
APP.use(express.json()); // Parsing JSON request bodies
APP.use(cors()); // Allows CORS requests

// Apply routes

APP.use('/api/campaigns', campaignsRouter); // Route for campaigns (finalize creators, etc.)
APP.use('/api/contracts', contractsRouter); // Route for contracts
APP.use('/api/messages', messagesRouter); // Route for messaging
APP.use('/api/creators', creatorsRouter); // Route for creator data
// APP.use('/api/payment', paymentRouter); // Route for payment

APP.get('/api/', (req, res) => {
  res.json({ message: "API is working!" });
});

// Start Express server
APP.listen(PORT, HOST, () => {
  console.log(`[HM]: Server started up on http://${HOST}:${PORT}`);
});
