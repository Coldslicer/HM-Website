import React from "react";

interface Creator {
  id: string;
  channel_id: string;
  channel_url: string;
  channel_name: string;
  discord_id: string;
}

interface ChannelSelectorProps {
  creators: Creator[];
  staffChatChannelId: string;
  groupChatChannelId: string;
  selectedChannel: string;
  campaignStatus: string;
  onChannelChange: (channelId: string) => void;
  onCreatorChange: (creator: Creator) => void;
}

export function ChannelSelector({
  creators,
  staffChatChannelId,
  groupChatChannelId,
  selectedChannel,
  campaignStatus,
  onChannelChange,
  onCreatorChange,
}: ChannelSelectorProps) {
  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 p-4 max-h-screen overflow-y-auto">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Channels</h3>
      <ul className="space-y-2">
        {staffChatChannelId && (
          <li>
            <button
              onClick={() => onChannelChange(staffChatChannelId)}
              className={`w-full text-left px-4 py-2 rounded-md ${
                selectedChannel === staffChatChannelId
                  ? "bg-orange-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Staff
            </button>
          </li>
        )}
        {campaignStatus !== "brief_submitted" &&
          campaignStatus !== "draft" && (
            <li>
              <button
                onClick={() => onChannelChange(groupChatChannelId)}
                className={`w-full text-left px-4 py-2 rounded-md ${
                  selectedChannel === groupChatChannelId
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All
              </button>
            </li>
          )}
        {creators.map((creator) => (
          <li key={creator.id}>
            <button
              onClick={() => onCreatorChange(creator)}
              className={`w-full text-left px-4 py-2 rounded-md ${
                selectedChannel === creator.channel_id
                  ? "bg-orange-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {creator.channel_name ||
                creator.channel_url.split("@")[1] ||
                "Unknown"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ChannelSelector;