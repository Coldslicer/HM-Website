import { useEffect, useRef, useState } from "react";
import { SUPABASE_CLIENT } from "../../lib/supabase";
import { useCampaignStore } from "../../store/campaignStore";
import { FaPaperPlane } from "react-icons/fa";
import { Button } from "../ui/Button";

// Number of messages to show in the compact view
const MAX_MESSAGES_TO_SHOW = 5;

export function CompactReviewMessaging({ creatorId }) {
  const [errorMessage, setErrorMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [selectedChannel, setSelectedChannel] = useState("");
  const [creatorDiscordId, setCreatorDiscordId] = useState("");
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [justLoaded, setJustLoaded] = useState(false);
  const [wasAtBottom, setWasAtBottom] = useState(false);

  const currentCampaign = useCampaignStore((state) => state.currentCampaign);

  useEffect(() => {
    const fetchCreatorChannel = async () => {
      const { data, error } = await SUPABASE_CLIENT.from("campaign_creators")
        .select("channel_id, discord_id")
        .eq("id", creatorId)
        .single();

      if (error) {
        console.error("Error fetching creator channel:", error);
        return;
      }

      setSelectedChannel(data.channel_id);
      setCreatorDiscordId(data.discord_id);
    };

    fetchCreatorChannel();
  }, [creatorId]);

  const fetchMessages = async (channelId) => {
    if (!channelId) return;
    try {
      const response = await fetch(`/api/messages/read-messages/${channelId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
      setMessages([]);
    }
  };

  const refreshSelected = () => {
    if (!selectedChannel) return;
    const container = messagesContainerRef.current;
    if (container) {
      const isAtBottom =
        container.scrollHeight - container.scrollTop === container.clientHeight;
      setWasAtBottom(isAtBottom);
    }
    fetchMessages(selectedChannel);
  };

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    if (!selectedChannel) return;
    refreshSelected();
    setJustLoaded(true);

    const intervalId = setInterval(refreshSelected, 5000);
    return () => clearInterval(intervalId);
  }, [selectedChannel]);

  useEffect(() => {
    if (justLoaded) {
      scrollToBottom();
      setJustLoaded(false);
    } else if (wasAtBottom) {
      scrollToBottom();
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!selectedChannel || !message.trim()) return;

    const lastMessage = messages.length > 0 ? messages[0] : null;
    const now = Date.now();
    const twoMinutesAgo = now - 120000;

    let shouldPing = true;
    if (lastMessage?.bot && lastMessage.timestamp >= twoMinutesAgo) {
      shouldPing = false;
    }

    const messageWithHeader =
      (shouldPing ? `<@${creatorDiscordId}>\n` : "") + message;

    try {
      const response = await fetch("/api/messages/sendDM", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: creatorId,
          message: messageWithHeader,
          type: "dm",
        }),
      });

      if (response.ok) {
        setMessage("");
        fetchMessages(selectedChannel);
      } else {
        console.error("Error sending message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // Get only the last few messages
  const recentMessages = messages.slice().reverse().slice(0, MAX_MESSAGES_TO_SHOW);

  return (
    <div className="flex flex-col h-[50vh] max-w-3xl mx-auto bg-white rounded-md shadow-md">
      {/* Fixed message input at the bottom */}
      <div className="p-4 border-t border-gray-200 sticky bottom-0 bg-white">
        {errorMessage && (
          <p className="text-red-500 text-sm mb-2">{errorMessage}</p>
        )}
        <div className="flex gap-2">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            rows={2}
            className="flex-1 px-4 py-2 rounded-md bg-gray-50 text-gray-800 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="Type your message..."
            disabled={!selectedChannel}
          />
          <Button
            onClick={handleSendMessage}
            className="bg-orange-500 text-white p-3 rounded-md hover:bg-orange-600 transition-colors"
            disabled={!selectedChannel}
          >
            <FaPaperPlane />
          </Button>
        </div>
      </div>

      {/* Messages Container */}
      <div
        ref={messagesContainerRef}
        className="flex-1 p-6 overflow-y-auto bg-white"
      >
        <div className="space-y-4">
          {recentMessages.map((msg, index, arr) => {
            const displayName = msg.author
              .split(" ")
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(" ");

            const contentLines = msg.content.split("\n");
            if (
              contentLines.length > 1 &&
              (contentLines[0].startsWith("<@") ||
                contentLines[0].startsWith("@"))
            ) {
              contentLines.shift();
            }
            const filteredContent = contentLines.join("\n");

            const prevMsg = arr[index - 1];
            const shouldMerge =
              prevMsg?.author === msg.author &&
              (new Date(msg.timestamp) - new Date(prevMsg.timestamp)) / 1000 <
                120;

            const isClientMessage =
              msg.author ===
              `${currentCampaign?.rep_name} | ${currentCampaign?.company_name}`;

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  shouldMerge ? "mt-0.5" : "mt-4"
                } ${isClientMessage ? "items-end" : "items-start"}`}
              >
                {!shouldMerge && (
                  <div
                    className={`flex items-center mb-1 ${
                      isClientMessage ? "justify-end" : "justify-start"
                    }`}
                  >
                    {!isClientMessage && (
                      <img
                        src={
                          msg.profile_picture ||
                          "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WARM%20Transparent-7Qk6aLp8aveeijQInp4caIaejfpZqP.png"
                        }
                        alt={`${displayName}'s profile`}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    )}
                    <p className="font-semibold text-gray-800 text-sm px-2 py-1 rounded-md bg-gray-100">
                      {displayName}
                    </p>
                    {isClientMessage && (
                      <img
                        src={
                          msg.profile_picture ||
                          "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/WARM%20Transparent-7Qk6aLp8aveeijQInp4caIaejfpZqP.png"
                        }
                        alt={`${displayName}'s profile`}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    )}
                  </div>
                )}
                <p
                  className={`text-gray-800 whitespace-pre-wrap px-2 ${
                    isClientMessage ? "text-right" : "text-left"
                  }`}
                >
                  {filteredContent}
                </p>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
}

export default CompactReviewMessaging;