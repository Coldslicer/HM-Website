// export type Campaign = {
//   id: number;
//   client_id: string;
//   company_name: string;
//   website: string;
//   company_description: string;
//   name: string;
//   rep_name: string;
//   date: string;
//   duration: number;
//   niches: string[];
//   per_influencer_budget: string[];
//   desired_pricing_model: string[];
//   sponsorship_format: string[];
//   brief_url: string;
//   status: string;
//   created_at: string;
//   staff_chat_channel_id: string;
//   company_phone: stFring;
//   company_address: string;
//   server_id: string;
// };
// ONLY the fields that are in the database
export interface DatabaseCreator {
  id: string;
  campaign_id: string;
  created_at: string;
  channel_url: string | null;
  rate: number | null;
  updated_at: string;
  channel_id: string | null;
  selected: boolean;
  personal_statement: string;
  discord_id: string | null;
  draft: string;
  final: string;
  contract_signed: boolean;
  channel_name: string;
  webhook_url: string;
  rate_cpm: number | null;
  name: string | null;
  deliverables: string | null;
  flat_paid: boolean;
  cpm_paid: boolean;
  final_approved: boolean;
  flat_emailed: boolean;
  cpm_emailed: boolean;
  live_url: string;
  live_submitted: string | null;
  cpm_cap: number | null;
  contract_embed_link: string | null;
  email: string | null;
}
export interface ChannelData {
  id: string;
  creator_id: string;
  created_at: string;
  handle: string;
  follower_count: string;
  country: string;
  average_views: string;
}
export interface Campaign {
  id: string;
  client_id: string;
  name: string | null;
  date: string | null;
  deliverable_type: string | null;
  niches: string[] | null;
  brief_url: string | null;
  status: 'draft' | 'brief_submitted' | 'creators_selected' | 'contract_signed' | 'payment_done' | 'completed';
  created_at: string | null;
  updated_at: string | null;
  group_chat_channel_id: string | null;
  contract_json: any | null;
  company_name: string | null;
  website: string | null;
  company_description: string | null;
  rep_name: string | null;
  product_link: string;
  desired_pricing_model: string[];
  per_influencer_budget: string[];
  webhook_url: string;
  sponsorship_format: string[];
  total_price: number | null;
  payment_email: string | null;
  staff_chat_channel_id: string;
  staff_chat_webhook_url: string;
  company_address: string | null;
  company_phone: string | null;
  invoice_id: number;
  fully_managed: boolean;
  contract_email: string;
  server_id: string;
  category_id: string | null;
  updates_email: string | null;
}
// export interface Creator {
//   id: string; // Unique identifier (UUID)
//   channel_url: string; // URL to channel (YouTube, TikTok, Instagram, etc.)
//   discord_ign: string; // Discord handle / username
//   rate: number; // Rate charged per video (dollars)
//   status: string;
//   campaign_id: string; // ID of the campaign the creator is associated with
// }
//
// export interface User {
//   id: string;
//   email: string;
//   companyName: string;
//   role: "client" | "admin";
// }