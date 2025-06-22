import { useState, useEffect } from "react";
import {
  CampaignCreatorInfoManager,
  CampaignInfoManager,
} from "../../infoAbstraction/infoManagers";
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
        const data = await CampaignInfoManager.get(currentCampaign.id);
        if (data) {
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
      if (!currentCampaign?.id) return;
      const data = await CampaignCreatorInfoManager.listByCampaign(
        currentCampaign.id,
        {
          selected:
            currentCampaign.status !== "brief_submitted" ? true : undefined,
        },
      );
      if (data) {
        console.log("Fetched creators:", data);
        setCreators(data);
      }
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
    <div className="min-h-screen bg-gray-100 p-4 flex flex-col items-center">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 w-full max-w-6xl text-left">
        Messaging
      </h1>
      <div className="flex h-[80vh] max-w-6xl w-full bg-white rounded-md shadow-md overflow-hidden">
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
    </div>
  );
}

export default Messaging;
