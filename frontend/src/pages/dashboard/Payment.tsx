/* ================ [ IMPORTS ] ================ */

import axios from "axios";
import { useEffect, useState } from "react";
import { SUPABASE_CLIENT } from "../../lib/supabase";
import { formatNum } from "../../lib/utility";
import { useCampaignStore } from "../../store/campaignStore";

/* ================ [ PAYMENT ] ================ */

const Payment = () => {
  const { currentCampaign } = useCampaignStore();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [creators, setCreators] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);

  useEffect(() => {
    if (currentCampaign?.status === "contract_signed") {
      checkForm();
      fetchCreators();
    }
  }, [currentCampaign]);

  const checkForm = async () => {
    try {
      const { data } = await SUPABASE_CLIENT.from("campaigns")
        .select("payment_email, company_phone, company_address")
        .eq("id", currentCampaign?.id)
        .single();

      if (data?.payment_email) {
        setEmail(data.payment_email);
        setPhone(data.company_phone || "");
        setAddress(data.company_address || "");
        setFormSubmitted(true);
      }
    } catch (error) {
      console.error("Error checking details:", error);
    }
  };

  const fetchCreators = async () => {
    try {
      const response = await axios.post("/api/payment/get-creators", {
        campaign_id: currentCampaign?.id,
      });

      const sortedCreators = (response.data || []).sort(
        (a: { channel_name: string }, b: { channel_name: string }) =>
          a.channel_name.localeCompare(b.channel_name)
      );
      setCreators(sortedCreators);
    } catch (error) {
      console.error("Error fetching creators:", error);
      setCreators([]);
    }
  };

  const submitForm = async () => {
    if (!email || !phone || !address) {
      alert("Please fill all required fields");
      return;
    }

    setFormLoading(true);
    try {
      const { error } = await SUPABASE_CLIENT.from("campaigns")
        .update({
          payment_email: email,
          company_phone: phone,
          company_address: address,
        })
        .eq("id", currentCampaign?.id);

      if (!error) {
        setFormSubmitted(true);
        alert("Details updated successfully!");
      }
    } catch (error) {
      alert("Update failed");
    }
    setFormLoading(false);
  };

  const handlePayment = async (creatorId: string, type: "flat" | "cpm") => {
    setLoading(true);
    try {
      await axios.post("/api/payment/initiate-payment", {
        creator_id: creatorId,
        type,
      });

      const updatedCreators = creators.map((creator) =>
        creator.id === creatorId
          ? { ...creator, [`${type}_emailed`]: true }
          : creator
      );
      setCreators(updatedCreators);
      alert(`${type === "flat" ? "Flat" : "CPM"} payment initiated!`);
    } catch (error) {
      console.error("Payment error:", error);
      alert("Payment failed");
    }
    setLoading(false);
  };

  const getCpmOpensDate = (liveSubmitted: string) => {
    if (!liveSubmitted) return "N/A";
    const dueDate = new Date(liveSubmitted);
    dueDate.setDate(dueDate.getDate() + 30);
    return dueDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const isCpmAvailable = (liveSubmitted: string) => {
    if (!liveSubmitted) return false;
    const dueDate = new Date(liveSubmitted);
    dueDate.setDate(dueDate.getDate() + 30);
    return Date.now() > dueDate.getTime();
  };

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

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Payment</h1>

      {!formSubmitted && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">Billing Information</h2>
          <div className="space-y-4 w-full">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border p-2 rounded w-full"
                placeholder="Email address"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="border p-2 rounded w-full"
                placeholder="Phone number"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="border p-2 rounded w-full"
                placeholder="Full address"
                required
              />
            </div>
          </div>
          <div className="text-left mt-6">
            <button
              onClick={submitForm}
              disabled={formLoading}
              className="bg-orange-500 text-white px-6 py-2 rounded hover:bg-orange-600 inline-block"
            >
              {formLoading ? "Saving..." : "Save Details"}
            </button>
          </div>
        </div>
      )}

      {creators.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-lg shadow-md">
            <table className="min-w-full bg-white border-collapse rounded-lg">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-3 px-4 text-left rounded-tl-lg">
                    Creator Name
                  </th>
                  <th className="py-3 px-4 text-center">Flat Rate</th>
                  <th className="py-3 px-4 text-center">CPM Rate</th>
                  <th className="py-3 px-4 text-center">CPM Opens</th>
                  <th className="py-3 px-4 text-center rounded-tr-lg">
                    Pay Invoice
                  </th>
                </tr>
              </thead>
              <tbody>
                {creators.map((creator, index) => {
                  const cpmAvailable = isCpmAvailable(creator.live_submitted);
                  const isLastRow = index === creators.length - 1;

                  return (
                    <tr key={creator.id} className="border-b">
                      <td
                        className={`py-3 px-4 text-left ${
                          isLastRow ? "rounded-bl-lg" : ""
                        }`}
                      >
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
                        {getCpmOpensDate(creator.live_submitted)}
                      </td>
                      <td
                        className={`py-3 px-4 text-center ${
                          isLastRow ? "rounded-br-lg" : ""
                        }`}
                      >
                        {!formSubmitted ? (
                          <span className="text-gray-400">
                            Complete details above
                          </span>
                        ) : !creator.final_approved ? (
                          <span className="text-gray-400">
                            Pending Approval
                          </span>
                        ) : (
                          <div className="flex flex-col gap-2 items-center">
                            {!creator.flat_emailed && creator.rate > 0 && (
                              <button
                                onClick={() =>
                                  handlePayment(creator.id, "flat")
                                }
                                disabled={loading}
                                className="bg-orange-500 text-white px-4 py-1 rounded hover:bg-orange-600 w-fit"
                              >
                                Pay Flat
                              </button>
                            )}
                            {!creator.cpm_emailed && creator.rate_cpm > 0 && (
                              <>
                                {cpmAvailable ? (
                                  <button
                                    onClick={() =>
                                      handlePayment(creator.id, "cpm")
                                    }
                                    disabled={loading}
                                    className="bg-orange-500 text-white px-4 py-1 rounded hover:bg-orange-600 w-fit"
                                  >
                                    Pay CPM
                                  </button>
                                ) : (
                                  <span className="text-gray-400">
                                    CPM Unavailable
                                  </span>
                                )}
                              </>
                            )}
                            {(creator.flat_emailed || creator.cpm_emailed) && (
                              <>
                                {creator.flat_emailed && !creator.flat_paid && (
                                  <span className="text-gray-400">
                                    Flat Pending
                                  </span>
                                )}
                                {creator.cpm_emailed && !creator.cpm_paid && (
                                  <span className="text-gray-400">
                                    CPM Pending
                                  </span>
                                )}
                              </>
                            )}
                            {(creator.flat_paid || creator.cpm_paid) && (
                              <>
                                {creator.flat_paid && (
                                  <span className="text-green-500">
                                    Flat Complete
                                  </span>
                                )}
                                {creator.cpm_paid && (
                                  <span className="text-green-500">
                                    CPM Complete
                                  </span>
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
            *CPM payments become available 30 days after live submission
          </p>
        </>
      )}

      {formSubmitted && (
        <div className="bg-white p-6 rounded-lg shadow-md mt-8">
          <h2 className="text-xl font-semibold mb-4">
            Update Billing Information
          </h2>
          <div className="space-y-4 w-full">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border p-2 rounded w-full"
                placeholder="Email address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="border p-2 rounded w-full"
                placeholder="Phone number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="border p-2 rounded w-full"
                placeholder="Full address"
              />
            </div>
          </div>
          <div className="text-left mt-6">
            <button
              onClick={submitForm}
              disabled={formLoading}
              className="bg-orange-500 text-white px-6 py-2 rounded hover:bg-orange-600 inline-block"
            >
              {formLoading ? "Updating..." : "Update Details"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ================ [ EXPORTS ] ================ */

export default Payment;
