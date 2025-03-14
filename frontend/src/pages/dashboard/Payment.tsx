/* ================ [ IMPORTS ] ================ */

import axios from 'axios';
import { useEffect, useState } from 'react';
import { SUPABASE_CLIENT } from '../../lib/supabase';
import { formatNum } from '../../lib/utility';
import { useCampaignStore } from '../../store/campaignStore';

/* ================ [ PAYMENT ] ================ */

// Payment component
const Payment = () => {

  // Grab current campaign
  const { currentCampaign } = useCampaignStore();

  // State variables
  const [email, setEmail] = useState('');
  const [creators, setCreators] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSubmitted, setEmailSubmitted] = useState(false);

  // Handle campaign change
  useEffect(() => {
    if (currentCampaign?.status === 'contract_signed') {
      checkEmail();
      fetchCreators();
    }
  }, [currentCampaign]);

  // Check if an email is already in supabase
  const checkEmail = async () => {
    try {
      const { data, error } = await SUPABASE_CLIENT
        .from('campaigns')
        .select('payment_email')
        .eq('id', currentCampaign?.id)
        .single();

      if (error) throw error;

      if (data.payment_email) {
        setEmail(data.payment_email);
        setEmailSubmitted(true);
      }
    } catch (error) {
      console.error('Error checking for email:', error);
    }
  };

  // Fetch creators for the current campaign
  const fetchCreators = async () => {
    try {
      const response = await axios.post('/api/payment/get-creators', {
        campaign_id: currentCampaign?.id
      });

      setCreators(response.data || []);
    } catch (error) {
      if (axios.isAxiosError(error)) console.error('Error fetching creators:', error.response?.data || error.message);
      else console.error('Unexpected error:', error);

      setCreators([]);
    }
  };

  // Submit an email to supabase
  const submitEmail = async () => {
    if (!email) {
      alert('Please enter a valid email address.');
      return;
    }

    // Begin loading state
    setEmailLoading(true);

    try {
      const { error } = await SUPABASE_CLIENT
        .from('campaigns')
        .update({ payment_email: email })
        .eq('id', currentCampaign?.id);

      if (error) throw error;

      alert('Email updated successfully!');
      setEmailSubmitted(true);
    } catch (error) {
      console.error('Error updating email:', error);
      alert('Email update failed.');
    }

    // Exit loading state
    setEmailLoading(false);
  };

  // Handle payment for a creator
  const handlePayment = async (creatorId: string, type: 'flat' | 'cpm') => {
    // Begin loading state
    setLoading(true);
    
    try {
      await axios.post('/api/payment/initiate-payment', {
        creator_id: creatorId,
        type,
      });

      // Update creators with payment status
      const updatedCreators = creators.map((creator) =>
        creator.id === creatorId ? { ...creator, [`${type}_paid`]: true } : creator
      );
      setCreators(updatedCreators);

      alert(`${type === 'flat' ? 'Flat' : 'CPM'} payment initiated!`);
    } catch (error) {
      console.error('Payment error:', error);
      alert(`Failed to process payment.`);
    }
    
    // Exit loading state
    setLoading(false);
  };

  // Check for contract status
  if (currentCampaign?.status !== 'contract_signed') {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Payment Unavailable</h1>
        <p className="text-red-500">Please sign the contract before proceeding.</p>
      </div>
    );
  }

  // Payment page
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Payment</h1>

      {/* Submit Email */}
      {!emailSubmitted && (
        <div className="mb-8">
          <label className="block text-sm font-medium mb-2">Invoice Recipient:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border p-2 rounded w-full max-w-md"
            placeholder="Enter email address"
          />
          <button
            onClick={submitEmail}
            disabled={emailLoading}
            className="bg-blue-500 text-white px-4 py-2 rounded mt-2 hover:bg-blue-600"
          >
            {emailLoading ? 'Submitting...' : 'Submit Email'}
          </button>
        </div>
      )}

      {/* Creator Table */}
      {creators.length > 0 && (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-3 px-4 text-left">Creator Name</th>
                  <th className="py-3 px-4 text-center">Flat Rate</th>
                  <th className="py-3 px-4 text-center">CPM Rate</th>
                  <th className="py-3 px-4 text-center">CPM Due</th>
                  <th className="py-3 px-4 text-center">Pay Invoice</th>
                </tr>
              </thead>
              <tbody>
                {creators.map((creator) => (
                  <tr key={creator.id} className="border-b">
                    <td className="py-3 px-4 text-left">{creator.channel_name}</td>
                    <td className="py-3 px-4 text-center">
                      {creator.flat_paid ? (
                        <s>${formatNum(creator.rate)}</s>
                      ) : (
                        `$${formatNum(creator.rate)}`
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {creator.cpm_paid ? (
                        <s>${formatNum(creator.rate_cpm)}</s>
                      ) : (
                        `$${formatNum(creator.rate_cpm)}`
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">N/A</td>
                    <td className="py-3 px-4 text-center">
                      {!emailSubmitted ? (
                        <span className="text-gray-400">Enter a recipient</span>
                      ) : !creator.final_approved ? (
                        <span className="text-gray-400">Pending Approval</span>
                      ) : (
                        <>
                          {!creator.flat_paid && creator.rate > 0 && (
                            <button
                              onClick={() => handlePayment(creator.id, 'flat')}
                              disabled={loading}
                              className="bg-green-500 text-white px-3 py-1 rounded mr-2 hover:bg-green-600"
                            >
                              Pay Flat
                            </button>
                          )}
                          {!creator.cpm_paid && creator.rate_cpm > 0 && (
                            <button
                              onClick={() => handlePayment(creator.id, 'cpm')}
                              disabled={loading}
                              className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                            >
                              Pay CPM
                            </button>
                          )}
                          {(creator.flat_paid || creator.cpm_paid) && (
                            <span className="text-gray-500">Payment Pending</span>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-sm text-gray-500 mt-4">
            *Payment buttons will not appear until a creator's final draft has been approved.
          </p>
        </>
      )}

      {/* Change Email */}
      {emailSubmitted && (
        <div className="mt-8">
          <label className="block text-sm font-medium mb-2">Change Invoice Recipient:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border p-2 rounded w-full max-w-md"
            placeholder="Enter new email address"
          />
          <button
            onClick={submitEmail}
            disabled={emailLoading}
            className="bg-blue-500 text-white px-4 py-2 rounded mt-2 hover:bg-blue-600"
          >
            {emailLoading ? 'Updating...' : 'Update Email'}
          </button>
        </div>
      )}
    </div>
  );
};

/* ================ [ EXPORTS ] ================ */

export default Payment;