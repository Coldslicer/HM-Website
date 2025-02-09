export interface Campaign {
  id: string
  name: string
  start_date: string
  duration: number
  deliverable_type: 'short_form' | 'sponsored_segment' | 'full_video'
  niches: string[]
  brief_url: string
  status: 'draft' | 'brief_submitted' | 'creators_selected' | 'contract_signed' | 'completed'
  client_id: string
  created_at: string
}

export interface Creator {
  id: string; // Unique identifier for the creator (UUID)
  channel_url: string; // URL of the creator's channel (YouTube, TikTok, Instagram, etc.)
  discord_ign: string; // Discord handle/username
  rate: number; // The rate the creator charges per video (in dollars)
  status: string;
  campaign_id: string; // ID of the campaign the creator is associated with
}

export interface User {
  id: string
  email: string
  companyName: string
  role: 'client' | 'admin'
}