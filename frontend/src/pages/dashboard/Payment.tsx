import React from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { useCampaignStore } from '../../store/campaignStore';

// Load your Stripe publishable key
const stripePromise = loadStripe('pk_test_51QsKUqPs3f7ZnFKcWtUemRUDqHyrUxGVOt2HjzTi616FBskb0TxLzFy4M8Ql8EPiqiW1yWoqOuOOnJUsl1mmPsBW00prSLK3ol');

const Payment: React.FC = () => {
  const { currentCampaign } = useCampaignStore();

  const handleClick = async () => {
    if (!currentCampaign) {
      console.error('No campaign selected.');
      return;
    }

    // Step 1: Create a Checkout Session on the server
    const { id } = await fetch('http://localhost:3000/api/payment/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        campaign: { id: currentCampaign.id }, // Pass the currentCampaign.id here
      }),
    }).then((res) => res.json());

    // Step 2: Redirect to Stripe Checkout
    const stripe = await stripePromise;

    if (!stripe) {
      console.error('Stripe has not loaded.');
      return;
    }

    const { error } = await stripe.redirectToCheckout({ sessionId: id });

    if (error) {
      console.error(error);
    }
  };

  // Check if the campaign status is "contract_signed"
  if (currentCampaign?.status !== 'contract_signed') {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Payment Unavailable</h1>
        <p className="text-red-500">The contract hasn't been signed yet.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Pay for Dummy Product</h1>
      <button
        onClick={handleClick}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Pay $10.00
      </button>
    </div>
  );
};

export default Payment;