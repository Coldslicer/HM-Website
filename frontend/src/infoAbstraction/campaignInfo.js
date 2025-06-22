// campaignInfo.js

import { supabase } from "../lib/supabase";

export const CampaignInfoManager = {
  /**
   * Fetch campaign info by its unique string identifier.
   * @param {string} campaignId - The identifier of the campaign.
   * @returns {Promise<Object|null>} - The campaign info object or null if not found.
   */
  async get(campaignId) {
    const { data, error } = await supabase
      .from("campaigns")
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
   * List campaigns for a client by their ID.
   * @param {string} clientId
   * @returns {Promise<Object[]|null>}
   */
  async listByClient(clientId) {
    const { data, error } = await supabase
      .from("campaigns")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching campaigns:", error);
      return null;
    }

    return data;
  },

  /**
   * Create a new campaign for a client.
   * @param {string} clientId
   * @param {Object} info
   * @returns {Promise<Object|null>}
   */
  async create(clientId, info) {
    const { data, error } = await supabase
      .from("campaigns")
      .insert({ client_id: clientId, ...info })
      .select()
      .single();

    if (error) {
      console.error("Error creating campaign:", error);
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
    const { error } = await supabase.from("campaign_info").upsert({
      campaign_id: campaignId,
      ...info,
    });

    if (error) {
      console.error("Error setting campaign info:", error);
      return false;
    }

    return true;
  },

  /**
   * Subscribe to campaign status updates.
   * @param {string} campaignId
   * @param {(status: string) => void} callback
   * @returns {RealtimeChannel}
   */
  subscribeStatus(campaignId, callback) {
    const channel = supabase
      .channel(`campaigns:${campaignId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "campaigns",
          filter: `id=eq.${campaignId}`,
        },
        (payload) => {
          if (payload.new?.status !== undefined) {
            callback(payload.new.status);
          }
        },
      )
      .subscribe();
    return channel;
  },
};

export default CampaignInfoManager;
