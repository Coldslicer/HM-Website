/* ================ [ IMPORTS ] ================ */

import axios from "axios";
import { useEffect, useState } from "react";
import { SUPABASE_CLIENT } from "../../lib/supabase";
import { formatNum } from "../../lib/utility";
import { useCampaignStore } from "../../store/campaignStore";

/* ================ [ PAYMENT ] ================ */

// Payment component
const Payment = () => {
  // Grab current campaign
  const { currentCampaign } = useCampaignStore();

  // State variables
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [creators, setCreators] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);

  // Calculate CPM opens date
  const calculateCpmOpensDate = (liveSubmitted: string) => {
    if (!liveSubmitted) return "N/A";
    const date = new Date(liveSubmitted);
    date.setDate(date.getDate() + 30);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Handle campaign change
  useEffect(() => {
    if (currentCampaign?.status === "contract_signed") {
      checkForm();
      fetchCreators();
    }
  }, [currentCampaign]);

  // Check if an email is already in supabase
  const checkForm = async () => {
    try {
      const { data, error } = await SUPABASE_CLIENT.from("campaigns")
        .select("payment_email, company_phone, company_address")
        .eq("id", currentCampaign?.id)
        .single();

      if (error) throw error;

      if (data.payment_email && data.company_address && data.company_phone) {
        setEmail(data.payment_email);
        setAddress(data.company_address);
        setPhone(data.company_phone);
        setFormSubmitted(true);
      }
    } catch (error) {
      console.error("Error checking for email:", error);
    }
  };

  // Fetch creators for the current campaign
  const fetchCreators = async () => {
    try {
      const response = await axios.post("/api/payment/get-creators", {
        campaign_id: currentCampaign?.id,
      });

      // Sort creators by name
      const sortedCreators = (
        (response.data as { channel_name: string }[]) || []
      ).sort((a, b) => a.channel_name.localeCompare(b.channel_name));

      setCreators(sortedCreators);
    } catch (error) {
      if (axios.isAxiosError(error))
        console.error(
          "Error fetching creators:",
          error.response?.data || error.message
        );
      else console.error("Unexpected error:", error);

      setCreators([]);
    }
  };

  // Submit an email to supabase
  const submitForm = async () => {
    if (!email || !phone || !address) {
      alert("Please fill in all required fields");
      return;
    }

    // Begin loading state
    setFormLoading(true);

    try {
      const { error } = await SUPABASE_CLIENT.from("campaigns")
        .update({
          payment_email: email,
          company_phone: phone,
          company_address: address,
        })
        .eq("id", currentCampaign?.id);

      if (error) throw error;

      alert("Details updated successfully!");
      setFormSubmitted(true);
    } catch (error) {
      console.error("Error updating details:", error);
      alert("Update failed.");
    }

    // Exit loading state
    setFormLoading(false);
  };

  // Handle payment for a creator
  const handlePayment = async (creatorId: string, type: "flat" | "cpm") => {
    // Begin loading state
    setLoading(true);

    try {
      await axios.post("/api/payment/initiate-payment", {
        creator_id: creatorId,
        type,
      });

      // Update creators with payment status
      const updatedCreators = creators.map((creator) =>
        creator.id === creatorId
          ? { ...creator, [`${type}_emailed`]: true }
          : creator
      );
      setCreators(updatedCreators);

      alert(`${type === "flat" ? "Flat" : "CPM"} payment initiated!`);
    } catch (error) {
      console.error("Payment error:", error);
      alert(`Failed to process payment.`);
    }

    // Exit loading state
    setLoading(false);
  };

  // Check for contract status
  if (currentCampaign?.status !== "contract_signed") {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Payment Unavailable</h1>
        <p className="text-red-500">
          Please sign the contract before proceeding.
        </p>
      </div>
    );
  }

  // Payment page
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Payment</h1>

      {/* Submit Details */}
      {!formSubmitted && (
        <div className="mt-8">
          <label className="block text-sm font-medium mb-2">
            Enter Payment Details:
          </label>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border p-2 rounded w-full max-w-md"
            placeholder="Invoice recipient email"
            required
          />

          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="border p-2 rounded w-full max-w-md mt-2"
            placeholder="Company phone number"
            required
          />

          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="border p-2 rounded w-full max-w-md mt-2"
            placeholder="Company address"
            required
          />

          <button
            onClick={submitForm}
            disabled={formLoading}
            className="bg-blue-500 text-white px-4 py-2 rounded mt-2 hover:bg-blue-600"
          >
            {formLoading ? "Saving..." : "Save Details"}
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
                  <th className="py-3 px-4 text-center">CPM Opens</th>
                  <th className="py-3 px-4 text-center">Pay Invoice</th>
                </tr>
              </thead>
              <tbody>
                {creators.map((creator) => (
                  <tr key={creator.id} className="border-b">
                    <td className="py-3 px-4 text-left">
                      {creator.channel_name}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {creator.flat_paid ? (
                        <s className="text-green-500">
                          ${formatNum(creator.rate)}
                        </s>
                      ) : creator.flat_emailed ? (
                        <s>${formatNum(creator.rate)}</s>
                      ) : (
                        `$${formatNum(creator.rate)}`
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {creator.cpm_paid ? (
                        <s className="text-green-500">
                          ${formatNum(creator.rate_cpm)}
                        </s>
                      ) : creator.cpm_emailed ? (
                        <s>${formatNum(creator.rate_cpm)}</s>
                      ) : (
                        `$${formatNum(creator.rate_cpm)}`
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {calculateCpmOpensDate(creator.live_submitted)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {!formSubmitted ? (
                        <span className="text-gray-400">
                          Complete details above
                        </span>
                      ) : !creator.final_approved ? (
                        <span className="text-gray-400">Pending Approval</span>
                      ) : (
                        <div className="flex flex-col gap-2 items-center">
                          {!creator.flat_emailed && creator.rate > 0 && (
                            <button
                              onClick={() => handlePayment(creator.id, "flat")}
                              disabled={loading}
                              className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 w-fit"
                            >
                              Pay Flat
                            </button>
                          )}
                          {!creator.cpm_emailed && creator.rate_cpm > 0 && (
                            <button
                              onClick={() => handlePayment(creator.id, "cpm")}
                              disabled={loading}
                              className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 w-fit"
                            >
                              Pay CPM
                            </button>
                          )}
                          {creator.flat_emailed && !creator.flat_paid && (
                            <span className="text-gray-400">Flat Pending</span>
                          )}
                          {creator.cpm_emailed && !creator.cpm_paid && (
                            <span className="text-gray-400">CPM Pending</span>
                          )}
                          {creator.flat_paid && (
                            <span className="text-green-500">
                              Flat Complete
                            </span>
                          )}
                          {creator.cpm_paid && (
                            <span className="text-green-500">CPM Complete</span>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-sm text-gray-500 mt-4">
            *Payment buttons will not appear until a creator's final draft has
            been approved.
          </p>
        </>
      )}

      {/* Update Details */}
      {formSubmitted && (
        <div className="mt-8">
          <label className="block text-sm font-medium mb-2">
            Update Payment Details:
          </label>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border p-2 rounded w-full max-w-md"
            placeholder="New invoice email"
            required
          />

          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="border p-2 rounded w-full max-w-md mt-2"
            placeholder="New phone number"
            required
          />

          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="border p-2 rounded w-full max-w-md mt-2"
            placeholder="New address"
            required
          />

          <button
            onClick={submitForm}
            disabled={formLoading}
            className="bg-blue-500 text-white px-4 py-2 rounded mt-2 hover:bg-blue-600"
          >
            {formLoading ? "Updating..." : "Update Details"}
          </button>
        </div>
      )}
    </div>
  );
};

/* ================ [ EXPORTS ] ================ */

export default Payment;
