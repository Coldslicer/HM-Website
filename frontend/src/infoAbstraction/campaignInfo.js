// campaignInfo.js

import { SUPABASE_CLIENT } from "../lib/supabase";

export const CampaignInfoManager = {
  /**
   * Fetch campaign info by its unique string identifier.
   * @param {string} campaignId - The identifier of the campaign.
   * @returns {Promise<Object|null>} - The campaign info object or null if not found.
   */
  async get(campaignId) {
    const { data, error } = await SUPABASE_CLIENT.from("campaigns")
      .select("*")
      .eq("id", campaignId)
      .single();

    if (error) {
      console.error("Error fetching campaign info:", error);
      return null;
    }

    return data;
  },

  /**
   * Set (insert or update) campaign info by its unique string identifier.
   * @param {string} campaignId - The identifier of the campaign.
   * @param {Object} info - The info object to store.
   * @returns {Promise<boolean>} - True if successful, false otherwise.
   */
  async set(campaignId, info) {
    const { error } = await SUPABASE_CLIENT.from("campaign_info").upsert({
      campaign_id: campaignId,
      ...info,
    });

    if (error) {
      console.error("Error setting campaign info:", error);
      return false;
    }

    return true;
  },
};

export default CampaignInfoManager;
