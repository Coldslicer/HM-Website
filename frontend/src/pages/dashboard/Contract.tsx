import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useCampaignStore } from '../../store/campaignStore';
import { DocusealForm } from '@docuseal/react'
import { SUPABASE_CLIENT } from '../../lib/supabase';


export const Contract = () => {
  const { currentCampaign } = useCampaignStore();

  if (currentCampaign?.status != 'creators_selected' && currentCampaign?.status != 'contract_signed') {
    return (
      <div className="max-w-screen-xl mx-auto p-4 bg-gray-50 rounded-md">
        <h2 className="text-2xl font-bold text-black">Contract</h2>
        <p className="text-black">This feature is not currently available to you<br/>contact support if you think this is a mistake</p>
      </div>
    );
  }

  const [email, setEmail] = useState('');
  const [responseData, setResponseData] = useState(null);
  const [error, setError] = useState(null);


  const fetchCurrent = async () => {
    try {
        const response = await axios.get('/api/contracts/client-form', {
            params: { campaign_id: currentCampaign?.id, signer_email: email }
        });
        setResponseData(response.data);
    } catch (error) {
        return;
    }
  };
  
  useEffect(() => {
    fetchCurrent();
  },[currentCampaign]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null); // Clear any previous errors before making the request
    try {
      const response = await axios.get('/api/contracts/client-form', {
        params: { campaign_id: currentCampaign?.id, signer_email: email }
      });
      setResponseData(response.data);
      setError(null); // Clear any errors on successful response
    } catch (error) {
      console.error('Error initializing client form:', error);
      setError('Failed to initialize client form');
    }
  };

  return ( responseData != null ?
    <div className="bg-white h-5">
    <DocusealForm
        src={responseData.embed_src}
        withTitle={false}
        externalId={responseData.external_id || null}
        onComplete={async (data) => {
            await axios.post('/api/campaigns/setup-discord', {
                campaignId: currentCampaign.id,
            });
            currentCampaign.status = 'contract_signed';
            SUPABASE_CLIENT.from('campaigns').update({ status: 'contract_signed' }).eq('id', currentCampaign.id);
              
        }}
    />
    </div>
  :
    <div className="max-w-screen-xl mx-auto p-4 bg-gray-100 rounded-md">
      <h2 className="text-2xl font-bold text-black mb-6">Initialize Client Form</h2>
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="mb-4">
          <label className="block text-black mb-2" htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 rounded-md"
          />
        </div>
        <button type="submit" className="bg-blue-500 text-black p-2 rounded-md">Submit</button>
      </form>
      {error && <div className="text-black">{error}</div>}
    </div>);
};

export default Contract;