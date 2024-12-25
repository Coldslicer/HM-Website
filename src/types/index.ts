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
  id: string
  channel_url: string
  niches: string[]
  subscriber_count: number
  view_count: number
  rate: number
  selected: boolean
  campaign_id?: string
}

export interface User {
  id: string
  email: string
  companyName: string
  role: 'client' | 'admin'
}