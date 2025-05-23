export type Campaign = {
  id: number;
  client_id: string;
  company_name: string;
  website: string;
  company_description: string;
  name: string;
  rep_name: string;
  date: string;
  duration: number;
  niches: string[];
  per_influencer_budget: string[];
  desired_pricing_model: string[];
  sponsorship_format: string[];
  brief_url: string;
  status: string;
  created_at: string;
  staff_chat_channel_id: string;
  company_phone: string;
  company_address: string;
  server_id: string;
};

export interface Creator {
  id: string; // Unique identifier (UUID)
  channel_url: string; // URL to channel (YouTube, TikTok, Instagram, etc.)
  discord_ign: string; // Discord handle / username
  rate: number; // Rate charged per video (dollars)
  status: string;
  campaign_id: string; // ID of the campaign the creator is associated with
}

export interface User {
  id: string;
  email: string;
  companyName: string;
  role: "client" | "admin";
}
