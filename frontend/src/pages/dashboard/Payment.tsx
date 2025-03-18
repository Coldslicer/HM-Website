/* ================ [ IMPORTS ] ================ */

import axios from 'axios';
import { useEffect, useState } from 'react';
import { SUPABASE_CLIENT } from '../../lib/supabase';
import { formatNum } from '../../lib/utility';
import { useCampaignStore } from '../../store/campaignStore';

/* ================ [ PAYMENT ] ================ */

const Payment = () => {
  const { currentCampaign } = useCampaignStore();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [creators, setCreators] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);

  useEffect(() => {
    if (currentCampaign?.status === 'contract_signed') {
      checkForm();
      fetchCreators();
    }
  }, [currentCampaign]);

  const checkEmail = async () => {
    try {
      const { data } = await SUPABASE_CLIENT
        .from('campaigns')
        .select('payment_email, company_phone, company_address')
        .eq('id', currentCampaign?.id)
        .single();

      if (data?.payment_email) {
        setEmail(data.payment_email);
        setAddress(data.company_address);
        setPhone(data.company_phone);
        setFormSubmitted(true);
      }
    } catch (error) {
      console.error('Error checking email:', error);
    }
  };

  const fetchCreators = async () => {
    try {
      const response = await axios.post('/api/payment/get-creators', {
        campaign_id: currentCampaign?.id
      });

      const sortedCreators = (response.data || []).sort((a: { channel_name: string; }, b: { channel_name: string; }) => 
        a.channel_name.localeCompare(b.channel_name)
      );
      setCreators(sortedCreators);
    } catch (error) {
      console.error('Error fetching creators:', error);
      setCreators([]);
    }
  };

  const submitEmail = async () => {
    if (!email) {
      alert('Invalid entry: missing: '+[email,phone,address].filter((v) => (v != '')));
      return;
    }

    setEmailLoading(true);
    try {
      const { error } = await SUPABASE_CLIENT
        .from('campaigns')
        .update({ payment_email: email })
        .eq('id', currentCampaign?.id);

      if (!error) {
        setEmailSubmitted(true);
        alert('Email updated successfully!');
      }
    } catch (error) {
      alert('Email update failed.');
    }
    setEmailLoading(false);
  };

  const handlePayment = async (creatorId: string, type: 'flat' | 'cpm') => {
    setLoading(true);
    try {
      await axios.post('/api/payment/initiate-payment', {
        creator_id: creatorId,
        type,
      });

      const updatedCreators = creators.map(creator =>
        creator.id === creatorId ? { ...creator, [`${type}_emailed`]: true } : creator
      );
      setCreators(updatedCreators);
      alert(`${type === 'flat' ? 'Flat' : 'CPM'} payment initiated!`);
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed');
    }
    setLoading(false);
  };

  const getCpmDueDate = (liveSubmitted: string) => {
    if (!liveSubmitted) return 'N/A';
    const dueDate = new Date(liveSubmitted);
    dueDate.setDate(dueDate.getDate() + 30);
    return dueDate.toLocaleDateString('en-US');
  };

  if (currentCampaign?.status !== 'contract_signed') {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Payment Unavailable</h1>
        <p className="text-red-500">Please sign the contract before proceeding.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Payment</h1>

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

      {creators.length > 0 && (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-3 px-4 text-left">Creator Name</th>
                  <th className="py-3 px-4 text-center">Flat Rate</th>
                  <th className="py-3 px-4 text-center">CPM Rate</th>
                  <th className="py-3 px-4 text-center">CPM Opens</th>
                  <th className="py-3 px-4 text-center">Pay Invoice</th>
                </tr>
              </thead>
              <tbody>
                {creators.map((creator) => {
                  const cpmDueDate = new Date(creator.live_submitted);
                  cpmDueDate.setDate(cpmDueDate.getDate() + 30);
                  const cpmAvailable = creator.live_submitted && Date.now() > cpmDueDate.getTime();

                  return (
                    <tr key={creator.id} className="border-b">
                      <td className="py-3 px-4 text-left">{creator.channel_name}</td>
                      <td className="py-3 px-4 text-center">
                        {creator.flat_paid ? (
                          <s className="text-green-500">${formatNum(creator.rate)}</s>
                        ) : creator.flat_emailed ? (
                          <s>${formatNum(creator.rate)}</s>
                        ) : (
                          `$${formatNum(creator.rate)}`
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {creator.cpm_paid ? (
                          <s className="text-green-500">${formatNum(creator.rate_cpm)}</s>
                        ) : creator.cpm_emailed ? (
                          <s>${formatNum(creator.rate_cpm)}</s>
                        ) : (
                          `$${formatNum(creator.rate_cpm)}`
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {getCpmDueDate(creator.live_submitted)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {!emailSubmitted ? (
                          <span className="text-gray-400">Enter recipient email</span>
                        ) : !creator.final_approved ? (
                          <span className="text-gray-400">Pending Approval</span>
                        ) : (
                          <div className="flex flex-col gap-2 items-center">
                            {!creator.flat_emailed && creator.rate > 0 && (
                              <button
                                onClick={() => handlePayment(creator.id, 'flat')}
                                disabled={loading}
                                className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 w-fit"
                              >
                                Pay Flat
                              </button>
                            )}
                            {!creator.cpm_emailed && creator.rate_cpm > 0 && (
                              <>
                                {cpmAvailable ? (
                                  <button
                                    onClick={() => handlePayment(creator.id, 'cpm')}
                                    disabled={loading}
                                    className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 w-fit"
                                  >
                                    Pay CPM
                                  </button>
                                ) : (
                                  <span className="text-gray-400">CPM Unavailable</span>
                                )}
                              </>
                            )}
                            {(creator.flat_emailed || creator.cpm_emailed) && (
                              <>
                                {creator.flat_emailed && !creator.flat_paid && (
                                  <span className="text-gray-400">Flat Pending</span>
                                )}
                                {creator.cpm_emailed && !creator.cpm_paid && (
                                  <span className="text-gray-400">CPM Pending</span>
                                )}
                              </>
                            )}
                            {(creator.flat_paid || creator.cpm_paid) && (
                              <>
                                {creator.flat_paid && (
                                  <span className="text-green-500">Flat Complete</span>
                                )}
                                {creator.cpm_paid && (
                                  <span className="text-green-500">CPM Complete</span>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="text-sm text-gray-500 mt-4">
            *Payment buttons will not appear until a creator's final draft has been approved.
          </p>
        </>
      )}

      {emailSubmitted && (
        <div className="mt-8">
        <label className="block text-sm font-medium mb-2">Change Invoice Recipient:</label>
      
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border p-2 rounded w-full max-w-md"
          placeholder="Enter new email address"
          required
        />
      
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="border p-2 rounded w-full max-w-md mt-2"
          placeholder="Enter phone number"
          required
        />
      
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="border p-2 rounded w-full max-w-md mt-2"
          placeholder="Enter address"
          required
        />
      
        <button
          onClick={submitForm}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded mt-2 hover:bg-blue-600"
        >
          {loading ? 'Updating...' : 'Update Recipient'}
        </button>
      </div>
      
      )}
    </div>
  );
};

/* ================ [ EXPORTS ] ================ */

export default Payment;