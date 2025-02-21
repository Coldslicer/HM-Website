/* ================ [ SETUP ] ================ */

import "./util/setup.js";

/* ================ [ DRIVER ] ================ */

// Imports
import express from 'express';
import cors from 'cors';
import Stripe from "stripe";
import { SUPABASE_CLIENT, DISCORD_CLIENT } from "./util/setup.js";

// Routes
import campaignsRouter from './routes/campaigns.js';
import messagesRouter from './routes/messages.js';
import creatorsRouter from './routes/creators.js';
import contractsRouter from './routes/contracts.js';
import paymentRouter from './routes/payment.js';

// Initialize the Express app
const APP = express();
const PORT = process.env.APP_PORT || 3000;

// Middleware
APP.use(express.json());
APP.use(cors());

/* ================ [ TEMPORARILY MISPLACED CODE ] ================ */

const STRIPE = new Stripe(process.env.STRIPE_KEY);

APP.get('/payment/success', async (req, res) => {
  const { session_id } = req.query;

  if (!session_id) {
    return res.status(400).send('<h1>Error: Session ID not found.</h1>');
  }

  try {
    // Retrieve the Checkout Session from Stripe
    const session = await STRIPE.checkout.sessions.retrieve(session_id);

    // Check if the payment was successful
    if (session.payment_status === 'paid') {
      const campaignId = session.metadata.campaign_id;

      // Update the campaign status in Supabase
      const { data, error } = await SUPABASE_CLIENT
        .from('campaigns')
        .update({ status: 'payment_done' })
        .eq('id', campaignId);

      if (error) {
        console.error('Error updating Supabase:', error);
        return res.status(500).send('<h1>Error: Unable to update campaign status.</h1>');
      }

      console.log('Campaign status updated to "payment_done" for campaign ID:', campaignId);

      const transactionsChannel = DISCORD_CLIENT.channels.cache.get(process.env.TRANSACTIONS_CHANNEL_ID);

      if (transactionsChannel) {
        await transactionsChannel.send(`
          Payment completed!
          Transaction ID: ${session.id}
          Campaign ID: ${campaignId}
        `);
      } else {
        console.error('Transactions channel not found.');
      }
    }

    // Send a success message to the client
    res.send('<h1>Payment Successful!</h1>');
  } catch (error) {
    console.error('Error retrieving session:', error);
    res.status(500).send('<h1>Error: Unable to retrieve payment details.</h1>');
  }
});

APP.get('/payment/cancel', (req, res) => {
  res.send('<h1>Payment Canceled</h1>');
});

/* ================ [ TEMPORARILY MISPLACED CODE ] ================ */

// Apply routes

APP.use('/api/campaigns', campaignsRouter); // Route for campaigns (finalize creators, etc.)
APP.use('/api/contracts', contractsRouter); // Route for contracts
APP.use('/api/messages', messagesRouter); // Route for messaging
APP.use('/api/creators', creatorsRouter); // Route for creator data
APP.use('/api/payment', paymentRouter); // Route for payment

// Start Express server
APP.listen(PORT, () => {
  console.log(`[HM]: Server started up on http://localhost:${PORT}`);
});