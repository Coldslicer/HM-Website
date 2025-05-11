import React, { useState, useEffect } from "react";
import { SUPABASE_CLIENT } from "../lib/supabase";
import { useSearchParams } from "react-router-dom";
import axios from "axios";

const initialFormData = {
  campaign_id: "",
  name: "", // First and Last Name
  email: "",
  channel_name: "", // Channel Name
  channel_url: "", // Channel Link
  deliverables: "", // Deliverables (multiple choice)
  rate: "", // Flat rate (numeric)
  rate_cpm: "", // CPM rate (numeric)
  cpm_cap: "",
  personal_statement: "", // Personal Statement (text)
  selected: false, // Selected (bool)
  discord_id: "", // Discord ID (text)
  agreement: false, // Agreement (bool)
};

export function CreatorForm() {
  const [searchParams] = useSearchParams();
  const prefilledCampaignName = searchParams.get("campaignName") || "";
  const prefilledDiscordID = searchParams.get("discordId") || "";

  const getMostRecentCampaignCreator = async (discordId: string) => {
    const { data, error } = await SUPABASE_CLIENT.from("campaign_creators") // Updated table name
      .select("*")
      .eq("discord_id", discordId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching data:", error);
      return null;
    }

    return data.length ? data[0] : null;
  };

  const [formData, setFormData] = useState({
    ...initialFormData,
    campaign_name: prefilledCampaignName,
    discord_id: prefilledDiscordID,
  });

  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<boolean>(false);
  const [campaignNotAvailable, setCampaignNotAvailable] =
    useState<boolean>(false);
  const [pricingModel, setPricingModel] = useState<string[]>([]);
  const [deliverables, setDeliverables] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      let creatorData = {};

      if (prefilledDiscordID.length !== 0) {
        const creator = await getMostRecentCampaignCreator(prefilledDiscordID); // No need to convert to number
        if (creator) {
          creatorData = {
            name: creator.name || "",
            channel_name: creator.channel_name || "",
            channel_url: creator.channel_url || "",
            deliverables: creator.deliverables || "",
            rate: creator.rate || "",
            rate_cpm: creator.rate_cpm || "",
            cpm_cap: creator.cpm_cap || "",
            personal_statement: creator.personal_statement || "",
          };
        }
      }

      // Fetch campaigns that are 'brief_submitted'
      const { data, error } = await SUPABASE_CLIENT.from("campaigns")
        .select("*")
        .eq("status", "brief_submitted")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching campaigns:", error);
        setError("Failed to load campaigns.");
        return;
      }

      setCampaigns(data || []);

      let campaignId = "";
      if (prefilledCampaignName) {
        const campaign = data.find((c) => c.name === prefilledCampaignName);
        if (campaign) {
          campaignId = campaign.id;
          setPricingModel(campaign.desired_pricing_model);
          setDeliverables(campaign.sponsorship_format);
        } else {
          setCampaignNotAvailable(true);
        }
      }

      // Merge both prefilling sources into one `setFormData` call
      setFormData((prevData) => ({
        ...prevData,
        campaign_name: prefilledCampaignName,
        campaign_id: campaignId,
        discord_id: prefilledDiscordID,
        ...creatorData, // Spread creator data only if available
      }));
    };

    fetchData();
  }, [prefilledDiscordID, prefilledCampaignName]);

  const validateDiscordId = async (discordId: string) => {
    try {
      const response = await fetch(
        `/api/campaigns/validate-discord-id/${discordId}`,
      );
      const data = await response.json();

      if (data.valid) {
        console.log(
          `Valid Discord ID! User: ${data.username}#${data.discriminator}`,
        );
        return true;
      } else {
        console.warn("Invalid Discord ID:", data.error);
        return false;
      }
    } catch (error) {
      console.error("Error validating Discord ID:", error);
      return false;
    }
  };

  const handleCampaignChange = async (campaignId: string) => {
    const campaign = campaigns.find((c) => c.id === campaignId);
    if (campaign) {
      setCampaignNotAvailable(false);
      setPricingModel(campaign.desired_pricing_model);

      // Reset rates based on the new pricing model
      setFormData((prevData) => ({
        ...prevData,
        campaign_id: campaignId,
        rate:
          campaign.desired_pricing_model.includes("Flat-rate") ||
          campaign.desired_pricing_model.includes("Hybrid")
            ? prevData.rate
            : "0", // Reset to 0 if Flat-rate is not supported
        rate_cpm:
          campaign.desired_pricing_model.includes("CPM (first 30d)") ||
          campaign.desired_pricing_model.includes("Hybrid")
            ? prevData.rate_cpm
            : "0", // Reset to 0 if CPM is not supported
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Ensure a campaign is selected
    if (!formData.campaign_id) {
      setError("Please select a campaign to express interest.");
      return;
    }

    // Ensure agreement is checked
    if (!formData.agreement) {
      setError("You must agree to the terms to submit the form.");
      return;
    }

    // Ensure a valid email address
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please provide a valid email address.");
      return;
    }

    // Validate rates (non-negative)
    if (parseFloat(formData.rate) < 0 || parseFloat(formData.rate_cpm) < 0) {
      setError("Rates cannot be negative.");
      return;
    }

    // Validate Discord ID before submitting
    const isValidDiscordId = await validateDiscordId(formData.discord_id);
    if (!isValidDiscordId) {
      setError("Invalid Discord ID. Please enter a valid Discord ID.");
      return;
    }

    try {
      const { data, error } = await SUPABASE_CLIENT.from("campaign_creators") // Updated table name
        .insert([
          {
            campaign_id: formData.campaign_id,
            name: formData.name,
            channel_name: formData.channel_name,
            channel_url: formData.channel_url,
            deliverables: formData.deliverables,
            rate: parseFloat(formData.rate), // Convert to numeric
            rate_cpm: parseFloat(formData.rate_cpm), // Convert to numeric
            cpm_cap:
              parseFloat(formData.cpm_cap) == 0 || formData.cpm_cap == null
                ? null
                : parseFloat(formData.cpm_cap),
            email: formData.email,
            personal_statement: formData.personal_statement,
            selected: formData.selected,
            discord_id: formData.discord_id, // No need to convert to number
          },
        ])
        .select()
        .single();

      if (error) throw error;
      await new Promise((res) => setTimeout(res, 500)); // 0.5 second delay
      await axios.post("/api/campaigns/add-creator-to-discord", {
        creatorId: data.id,
      });

      const { data: creatorWithWebhook, error: webhookError } =
        await SUPABASE_CLIENT.from("campaign_creators")
          .select("webhook_url")
          .eq("id", data.id)
          .single();

      if (webhookError) throw webhookError;

      if (!creatorWithWebhook?.webhook_url) {
        setError(
          "You're in our systems, but it seems we might have not been able to make a DM channel with you.\nPlease check discord to see if you've been pinged with a confirmation message.",
        );
      }

      // ⚡ Post to the Discord channel via the webhook
      await axios.post(creatorWithWebhook.webhook_url, {
        content: `[hidden from clients]\n<@${formData.discord_id}> You’re IN

Thank you for applying. While we cannot guarantee every creator will get selected, you have just taken a major step, which is getting your channel in front of big brands.
If this is your first campaign, read our guide! Super important: [LINK](https://tinyurl.com/hmsponsorguide)

We will message you if you get selected for the sponsorship. In the meantime if you have any questions you may DM our CEO personally: @hotslicer

Thanks!
WARM” `,
      });

      // On success, set success state to true
      setSuccess(true);
    } catch (err) {
      console.error("Error submitting creator form:", err);
      setError(
        "An error occurred while submitting your information. Please try again later.",
      );
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 md:p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Express Interest in a Campaign
      </h2>

      {success ? (
        <div className="bg-green-50 p-6 rounded-lg text-green-500">
          <p>
            Thank you! Your interest in the campaign has been successfully
            submitted.
          </p>
          <p>We’ll get back to you shortly!</p>
        </div>
      ) : (
        <>
          {error && <div className="text-red-500 mb-4">{error}</div>}

          {campaignNotAvailable && (
            <div className="bg-yellow-500 p-4 mb-4 rounded-md text-gray-800">
              <p>
                The campaign you are trying to express interest in is no longer
                accepting responses.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="campaign_id"
                className="block text-sm font-medium text-gray-800"
              >
                Select Campaign
              </label>
              <select
                id="campaign_id"
                value={formData.campaign_id}
                onChange={(e) => handleCampaignChange(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 bg-white text-gray-800 shadow-sm focus:border-orange-500 focus:ring-orange-500 p-2.5"
                required
              >
                <option value="">Select a campaign</option>
                {campaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-800"
              >
                Name (First, Last) - Ex. John Smith
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 bg-white text-gray-800 shadow-sm focus:border-orange-500 focus:ring-orange-500 p-2.5"
                required
              />
            </div>

            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-800"
              >
                Email (MUST BE A VALID EMAIL) - Ex. hi@hotslicer.com
              </label>
              <input
                type="text"
                id="name"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 bg-white text-gray-800 shadow-sm focus:border-orange-500 focus:ring-orange-500 p-2.5"
                required
              />
            </div>

            <div>
              <label
                htmlFor="channel_name"
                className="block text-sm font-medium text-gray-800"
              >
                Your Channel Name - Ex. Hotslicer
              </label>
              <input
                type="text"
                id="channel_name"
                value={formData.channel_name}
                onChange={(e) =>
                  setFormData({ ...formData, channel_name: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 bg-white text-gray-800 shadow-sm focus:border-orange-500 focus:ring-orange-500 p-2.5"
                required
              />
            </div>

            <div>
              <label
                htmlFor="channel_url"
                className="block text-sm font-medium text-gray-800"
              >
                Your Channel Link - https://www.youtube.com/@Hotslicer
              </label>
              <input
                type="url"
                id="channel_url"
                value={formData.channel_url}
                onChange={(e) =>
                  setFormData({ ...formData, channel_url: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 bg-white text-gray-800 shadow-sm focus:border-orange-500 focus:ring-orange-500 p-2.5"
                required
              />
            </div>

            <div>
              <label
                htmlFor="discord_id"
                className="block text-sm font-medium text-gray-800"
              >
                Discord ID (Not your Username) - Ex. 655866521117130752
              </label>
              <input
                type="text"
                id="discord_id"
                value={formData.discord_id}
                onChange={(e) =>
                  setFormData({ ...formData, discord_id: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 bg-white text-gray-800 shadow-sm focus:border-orange-500 focus:ring-orange-500 p-2.5"
                required
              />
            </div>

            <div>
              <label
                htmlFor="deliverables"
                className="block text-sm font-medium text-gray-800"
              >
                Deliverables (Options shown in discord will be highly
                prioritized)
              </label>
              <select
                id="deliverables"
                value={formData.deliverables}
                onChange={(e) =>
                  setFormData({ ...formData, deliverables: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 bg-white text-gray-800 shadow-sm focus:border-orange-500 focus:ring-orange-500 p-2.5"
                required
              >
                <option value="">Select a deliverable</option>
                <option value="Longform Integration (30s)">
                  Longform Integration (30s)
                </option>
                <option value="Longform Integration (60s)">
                  Longform Integration (60s)
                </option>
                <option value="Shortform Video">Shortform Video</option>
                <option value="Dedicated Longform">Dedicated Longform</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="rate"
                className="block text-sm font-medium text-gray-800"
              >
                Deliverables Rate
              </label>
              <div className="flex items-center space-x-4">
                {/* Flat-rate Input */}
                {pricingModel.includes("Flat-rate") ||
                pricingModel.includes("Hybrid") ? (
                  <div className="flex items-center flex-1">
                    <span className="mr-2">$</span>
                    <input
                      type="number"
                      id="rate"
                      value={formData.rate}
                      onChange={(e) =>
                        setFormData({ ...formData, rate: e.target.value })
                      }
                      className="mt-1 block w-full rounded-md border-gray-300 bg-white text-gray-800 shadow-sm focus:border-orange-500 focus:ring-orange-500 p-2.5"
                      placeholder="Flat Rate"
                      step="any"
                      min="0"
                      required
                    />
                  </div>
                ) : (
                  (() => {
                    if (formData.rate !== "0") {
                      setFormData((prev) => ({ ...prev, rate: "0" }));
                    }
                    return null;
                  })()
                )}

                {/* CPM + Cap */}
                {pricingModel.includes("CPM (first 30d)") ||
                pricingModel.includes("Hybrid") ? (
                  <>
                    {(pricingModel.includes("Flat-rate") ||
                      pricingModel.includes("Hybrid")) && (
                      <span className="text-gray-800">+</span>
                    )}
                    <div className="flex items-center flex-1">
                      <span className="mr-2">$</span>
                      <input
                        type="number"
                        id="rate_cpm"
                        value={formData.rate_cpm}
                        onChange={(e) =>
                          setFormData({ ...formData, rate_cpm: e.target.value })
                        }
                        className="mt-1 block w-full rounded-md border-gray-300 bg-white text-gray-800 shadow-sm focus:border-orange-500 focus:ring-orange-500 p-2.5"
                        placeholder="CPM"
                        step="any"
                        min="0"
                        required
                      />
                    </div>
                    <span className="text-gray-800">CPM, Capped at </span>
                    <div className="flex items-center flex-1">
                      <span className="mr-2">$</span>
                      <input
                        type="number"
                        id="cpm_cap"
                        value={formData.cpm_cap}
                        onChange={(e) =>
                          setFormData({ ...formData, cpm_cap: e.target.value })
                        }
                        className="mt-1 block w-full rounded-md border-gray-300 bg-white text-gray-800 shadow-sm focus:border-orange-500 focus:ring-orange-500 p-2.5"
                        placeholder="CPM Cap"
                        step="any"
                        min="0"
                        required
                      />
                    </div>
                  </>
                ) : (
                  (() => {
                    if (formData.rate_cpm !== "0" || formData.cpm_cap !== "0") {
                      setFormData((prev) => ({
                        ...prev,
                        rate_cpm: "0",
                        cpm_cap: "0",
                      }));
                    }
                    return null;
                  })()
                )}
              </div>
              <p className="text-gray-600 mt-1">
                Enter 0 CPM cap for unlimited.
              </p>
            </div>

            <div>
              <label
                htmlFor="personal_statement"
                className="block text-sm font-medium text-gray-800"
              >
                Personal Statement
              </label>
              <textarea
                id="personal_statement"
                value={formData.personal_statement}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    personal_statement: e.target.value,
                  })
                }
                className="mt-1 block w-full rounded-md border-gray-300 bg-white text-gray-800 shadow-sm focus:border-orange-500 focus:ring-orange-500 p-2.5"
                required
              />
            </div>

            <div className="mt-6">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    type="checkbox"
                    id="agreement"
                    checked={formData.agreement}
                    onChange={(e) =>
                      setFormData({ ...formData, agreement: e.target.checked })
                    }
                    className="h-5 w-5 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
                    required
                  />
                </div>
                <div className="ml-3">
                  <label
                    htmlFor="agreement"
                    className="block text-sm font-medium text-gray-700"
                  >
                    I agree to these terms:
                  </label>
                  <ul className="mt-2 space-y-2 text-sm text-gray-600">
                    <li>
                      Hotslicer Media takes a 15% cut for bringing this
                      sponsorship. I will receive 85% of my listed rate.
                    </li>
                    <li>
                      I agree that I will follow through with the given
                      deliverables by the given timeline if selected.
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <button
                type="submit"
                className="inline-flex justify-center items-center px-6 py-3 text-white bg-orange-500 hover:bg-orange-600 focus:ring-4 focus:ring-orange-300 focus:ring-opacity-50 rounded-md"
              >
                Submit
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
