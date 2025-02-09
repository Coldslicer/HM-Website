import { Campaign } from '../types';

export async function sendCampaignBriefToDiscord(
  campaign: Campaign,
  webhookUrl: string
) {
  const embed = {
    title: 'New Campaign Brief Submitted',
    color: 0xff4500, // Orange color
    fields: [
      { name: 'Campaign Name', value: campaign.name, inline: true },
      { name: 'Duration', value: `${campaign.duration} weeks`, inline: true },
      {
        name: 'Deliverable Type',
        value: campaign.deliverable_type.replace('_', ' '),
        inline: true,
      },
      { name: 'Niches', value: campaign.niches.join(', ') },
      { name: 'Brief URL', value: campaign.brief_url },
    ],
    timestamp: new Date().toISOString(),
  };

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] }),
    });
  } catch (error) {
    console.error('Failed to send Discord notification:', error);
  }
}
