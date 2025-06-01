import { useState, useEffect } from "react";
import { SUPABASE_CLIENT } from "../../lib/supabase";
import { useCampaignStore } from "../../store/campaignStore";
import ChannelSelector from "../../components/dashboard/ChannelSelector.tsx";
import MessagingComponent from "../../components/dashboard/MessagingComponent.tsx";

export function Messaging() {
  const [creators, setCreators] = useState([]);
  const [currentCreatorId, setCurrentCreatorId] = useState("");
  const [campaignStatus, setCampaignStatus] = useState("");
  const [groupChatChannelId, setGroupChatChannelId] = useState("");
  const [staffChatChannelId, setStaffChatChannelId] = useState("");
  const [selectedChannel, setSelectedChannel] = useState("");
  const [currentCreatorDiscordId, setCurrentCreatorDiscordId] = useState("");

  const currentCampaign = useCampaignStore((state) => state.currentCampaign);

  useEffect(() => {
    const fetchCampaignStatus = async () => {
      if (currentCampaign) {
        const { data, error } = await SUPABASE_CLIENT.from("campaigns")
          .select("status, group_chat_channel_id, staff_chat_channel_id")
          .eq("id", currentCampaign.id)
          .single();

        if (error) {
          console.error("Error fetching campaign status:", error);
        } else {
          setCampaignStatus(data.status);
          setGroupChatChannelId(data.group_chat_channel_id);
          setStaffChatChannelId(data.staff_chat_channel_id);
        }
      }
    };

    fetchCampaignStatus();
  }, [currentCampaign]);

  useEffect(() => {
    const fetchCreators = async () => {
      const { data, error } =
        currentCampaign?.status == "brief_submitted"
          ? await SUPABASE_CLIENT.from("campaign_creators")
              .select("id, channel_id, channel_url, channel_name, discord_id")
              .eq("campaign_id", currentCampaign?.id)
          : await SUPABASE_CLIENT.from("campaign_creators")
              .select("id, channel_id, channel_url, channel_name, discord_id")
              .eq("campaign_id", currentCampaign?.id)
              .eq("selected", true);

      if (error) {
        console.error("Error fetching creators:", error);
        return;
      }

      console.log("Fetched creators:", data);
      setCreators(data);
    };

    fetchCreators();
  }, []);

  const handleCreatorChange = (creator) => {
    setSelectedChannel(creator.channel_id);
    setCurrentCreatorId(creator.id);
    setCurrentCreatorDiscordId(creator.discord_id);
  };

  const handleChannelChange = (channelId) => {
    setSelectedChannel(channelId);
    setCurrentCreatorDiscordId("");
  };

  useEffect(() => {
    console.log("Selected channel:", selectedChannel);
    if (!selectedChannel && groupChatChannelId) {
      setSelectedChannel(groupChatChannelId);
    }
  }, [selectedChannel, groupChatChannelId]);

  // Determine channel type
  const getChannelType = () => {
    if (selectedChannel === groupChatChannelId) return "group";
    if (selectedChannel === staffChatChannelId) return "staff";
    return "dm";
  };

  return (
    <div className="flex h-[80vh] max-w-6xl mx-auto bg-white rounded-md shadow-md overflow-hidden">
      {/* Sidebar for Channel Selection */}
      <ChannelSelector
        creators={creators}
        staffChatChannelId={staffChatChannelId}
        groupChatChannelId={groupChatChannelId}
        selectedChannel={selectedChannel}
        campaignStatus={campaignStatus}
        onChannelChange={handleChannelChange}
        onCreatorChange={handleCreatorChange}
      />

      {/* Main Messaging Area */}
      {selectedChannel && (
        <MessagingComponent
          channelId={selectedChannel}
          channelType={getChannelType()}
          currentCreatorId={currentCreatorId}
          currentCreatorDiscordId={currentCreatorDiscordId}
          campaignId={String(currentCampaign?.id)}
          campaignRepName={currentCampaign?.rep_name}
          campaignCompanyName={currentCampaign?.company_name}
        />
      )}
    </div>
  );
}

export default Messaging;
