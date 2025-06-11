// campaignCreatorInfo.js

import { SUPABASE_CLIENT } from "../lib/supabase";

export const CampaignCreatorInfoManager = {
  /**
   * Fetch campaign creator info by ID.
   * @param {string} creatorId
   * @returns {Promise<Object|null>}
   */
  async get(creatorId) {
    const { data, error } = await SUPABASE_CLIENT.from("campaign_creators")
      .select("*")
      .eq("id", creatorId)
      .single();

    if (error) {
      console.error("Error fetching campaign creator info:", error);
      return null;
    }

    return data;
  },

  /**
   * Fetch campaign creators for a campaign.
   * @param {string} campaignId
   * @param {Object} [filters]
   * @returns {Promise<Object[]|null>}
   */
  async listByCampaign(campaignId, filters = {}) {
    let query = SUPABASE_CLIENT.from("campaign_creators").select("*").eq("campaign_id", campaignId);

    if (filters.selected !== undefined) {
      query = query.eq("selected", filters.selected);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching campaign creators:", error);
      return null;
    }

    return data;
  },
};

export default CampaignCreatorInfoManager;
