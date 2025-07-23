import {
  analyzeConversationGhost,
  getChannelMessages,
  getLastClientMessageTime,
} from "./util_functions.js";

export const accountCreationNudge = {
  id: "accountCreationNudge",
  once: false, // Allow repeating but with conditions.
  evaluate(campaign) {
    const now = new Date();
    const createdAt = new Date(campaign.created_at);
    const timeDiff = now - createdAt;
    const hoursDiff = timeDiff / (1000 * 60 * 60); // Get hours difference
    const daysDiff = timeDiff / (1000 * 60 * 60 * 24); // Get days difference

    const repName = campaign.rep_name || "there";
    const nudgeMessage = `Hey ${repName}, thank you so much for making an account on WARM. It seems like you have a pending campaign draft.

If you have 3 minutes, make sure to finish submitting a campaign brief and get a list of committed influencers in under 24 hours, ready to work!`;

    // First nudge (48-72 hours)
    if (campaign.status === "draft" && hoursDiff >= 48 && hoursDiff <= 72) {
      return nudgeMessage;
    }

    // Second nudge (30-31 days)
    if (campaign.status === "draft" && daysDiff >= 30 && daysDiff <= 31) {
      return nudgeMessage;
    }

    return null;
  },
};

// emailRules.js

export const contractNotSignedNudge = {
  id: "contractNotSignedNudge",
  once: true,
  async evaluate(campaign, supabase) {
    const now = new Date();
    const updatedAt = new Date(campaign.updated_at);
    const hoursDiff = (now - updatedAt) / (1000 * 60 * 60);

    if (campaign.status !== "creators_selected" || hoursDiff < 72) return null;

    const repName = campaign.rep_name || "there";
    return `Hey ${repName}, looks like you've chosen your influencers and are happy with your upcoming campaign lineup 🎉
  
  The next step is to finalize things and sign your contract. This ensures influencers can start working on their content without delays.
  
  Have questions or want to discuss details? Chat directly with us in your WARM messaging panel or email us at contact@hotslicer.com`;
  },
};

export const flatRatePaymentNudge = {
  id: "flatRatePaymentNudge",
  once: false, // This nudge can send repeatedly

  async evaluate(campaign, supabase) {
    const { data: creators, error } = await supabase
      .from("campaign_creators")
      .select("channel_url, final, flat_paid")
      .eq("campaign_id", campaign.id)
      .eq("flat_paid", false);

    if (error) {
      console.error(
        "❌ Error fetching creators for flat rate payment nudge:",
        error.message,
      );
      return null;
    }

    const unpaidCreators = creators.filter(
      (c) => c.final && c.final.trim() !== "",
    );

    if (unpaidCreators.length === 0) return null;

    // Extract usernames or fallback to full URL
    const creatorNames = unpaidCreators.map((c) => {
      const match = c.channel_url?.match(/youtube\.com\/@([\w.-]+)/i);
      return match ? `@${match[1]}` : c.channel_url || "[unknown channel]";
    });

    const repName = campaign.rep_name || "there";
    const plural = creatorNames.length > 1;
    const creatorList = creatorNames.join(", ");
    const paymentLink = "https://warm.hotslicer.com/dashboard/payment";

    return `Hey ${repName}!
  
  Quick check-in about ${creatorList}. ${plural ? "Their videos have" : "Their video has"} been posted but we see an invoice has not been initiated yet. Please visit your WARM portal payment page and send the invoice to your financial team to make sure everything goes smoothly: ${paymentLink}
  
  Delayed payments slow down the campaign and can result in influencers not being interested in future campaigns.
  
  If net30, net60 etc. payment terms have not yet been communicated directly with the WARM team, please do so ASAP.
  
  Concerns or using a custom payment solution? Message our staff directly on your WARM messaging panel or reach out via email at contact@hotslicer.com`;
  },
};

export const cpmPaymentNudges = {
  id: "cpmPaymentNudges",
  once: false,
  async evaluate(campaign, supabase, sentMemos) {
    const { data: creators, error } = await supabase
      .from("campaign_creators")
      .select("channel_url, live_submitted, cpm_paid")
      .eq("campaign_id", campaign.id);

    if (error) {
      console.error("Error fetching campaign creators:", error);
      return null;
    }

    const now = new Date();
    let finalMessage = "";

    for (const creator of creators) {
      const { channel_url, live_submitted, cpm_paid } = creator;
      if (!channel_url || !live_submitted || cpm_paid) continue;

      const liveDate = new Date(live_submitted);
      const daysSinceLive = Math.floor(
        (now - liveDate) / (1000 * 60 * 60 * 24),
      );

      const stages = [
        { days: 14, label: "14day", stageMessage: "Just a reminder that" },
        { days: 27, label: "27day", stageMessage: "Friendly reminder that" },
        {
          days: 30,
          label: "dueDate",
          stageMessage: "Your CPM payment is now due!",
        },
        {
          days: 32,
          label: "overdue",
          stageMessage: "Just a heads-up: Your CPM payment is overdue!",
        },
      ];

      for (const stage of stages) {
        if (daysSinceLive !== stage.days) continue;

        const memoKey = `cpmPaymentNudges_${stage.label}_${channel_url}`;
        if (sentMemos[memoKey]) continue;

        const shortName = channel_url.match(/@[\w\d_-]+/)?.[0] || channel_url;
        const dueDate = new Date(liveDate.getTime() + 30 * 24 * 60 * 60 * 1000);
        const dueDateStr = dueDate.toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
        });

        let message = "";

        switch (stage.label) {
          case "14day":
            message = `Hey ${campaign.rep_name || "there"}!\n\n${stage.stageMessage} ${shortName}’s CPM payment will be due on ${dueDateStr}. To ensure everything goes smoothly, make sure your financial team is ready.\n\nWARM automatically tracks the views. We will remind you 3 days before this is due along with a payment estimate.\n\nHave a custom financial process? Message our staff directly on your WARM messaging panel or reach out via email at contact@hotslicer.com`;
            break;
          case "27day":
            message = `Hey ${campaign.rep_name || "there"}!\n\n${stage.stageMessage} ${shortName}’s CPM payment will be due on ${dueDateStr}. To ensure everything goes smoothly, make sure your financial team is ready.\n\n${shortName}’s estimated payment will be available in 3 days. We will remind you again on the due date with final numbers.\n\nHave a custom financial process? Message our staff directly on your WARM messaging panel or reach out via email at contact@hotslicer.com`;
            break;
          case "dueDate":
            message = `Hey ${campaign.rep_name || "there"}!\n\n${stage.stageMessage} ${shortName}’s CPM payment is due! Login to your payment portal here: https://warm.hotslicer.com/dashboard/payment\n\nHave a custom financial process? Message our staff directly on your WARM messaging panel or reach out via email at contact@hotslicer.com`;
            break;
          case "overdue":
            message = `Hey ${campaign.rep_name || "there"}!\n\n${stage.stageMessage} ${shortName}’s CPM payment was due two days ago. Please visit your payment portal here: https://warm.hotslicer.com/dashboard/payment to make sure everything’s on track.\n\nDelayed payments may affect influencer interest in future campaigns.\n\nQuestions? Message our staff directly on your WARM messaging panel or reach out via email at contact@hotslicer.com`;
            break;
        }

        if (message) {
          finalMessage += `\n\n---\n\n${message}`;

          // Update memos for the relevant creator
          const updatedMemo = {
            ...sentMemos,
            [memoKey]: new Date().toISOString(),
          };
          await supabase
            .from("campaign_update_memos")
            .upsert([{ campaign_id: campaign.id, updates: updatedMemo }]);

          // Return updated message along with memo changes
          return { body: finalMessage.trim(), memos: updatedMemo };
        }
      }
    }

    // If no relevant messages, return null
    return null;
  },
};

export const reviewCreatorsNudge = {
  id: "reviewCreatorsNudge",
  once: true,
  async evaluate(campaign, supabase) {
    const now = new Date();
    const updatedAt = new Date(campaign.updated_at);
    const hoursDiff = (now - updatedAt) / (1000 * 60 * 60);

    if (campaign.status !== "brief_submitted" || hoursDiff < 72) return null;

    // Count campaign_creators
    const { data: creators, error } = await supabase
      .from("campaign_creators")
      .select("id")
      .eq("campaign_id", campaign.id);

    if (error) {
      console.error("Error fetching campaign creators:", error);
      return null;
    }

    const numInfluencers = creators.length;
    const repName = campaign.rep_name || "there";

    return `Hey ${repName}, congrats! You reached out and ${numInfluencers} influencer${numInfluencers === 1 ? " is" : "s are"} already interested 😎
  
  Review channels now in your WARM portal!
  
  Waiting longer may surface more niche or high-performance creators, but early confirmation helps secure current talent before they book other deals.`;
  },
};

/**
 * Represents a configuration object that evaluates whether to send a reminder nudge for draft submissions
 * that require timely review within a specific time frame (48-72 hours).
 *
 * @property {string} id - Unique identifier for the reminder nudge configuration.
 * @property {boolean} once - Indicates whether the nudge should only be evaluated once.
 * @property {function} evaluate - An asynchronous function that checks a campaign's draft submission status and determines if a reminder nudge should be sent.
 *    The function evaluates the following:
 *    - Verifies if the campaign's status is `draft_submitted`.
 *    - Fetches all creators associated with the campaign whose drafts have been submitted for review.
 *    - Identifies drafts that have been waiting for review between 48 and 72 hours without a client response.
 *    - Constructs a message to prompt the client to review the drafts if applicable.
 *    - Returns `null` if no reminder is necessary.
 */
export const draftSubmissionReminderNudge = {
  id: "draftSubmissionReminderNudge",
  once: true,
  async evaluate(campaign, supabase) {
    const now = new Date();

    // Get all creators for this campaign
    const { data: campaignCreators, error: creatorsError } = await supabase
      .from("campaign_creators")
      .select("*, campaigns(*)")
      .eq("campaign_id", campaign.id)
      .filter("draft_submitted_at", "not.is", null);

    if (creatorsError) {
      console.error("Error fetching campaign creators:", creatorsError);
      return null;
    }

    let creatorsNeedingReview = [];

    // Process each creator's draft submission
    for (const creator of campaignCreators) {
      if (!creator.draft_submitted_at) continue;

      const submittedAt = new Date(creator.draft_submitted_at);
      const hoursSinceSubmission = (now - submittedAt) / (1000 * 60 * 60);

      // Check if 48-72 hours have passed
      if (hoursSinceSubmission < 48 || hoursSinceSubmission > 72) {
        continue;
      }

      // Get last client message time for this specific creator
      const lastClientMessageTime = await getLastClientMessageTime(
        campaign.id,
        creator,
      );
      const hasClientResponse =
        lastClientMessageTime && lastClientMessageTime > submittedAt;

      if (!hasClientResponse) {
        creatorsNeedingReview.push({
          name: creator.name,
          draft:
            creator.draft || "https://warm.hotslicer.com/dashboard/campaigns",
        });
      }
    }

    // If we found creators needing review, create message
    if (creatorsNeedingReview.length > 0) {
      if (creatorsNeedingReview.length === 1) {
        const creator = creatorsNeedingReview[0];
        return `Hi ${campaign.rep_name || "there"}, ${creator.name} submitted their draft for ${campaign.name || "your campaign"}!

It's been 48 hours since submission. Reviewing drafts promptly ensures campaign timelines stay smooth.

View the draft here: ${creator.draft}`;
      }

      const creatorList = creatorsNeedingReview
        .map((creator) => `- ${creator.name}: ${creator.draft}`)
        .join("\n");

      return `Hi ${campaign.rep_name || "there"}, multiple creators have submitted drafts for ${campaign.name || "your campaign"} that need review!

The following drafts have been waiting for 48+ hours:
${creatorList}

Reviewing drafts promptly ensures campaign timelines stay smooth.`;
    }

    return null;
  },
};
/**
 * An evaluation module designed to identify and notify campaign representatives
 * about selected creators who have been inactive or unresponsive within a specific time frame.
 *
 * @constant {Object} ghostedCreatorNudge
 * @property {string} id - A unique identifier for the evaluation module.
 * @property {boolean} once - Indicates whether the evaluation should run only once.
 * @property {Function} evaluate - Asynchronous function to evaluate creator activity and generate a notification message if creators are found to be inactive or ghosting.
 *
 * The `evaluate` function performs the following steps:
 * 1. Fetches the list of creators selected for a given campaign from the `campaign_creators` database table.
 * 2. Checks the creators' activity by analyzing recent messages in their respective channels.
 * 3. Identifies creators who have not submitted a draft or responded within the last 48 hours.
 * 4. Sends a formatted notification message to the campaign representative, requesting input on how to proceed.
 */
export const ghostedCreatorNudge = {
  id: "ghostedCreatorNudge",
  once: true,
  async evaluate(campaign, supabase) {
    const { data: campaignCreators, error: creatorsError } = await supabase
      .from("campaign_creators")
      .select("*")
      .eq("campaign_id", campaign.id)
      .eq("selected", true);

    if (creatorsError) {
      console.error("Error fetching campaign creators:", creatorsError);
      return null;
    }

    const now = new Date();
    let ghostedCreators = [];

    for (const creator of campaignCreators) {
      try {
        const formattedMessages = await getChannelMessages(
          creator.channel_id,
          48,
        );
        if (!formattedMessages || formattedMessages.length === 0) continue;

        const lastMessage = formattedMessages[0];
        const hoursSinceLastMessage =
          (now - new Date(lastMessage.timestamp)) / (1000 * 60 * 60);

        if (hoursSinceLastMessage >= 48) {
          const needsResponse = await analyzeConversationGhost(
            formattedMessages.slice(-5),
          );

          if (needsResponse) {
            ghostedCreators.push({
              name: creator.channel_name || creator.discord_ign || "creator",
              channelId: creator.channel_id,
            });
          }
        }
      } catch (error) {
        console.error(`Error processing creator ${creator.id}:`, error);
      }
    }

    if (ghostedCreators.length > 0) {
      const messages = ghostedCreators.map(
        (creator) =>
          `Hey ${campaign.rep_name || "there"}, a quick heads up — ${creator.name} hasn't replied or submitted a draft within 48 hours of being selected.
Would you like us to intervene and follow up, or are you in touch with them directly?
Let us know how you'd like to proceed!`,
      );

      return messages.join("\n\n");
    }

    return null;
  },
};

/**
 * The `clientAbandonmentWarning` variable represents an evaluation rule that determines whether a warning
 * message should be sent to a campaign representative due to inactivity or lack of response after the launch
 * of a campaign. The evaluation is based on the time elapsed since the last client action or message.
 *
 * Properties:
 * - `id` (string): A unique identifier for the rule.
 * - `once` (boolean): Indicates whether the evaluation rule should run only once.
 * - `evaluate` (async function): A method that determines whether the warning message should be triggered.
 *   It takes the `campaign` and `supabase` objects as arguments, calculates the number of hours since the
 *   last activity, and returns a reminder message if the inactivity threshold (48 hours) is met.
 */
export const clientAbandonmentWarning = {
  id: "clientAbandonmentWarning",
  once: true,
  async evaluate(campaign, supabase) {
    // Only check if contract is signed
    if (campaign.status !== "contract_signed") {
      return null;
    }

    const now = new Date();
    const lastMessageTime = await getLastClientMessageTime(campaign.id);

    // If we have a message time, use that; otherwise fall back to campaign's updated_at
    const lastActionTime = lastMessageTime || new Date(campaign.updated_at);
    const hoursSinceLastAction = (now - lastActionTime) / (1000 * 60 * 60);

    if (hoursSinceLastAction >= 48) {
      const message = `Hey ${campaign.rep_name || "there"}, important reminder: your campaign ${campaign.name || "campaign"} has been launched but we've seen no action from your side.

Under WARM terms, you are now contractually obligated to oversee and fund this campaign.

If your plans have changed, you MUST book a call with us immediately to clarify next steps and avoid any misalignment: https://warm.hotslicer.com/dashboard/welcome

Want a little load off your plate? There is still time! We offer full-service campaign management for an additional 15% per influencer. Let us know ASAP if you'd like to upgrade!`;

      // Update the campaign's updated_at timestamp
      await supabase
        .from("campaigns")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", campaign.id);

      return message;
    }

    return null;
  },
};

export const nudges = [
  accountCreationNudge,
  contractNotSignedNudge,
  flatRatePaymentNudge,
  cpmPaymentNudges,
];
