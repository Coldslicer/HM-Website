export const accountCreationNudge = {
id: 'accountCreationNudge',
once: false,  // Allow repeating but with conditions.
evaluate(campaign) {
    const now = new Date();
    const createdAt = new Date(campaign.created_at);
    const timeDiff = now - createdAt;
    const hoursDiff = timeDiff / (1000 * 60 * 60);  // Get hours difference
    const daysDiff = timeDiff / (1000 * 60 * 60 * 24);  // Get days difference

    const repName = campaign.rep_name || 'there';
    const nudgeMessage = `Hey ${repName}, thank you so much for making an account on WARM. It seems like you have a pending campaign draft.

If you have 3 minutes, make sure to finish submitting a campaign brief and get a list of committed influencers in under 24 hours, ready to work!`;

    // First nudge (48-72 hours)
    if (campaign.status === 'draft' && hoursDiff >= 48 && hoursDiff <= 72) {
    return nudgeMessage;
    }

    // Second nudge (30-31 days)
    if (campaign.status === 'draft' && daysDiff >= 30 && daysDiff <= 31) {
    return nudgeMessage;
    }

    return null;
}
};

// emailRules.js

export const contractNotSignedNudge = {
    id: 'contractNotSignedNudge',
    once: true,
    async evaluate(campaign, supabase) {
      const now = new Date();
      const updatedAt = new Date(campaign.updated_at);
      const hoursDiff = (now - updatedAt) / (1000 * 60 * 60);
  
      if (campaign.status !== 'creators_selected' || hoursDiff < 72) return null;
  
      const repName = campaign.rep_name || 'there';
      return `Hey ${repName}, looks like you've chosen your influencers and are happy with your upcoming campaign lineup 🎉
  
  The next step is to finalize things and sign your contract. This ensures influencers can start working on their content without delays.
  
  Have questions or want to discuss details? Chat directly with us in your WARM messaging panel or email us at contact@hotslicer.com`;
    }
  };
  

  export const reviewCreatorsNudge = {
    id: 'reviewCreatorsNudge',
    once: true,
    async evaluate(campaign, supabase) {
        const now = new Date();
        const updatedAt = new Date(campaign.updated_at);
        const hoursDiff = (now - updatedAt) / (1000 * 60 * 60);
    
        if (campaign.status !== 'brief_submitted' || hoursDiff < 72) return null;
  
      // Count campaign_creators
      const { data: creators, error } = await supabase
        .from('campaign_creators')
        .select('id')
        .eq('campaign_id', campaign.id);
  
      if (error) {
        console.error('Error fetching campaign creators:', error);
        return null;
      }
  
      const numInfluencers = creators.length;
      const repName = campaign.rep_name || 'there';
  
      return `Hey ${repName}, congrats! You reached out and ${numInfluencers} influencer${numInfluencers === 1 ? ' is' : 's are'} already interested 😎
  
  Review channels now in your WARM portal!
  
  Waiting longer may surface more niche or high-performance creators, but early confirmation helps secure current talent before they book other deals.`;
    }
  };

  export const flatRatePaymentNudge = {
    id: 'flatRatePaymentNudge',
    once: false, // This nudge can send repeatedly
  
    async evaluate(campaign, supabase) {
      const { data: creators, error } = await supabase
        .from('campaign_creators')
        .select('channel_url, final, flat_paid')
        .eq('campaign_id', campaign.id)
        .eq('flat_paid', false);
  
      if (error) {
        console.error('❌ Error fetching creators for flat rate payment nudge:', error.message);
        return null;
      }
  
      const unpaidCreators = creators.filter(c => c.final && c.final.trim() !== '');
  
      if (unpaidCreators.length === 0) return null;
  
      // Extract usernames or fallback to full URL
      const creatorNames = unpaidCreators.map(c => {
        const match = c.channel_url?.match(/youtube\.com\/@([\w.-]+)/i);
        return match ? `@${match[1]}` : c.channel_url || '[unknown channel]';
      });
  
      const repName = campaign.rep_name || 'there';
      const plural = creatorNames.length > 1;
      const creatorList = creatorNames.join(', ');
      const paymentLink = 'https://warm.hotslicer.com/dashboard/payment';
  
      return `Hey ${repName}!
  
  Quick check-in about ${creatorList}. ${plural ? 'Their videos have' : 'Their video has'} been posted but we see an invoice has not been initiated yet. Please visit your WARM portal payment page and send the invoice to your financial team to make sure everything goes smoothly: ${paymentLink}
  
  Delayed payments slow down the campaign and can result in influencers not being interested in future campaigns.
  
  If net30, net60 etc. payment terms have not yet been communicated directly with the WARM team, please do so ASAP.
  
  Concerns or using a custom payment solution? Message our staff directly on your WARM messaging panel or reach out via email at contact@hotslicer.com`;
    }
  };

  export const cpmPaymentNudges = {
    id: 'cpmPaymentNudges',
    once: false,
    async evaluate(campaign, supabase, sentMemos) {
      const { data: creators, error } = await supabase
        .from('campaign_creators')
        .select('channel_url, live_submitted, cpm_paid')
        .eq('campaign_id', campaign.id);
  
      if (error) {
        console.error('Error fetching campaign creators:', error);
        return null;
      }
  
      const now = new Date();
      let finalMessage = '';
  
      for (const creator of creators) {
        const { channel_url, live_submitted, cpm_paid } = creator;
        if (!channel_url || !live_submitted || cpm_paid) continue;
  
        const liveDate = new Date(live_submitted);
        const daysSinceLive = Math.floor((now - liveDate) / (1000 * 60 * 60 * 24));
  
        const stages = [
          { days: 14, label: '14day', stageMessage: 'Just a reminder that' },
          { days: 27, label: '27day', stageMessage: 'Friendly reminder that' },
          { days: 30, label: 'dueDate', stageMessage: 'Your CPM payment is now due!' },
          { days: 32, label: 'overdue', stageMessage: 'Just a heads-up: Your CPM payment is overdue!' }
        ];
  
        for (const stage of stages) {
          if (daysSinceLive !== stage.days) continue;
  
          const memoKey = `cpmPaymentNudges_${stage.label}_${channel_url}`;
          if (sentMemos[memoKey]) continue;
  
          const shortName = channel_url.match(/@[\w\d_-]+/)?.[0] || channel_url;
          const dueDate = new Date(liveDate.getTime() + 30 * 24 * 60 * 60 * 1000);
          const dueDateStr = dueDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  
          let message = '';
  
          switch (stage.label) {
            case '14day':
              message = `Hey ${campaign.rep_name || 'there'}!\n\n${stage.stageMessage} ${shortName}’s CPM payment will be due on ${dueDateStr}. To ensure everything goes smoothly, make sure your financial team is ready.\n\nWARM automatically tracks the views. We will remind you 3 days before this is due along with a payment estimate.\n\nHave a custom financial process? Message our staff directly on your WARM messaging panel or reach out via email at contact@hotslicer.com`;
              break;
            case '27day':
              message = `Hey ${campaign.rep_name || 'there'}!\n\n${stage.stageMessage} ${shortName}’s CPM payment will be due on ${dueDateStr}. To ensure everything goes smoothly, make sure your financial team is ready.\n\n${shortName}’s estimated payment will be available in 3 days. We will remind you again on the due date with final numbers.\n\nHave a custom financial process? Message our staff directly on your WARM messaging panel or reach out via email at contact@hotslicer.com`;
              break;
            case 'dueDate':
              message = `Hey ${campaign.rep_name || 'there'}!\n\n${stage.stageMessage} ${shortName}’s CPM payment is due! Login to your payment portal here: https://warm.hotslicer.com/dashboard/payment\n\nHave a custom financial process? Message our staff directly on your WARM messaging panel or reach out via email at contact@hotslicer.com`;
              break;
            case 'overdue':
              message = `Hey ${campaign.rep_name || 'there'}!\n\n${stage.stageMessage} ${shortName}’s CPM payment was due two days ago. Please visit your payment portal here: https://warm.hotslicer.com/dashboard/payment to make sure everything’s on track.\n\nDelayed payments may affect influencer interest in future campaigns.\n\nQuestions? Message our staff directly on your WARM messaging panel or reach out via email at contact@hotslicer.com`;
              break;
          }
  
          if (message) {
            finalMessage += `\n\n---\n\n${message}`;
  
            // Update memos for the relevant creator
            const updatedMemo = { ...sentMemos, [memoKey]: new Date().toISOString() };
            await supabase
              .from('campaign_update_memos')
              .upsert([{ campaign_id: campaign.id, updates: updatedMemo }]);
  
            // Return updated message along with memo changes
            return { body: finalMessage.trim(), memos: updatedMemo };
          }
        }
      }
  
      // If no relevant messages, return null
      return null;
    }
  };
  
export const emailRules = [reviewCreatorsNudge, accountCreationNudge, contractNotSignedNudge, flatRatePaymentNudge, cpmPaymentNudges];
