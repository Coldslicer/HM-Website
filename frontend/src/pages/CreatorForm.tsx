import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useSearchParams } from "react-router-dom";
import axios from "axios";

const initialFormData = {
  join_code: "",
  campaign_id: "",
  name: "",
  email: "",
  channel_name: "",
  channel_url: "",
  deliverables: "",
  rate: "",
  rate_cpm: "",
  cpm_cap: "",
  personal_statement: "",
  selected: false,
  discord_id: "",
  agreement: false,
};

export function CreatorForm() {
  const [searchParams] = useSearchParams();
  const prefilledJoinCode = searchParams.get("joinCode") || "";
  const prefilledDiscordID = searchParams.get("discordId") || "";

  const [formData, setFormData] = useState({
    ...initialFormData,
    join_code: prefilledJoinCode,
    discord_id: prefilledDiscordID,
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [campaignNotAvailable, setCampaignNotAvailable] = useState(false);
  const [pricingModel, setPricingModel] = useState<string[]>([]);
  const [deliverables, setDeliverables] = useState<string[]>([]);

  useEffect(() => {
    const fetchCampaignFromJoinCode = async () => {
      try {
        const { data } = await axios.get(`/api/joincodes/decode?code=${formData.join_code}`);
        const campaign = data.campaign;

        if (!campaign) {
          setCampaignNotAvailable(true);
          return;
        }

        setPricingModel(campaign.desired_pricing_model || []);
        setDeliverables(campaign.sponsorship_format || []);
        setFormData((prev) => ({
          ...prev,
          campaign_id: campaign.id,
        }));
      } catch (err) {
        console.error("Error fetching campaign from join code:", err);
        setCampaignNotAvailable(true);
      }
    };

    const fetchCreatorPrefill = async () => {
      if (!prefilledDiscordID) return;
      const { data, error } = await supabase
        .from("campaign_creators")
        .select("*")
        .eq("discord_id", prefilledDiscordID)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        setFormData((prev) => ({
          ...prev,
          name: data.name || "",
          channel_name: data.channel_name || "",
          email: data.email || "",
          channel_url: data.channel_url || "",
          deliverables: data.deliverables || "",
          rate: data.rate || "",
          rate_cpm: data.rate_cpm || "",
          cpm_cap: data.cpm_cap || "",
          personal_statement: data.personal_statement || "",
        }));
      }
    };

    if (formData.join_code) fetchCampaignFromJoinCode();
    if (prefilledDiscordID) fetchCreatorPrefill();
  }, [formData.join_code, prefilledDiscordID]);

  const validateDiscordId = async (discordId: string) => {
    try {
      const res = await axios.get(`/api/campaigns/validate-discord-id/${discordId}`);
      return res.data.valid;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.campaign_id) return setError("Join code is not valid.");
    if (!formData.agreement) return setError("You must agree to the terms.");
    if (!(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))) return setError("Invalid email.");
    if (parseFloat(formData.rate) < 0 || parseFloat(formData.rate_cpm) < 0)
      return setError("Rates cannot be negative.");
    if (!(await validateDiscordId(formData.discord_id)))
      return setError("Invalid Discord ID.");

    try {
      const { data, error } = await supabase.from("campaign_creators")
        .insert([
          {
            campaign_id: formData.campaign_id,
            name: formData.name,
            channel_name: formData.channel_name,
            channel_url: formData.channel_url,
            deliverables: formData.deliverables,
            rate: parseFloat(formData.rate),
            rate_cpm: parseFloat(formData.rate_cpm),
            cpm_cap:
              parseFloat(formData.cpm_cap) === 0 || !formData.cpm_cap
                ? null
                : parseFloat(formData.cpm_cap),
            email: formData.email,
            personal_statement: formData.personal_statement,
            selected: formData.selected,
            discord_id: formData.discord_id,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      await axios.post("/api/campaigns/add-creator-to-discord", {
        creatorId: data.id,
      });

      const { data: creatorWithWebhook } = await supabase.from("campaign_creators")
        .select("webhook_url")
        .eq("id", data.id)
        .single();

      if (!creatorWithWebhook?.webhook_url) {
        return setError(
          "You're in our system, but we couldn't send a confirmation DM. Please check Discord manually."
        );
      }

      await axios.post(creatorWithWebhook.webhook_url, {
        content: `
<@${formData.discord_id}> You’re IN

Thank you for applying. While we cannot guarantee every creator will get selected, you have just taken a major step, which is getting your channel in front of big brands.
If this is your first campaign, read our guide! [LINK](https://tinyurl.com/hmsponsorguide)

We will message you if you get selected for the sponsorship. In the meantime if you have any questions you may DM our CEO personally: @hotslicer

Thanks!
WARM`,
      });

      setSuccess(true);
    } catch (err) {
      console.error("Submission failed:", err);
      setError("An error occurred while submitting your info. Please try again later.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 md:p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Express Interest in a Campaign
      </h2>

      {success ? (
        <div className="bg-green-50 p-6 rounded-lg text-green-500">
          <p>Your interest has been submitted. We'll get back to you soon!</p>
        </div>
      ) : (
        <>
          {error && <div className="text-red-500 mb-4">{error}</div>}
          {campaignNotAvailable && (
            <div className="bg-yellow-500 p-4 mb-4 rounded-md text-gray-800">
              <p>This join code does not match a current campaign.</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="join_code"
                className="block text-sm font-medium text-gray-800"
              >
                Campaign Join Code
              </label>
              <input
                id="join_code"
                type="text"
                value={formData.join_code}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    join_code: e.target.value,
                    campaign_id: "", // reset until revalidated
                  }))
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
