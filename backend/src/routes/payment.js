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
  try {
    const session = await STRIPE.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Dummy Product',
            },
            unit_amount: 1000,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: 'http://localhost:3000/payment/success', // Redirect after successful payment
      cancel_url: 'http://localhost:3000/payment/cancel', // Redirect if user cancels
    });

    res.send({ id: session.id });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

export default router;