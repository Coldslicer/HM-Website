/* ================ [ STRIPE ] ================ */

// Imports
import express from 'express';
import Stripe from 'stripe';

// Router
const router = express.Router();

// Initialize stripe
const STRIPE = new Stripe(process.env.STRIPE_KEY);

// Post checkout session
router.post('/create-checkout-session', async (req, res) => {
  const { campaign } = req.body;

  try {
    const session = await STRIPE.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Test product'
            },
            unit_amount: 1000,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: 'http://localhost:3000/payment/success', // Redirect after successful payment
      cancel_url: 'http://localhost:3000/payment/cancel', // Redirect if user cancels
      metadata: {
        campaign_id: campaign.id
      }
    });

    res.send({ id: session.id });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

async function getAllCheckoutSessions() {
  try {
    // List all Checkout Sessions with pagination
    let sessions = [];
    let has_more = true;
    let starting_after = null;

    while (has_more) {
      const params = starting_after ? { starting_after } : {};
      const sessionList = await STRIPE.checkout.sessions.list({
        limit: 100,  // Max results per page (adjust as necessary)
        ...params
      });

      // Add the current page of sessions to the sessions array
      sessions = sessions.concat(sessionList.data);

      // Check if there are more pages of sessions
      has_more = sessionList.has_more;

      // If more pages exist, set the `starting_after` to the last session's ID
      if (has_more) {
        starting_after = sessionList.data[sessionList.data.length - 1].id;
      }
    }

    // Log the session details along with metadata
    sessions.forEach(session => {
      console.log(`Session ID: ${session.id}`);
      console.log(`Amount Total: ${session.amount_total / 100} ${session.currency.toUpperCase()}`);
      console.log(`Payment Status: ${session.payment_status}`);
      console.log(`Created: ${new Date(session.created * 1000)}`);
      
      // Log the metadata attached to the session
      console.log(`Metadata:`, session.metadata);
      console.log('---');
    });

  } catch (error) {
    console.error('Error retrieving checkout sessions:', error);
  }
}

// Call the function to log all sessions and their metadata
getAllCheckoutSessions();


export default router;