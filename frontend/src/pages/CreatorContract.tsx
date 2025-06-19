import React, { useEffect, useState } from "react";
import { DocusealForm } from "@docuseal/react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export const CreatorContract = () => {
  const navigate = useNavigate();
  const [creatorId, setCreatorId] = useState(null);
  const [embedLink, setEmbedLink] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCreatorData = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const creatorIdParam = urlParams.get("creatorId");
      console.log("loading form " + creatorIdParam);

      if (!creatorIdParam) {
        setError("Creator ID is required");
        return;
      }

      setCreatorId(creatorIdParam);

      // Fetch the embed link for the creator from Supabase
      const { data, error } = await supabase.from("campaign_creators")
        .select("contract_embed_link")
        .eq("id", creatorIdParam)
        .single();

      if (error) {
        setError("Error fetching creator data");
        return;
      }

      if (data) {
        setEmbedLink(data.contract_embed_link);
      } else {
        setError("No creator data found");
      }
    };

    fetchCreatorData();
  }, []);

  const handleContractCompletion = async () => {
    if (!creatorId) {
      setError("No creator ID provided");
      return;
    }

    try {
      // Mark the creator's contract as signed in Supabase
      const { error } = await supabase.from("campaign_creators")
        .update({ contract_signed: true })
        .eq("id", creatorId);

      if (error) {
        setError("Failed to update contract status");
        return;
      }

      // Optionally, notify the user that the contract has been signed
      alert("Contract signed successfully!");
    } catch (error) {
      console.error("Error completing contract:", error);
      setError("An error occurred while completing the contract");
    }
  };

  if (error) {
    return (
      <div className="max-w-screen-xl mx-auto p-4 bg-red-50 rounded-md">
        <h2 className="text-2xl font-bold text-black">Error</h2>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto p-4 bg-gray-100 rounded-md">
      <h2 className="text-2xl font-bold text-black mb-6">Creator Contract</h2>

      {embedLink ? (
        <div className="bg-white h-[800px] max-h-[80vh] overflow-auto border rounded-md shadow-md">
          <DocusealForm
            src={embedLink}
            withTitle={false}
            externalId={creatorId}
            onComplete={handleContractCompletion} // Trigger the update after contract completion
          />
        </div>
      ) : (
        <div className="bg-gray-200 h-[800px] max-h-[80vh] flex items-center justify-center border rounded-md shadow-md">
          <p className="text-gray-600 text-lg">Loading contract form...</p>
        </div>
      )}
    </div>
  );
};

export default CreatorContract;
