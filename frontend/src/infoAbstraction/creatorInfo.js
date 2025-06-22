// creatorInfo.js

import { supabase } from "../lib/supabase";

export const CreatorInfoManager = {
  /**
   * Fetch creator info by their unique string identifier.
   * @param {string} creatorId - The identifier of the creator.
   * @returns {Promise<Object|null>} - The creator info object or null if not found.
   */
  async get(creatorId) {
    const { data, error } = await supabase
      .from("creators")
      .select("*")
      .eq("creator_id", creatorId)
      .single();

    if (error) {
      console.error("Error fetching creator info:", error);
      return null;
    }

    return data;
  },

  /**
   * Set (insert or update) creator info by their unique string identifier.
   * @param {string} creatorId - The identifier of the creator.
   * @param {Object} info - The info object to store.
   * @returns {Promise<boolean>} - True if successful, false otherwise.
   */
  async set(creatorId, info) {
    const { error } = await supabase.from("creators").upsert({
      creator_id: creatorId,
      ...info,
    });

    if (error) {
      console.error("Error setting creator info:", error);
      return false;
    }

    return true;
  },
};

export default CreatorInfoManager;
