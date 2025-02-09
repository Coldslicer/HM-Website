import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Campaign } from '../types'

interface CampaignState {
  currentCampaign: Campaign | null
  setCurrentCampaign: (campaign: Campaign | null) => void
}

export const useCampaignStore = create<CampaignState>()(
  persist(
    (set) => ({
      currentCampaign: null,
      setCurrentCampaign: (campaign) => set({ currentCampaign: campaign }),
    }),
    {
      name: 'campaign-storage',
    }
  )
)