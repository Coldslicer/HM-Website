/* ================ [ SETUP ] ================ */

import "./util/setup.js";

/* ================ [ DRIVER ] ================ */

// Imports
import express from 'express';
import cors from 'cors';

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
APP.use(express.json()); // Parsing JSON request bodies
APP.use(cors()); // Allows CORS requests

/* ================ [ TEMPORARILY MISPLACED CODE ] ================ */

import Stripe from 'stripe';

APP.get('/payment/success', (req, res) => {
  res.send('<h1>Payment Successful!</h1>');
});

APP.get('/payment/cancel', (req, res) => {
  res.send('<h1>Payment Canceled</h1>');
});

const STRIPE = new Stripe(process.env.STRIPE_KEY);

APP.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;

  try {
    // Verify the webhook signature
    event = STRIPE.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    // If verification fails, return an error
    console.error('Error verifying webhook signature:', err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the payment_successful event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    // Log success message
    console.log('Payment successful for session:', session.id);
    console.log('Success: Payment completed!');
  }
  
  console.log('Received event:', event);
  
  // Respond with a 200 status to acknowledge receipt of the event
  res.status(200).send('Event received');
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
