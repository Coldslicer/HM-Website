import React from 'react'
import { useCampaignStore } from '../../store/campaignStore'
import { supabase } from '../../lib/supabase'
import { Campaign } from '../../types'
import { useAuthStore } from '../../store/authStore'

export function CampaignSelector() {
  const [campaigns, setCampaigns] = React.useState<Campaign[]>([])
  const { currentCampaign, setCurrentCampaign } = useCampaignStore()
  const { user } = useAuthStore()

  React.useEffect(() => {
    if (!user) return

    const fetchCampaigns = async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching campaigns:', error)
        return
      }

      setCampaigns(data || [])
      
      // // Set first campaign as current if none selected
      // if (!currentCampaign && data && data.length > 0) {
      //   setCurrentCampaign(data[0])
      // }
    }

    fetchCampaigns()
  }, [user, currentCampaign, setCurrentCampaign])

  return (
    <div className="flex items-center space-x-4 mb-6">
      <select
        value={currentCampaign?.id || ''}
        onChange={(e) => {
          const campaign = campaigns.find(c => c.id === e.target.value)
          setCurrentCampaign(campaign || null)
        }}
        className="bg-gray-700 text-white rounded-md px-3 py-2 flex-1"
      >
        <option value="">New Campaign</option>
        {campaigns.map((campaign) => (
          <option key={campaign.id} value={campaign.id}>
            {campaign.name}
          </option>
        ))}
      </select>
      
      <button
        onClick={() => setCurrentCampaign(null)}
        className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600"
      >
        New Campaign
      </button>
    </div>
  )
}