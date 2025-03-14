import React, { useState, useEffect } from 'react';
import { useCampaignStore } from '../../store/campaignStore';
import axios from 'axios';
import { SUPABASE_CLIENT } from '../../lib/supabase';

const Payment: React.FC = () => {
  const { currentCampaign } = useCampaignStore();
  const [paymentEmail, setPaymentEmail] = useState('');
  const [creators, setCreators] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [showEmailInput, setShowEmailInput] = useState(true);

  useEffect(() => {
    if (currentCampaign?.status === 'contract_signed') {
      checkPaymentEmail();
      fetchCreators();
    }
  }, [currentCampaign]);

  // Check if payment_email is already set in Supabase
  const checkPaymentEmail = async () => {
    try {
      const { data, error } = await SUPABASE_CLIENT
        .from('campaigns')
        .select('payment_email')
        .eq('id', currentCampaign.id)
        .single();

      if (error) throw error;

      if (data.payment_email) {
        setPaymentEmail(data.payment_email);
        setShowEmailInput(false); // Hide the email input if payment_email is already set
      }
    } catch (error) {
      console.error('Error checking payment email:', error);
    }
  };

  const fetchCreators = async () => {
    try {
      console.log('Fetching creators for campaign ID:', currentCampaign.id);
      const response = await axios.post('/api/payment/get-creators', {
        campaign_id: currentCampaign.id,
      });
      console.log('Creators data:', response.data);
      setCreators(response.data || []);
    } catch (error) {
      console.error('Error fetching creators:', error.response?.data || error.message);
      setCreators([]);
    }
  };

  const handleEmailSubmit = async () => {
    if (!paymentEmail) {
      alert('Please enter a valid email address.');
      return;
    }

    setEmailLoading(true);
    try {
      const { error } = await SUPABASE_CLIENT
        .from('campaigns')
        .update({ payment_email: paymentEmail })
        .eq('id', currentCampaign.id);

      if (error) throw error;
      alert('Payment email updated successfully!');
      setShowEmailInput(false); // Hide the email input after submission
    } catch (error) {
      console.error('Error updating email:', error);
      alert('Failed to update payment email.');
    }
    setEmailLoading(false);
  };

  const handlePayment = async (creatorId: string, type: 'flat' | 'cpm') => {
    setIsLoading(true);
    try {
      await axios.post('/api/payment/initiate-payment', {
        creator_id: creatorId,
        type,
      });
      const updatedCreators = creators.map((creator) =>
        creator.id === creatorId ? { ...creator, [`${type}_paid`]: true } : creator
      );
      setCreators(updatedCreators);
      alert(`${type === 'flat' ? 'Flat' : 'CPM'} payment initiated!`);
    } catch (error) {
      console.error('Payment error:', error);
      alert(`Failed to process ${type} payment.`);
    }
    setIsLoading(false);
  };

  // Format numbers with commas
  const formatNumber = (num: number) => {
    return num?.toLocaleString() || '0';
  };

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
      <h1 className="text-2xl font-bold mb-4">Payment</h1>

      {/* Invoice Recipient Email Input */}
      {showEmailInput && (
        <div className="mb-8">
          <label className="block text-sm font-medium mb-2">Invoice Recipient:</label>
          <input
            type="email"
            value={paymentEmail}
            onChange={(e) => setPaymentEmail(e.target.value)}
            className="border p-2 rounded w-full max-w-md"
            placeholder="Enter email address"
          />
          <button
            onClick={handleEmailSubmit}
            disabled={emailLoading}
            className="bg-blue-500 text-white px-4 py-2 rounded mt-2 hover:bg-blue-600"
          >
            {emailLoading ? 'Updating...' : 'Submit Email'}
          </button>
        </div>
      )}

      {/* Creators Table */}
      {creators.length > 0 && (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-3 px-4 text-left">Creator Name</th>
                  <th className="py-3 px-4 text-right">Flat Rate</th>
                  <th className="py-3 px-4 text-right">CPM Rate</th>
                  <th className="py-3 px-4 text-right">CPM Due</th>
                  <th className="py-3 px-4 text-center">Pay Invoice</th>
                </tr>
              </thead>
              <tbody>
                {creators.map((creator) => (
                  <tr key={creator.id} className="border-b">
                    <td className="py-3 px-4">{creator.channel_name}</td>
                    <td className="py-3 px-4 text-right">
                      {creator.flat_paid ? (
                        <s>${formatNumber(creator.rate)}</s>
                      ) : (
                        `$${formatNumber(creator.rate)}`
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {creator.cpm_paid ? (
                        <s>${formatNumber(creator.rate_cpm)}</s>
                      ) : (
                        `$${formatNumber(creator.rate_cpm)}`
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">N/A</td>
                    <td className="py-3 px-4 text-center">
                      {!creator.final_approved ? (
                        <span className="text-gray-400">Pending Approval</span>
                      ) : (
                        <>
                          {!creator.flat_paid && creator.rate > 0 && (
                            <button
                              onClick={() => handlePayment(creator.id, 'flat')}
                              disabled={isLoading}
                              className="bg-green-500 text-white px-3 py-1 rounded mr-2 hover:bg-green-600"
                            >
                              Pay Flat
                            </button>
                          )}
                          {!creator.cpm_paid && creator.rate_cpm > 0 && (
                            <button
                              onClick={() => handlePayment(creator.id, 'cpm')}
                              disabled={isLoading}
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

      {/* Change Invoice Recipient */}
      {!showEmailInput && (
        <div className="mt-8">
          <label className="block text-sm font-medium mb-2">Change Invoice Recipient:</label>
          <input
            type="email"
            value={paymentEmail}
            onChange={(e) => setPaymentEmail(e.target.value)}
            className="border p-2 rounded w-full max-w-md"
            placeholder="Enter new email address"
          />
          <button
            onClick={handleEmailSubmit}
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

export default Payment;