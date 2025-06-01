import React, { useEffect, useRef, useState } from "react";
import { FaPaperPlane } from "react-icons/fa";

interface Message {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  profile_picture?: string;
  bot?: boolean;
}

interface MessagingComponentProps {
  channelId: string;
  channelType: "group" | "staff" | "dm";
  currentCreatorId?: string;
  currentCreatorDiscordId?: string;
  campaignId: string;
  campaignRepName?: string;
  campaignCompanyName?: string;
}

export function MessagingComponent({
  channelId,
  channelType,
  currentCreatorId = "",
  currentCreatorDiscordId = "",
  campaignId,
  campaignRepName = "",
  campaignCompanyName = "",
}: MessagingComponentProps) {
  const INTERNAL_SERVER_TAGS = ["[hidden from clients]", "@here", "@everyone"]; // Add more tags if needed
  const [errorMessage, setErrorMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [justLoaded, setJustLoaded] = useState(false);
  const [wasAtBottom, setWasAtBottom] = useState(false);

  const fetchMessages = async (channelId: string) => {
    if (!channelId) return;
    try {
      console.log(`Fetching messages for channel ID: ${channelId}`);
      const response = await fetch(`/api/messages/read-messages/${channelId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      console.log("Fetched messages:", data);

      setMessages(data.messages || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
      setMessages([]);
    }
  };

  const handleSendMessage = async () => {
    if (INTERNAL_SERVER_TAGS.some((tag) => message.includes(tag))) {
      setErrorMessage("Error: Message contains restricted content.");
      setTimeout(() => setErrorMessage(""), 3000); // Clear error after 3 seconds
      return;
    }
    if (!channelId || !message.trim()) return;

    // Check last message
    const lastMessage = messages.length > 0 ? messages[0] : null; // Assuming messages are in reverse order
    const now = Date.now();
    const twoMinutesAgo = now - 120000; // 2 minutes in milliseconds

    let shouldPing = true;

    if (
      lastMessage &&
      lastMessage.bot &&
      new Date(lastMessage.timestamp).getTime() >= twoMinutesAgo
    ) {
      shouldPing = false; // Don't ping if the last message was from the bot and within 2 minutes
    }

    const messageWithHeader =
      channelType === "staff" || channelType === "group"
        ? (shouldPing ? "@here\n" : "") + message
        : (shouldPing ? `<@${currentCreatorDiscordId}>\n` : "") + message;

    try {
      const response = await fetch("/api/messages/sendDM", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: channelType === "dm" ? currentCreatorId : campaignId,
          message: messageWithHeader,
          type: channelType,
        }),
      });

      if (response.ok) {
        console.log("Message sent successfully");
        setMessage("");
        fetchMessages(channelId);
      } else {
        console.error("Error sending message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
    refreshSelected();
  };

  const refreshSelected = () => {
    console.log("Refreshing selected channel messages");
    if (!channelId) return;
    const container = messagesContainerRef.current;
    if (container) {
      const isAtBottom =
        container.scrollHeight - container.scrollTop === container.clientHeight;
      console.log("Is at bottom:", isAtBottom);
      setWasAtBottom(isAtBottom);
    }
    fetchMessages(channelId);
  };

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      console.log("Scrolling to bottom");
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    } else {
      console.log("messagesContainerRef.current is null");
    }
  };

  useEffect(() => {
    const handleNewMessages = () => {
      console.log("Handling new messages");
      if (justLoaded) {
        scrollToBottom();
        setJustLoaded(false);
        return;
      }
      if (wasAtBottom) {
        scrollToBottom();
      }
    };

    handleNewMessages();
  }, [messages]);

  useEffect(() => {
    console.log("Selected channel:", channelId);
    if (!channelId) return;

    // Fetch initial messages
    refreshSelected();

    // Set up interval to fetch messages every 5 seconds
    const intervalId = setInterval(refreshSelected, 5000);

    setJustLoaded(true);

    // Clear interval on component unmount or when channelId changes
    return () => clearInterval(intervalId);
  }, [channelId]);

  return (
    <div className="flex-1 flex flex-col">
      {/* Messages Container */}
      <div
        ref={messagesContainerRef}
        className="flex-1 p-6 overflow-y-auto bg-white"
      >
        <div className="space-y-4">
          {messages
            .slice()
            .reverse()
            .map((msg, index, arr) => {
              const displayName = msg.author
                .split(" ")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ");

              let contentLines = msg.content.split("\n");
              if (
                contentLines.length > 1 &&
                (contentLines[0].startsWith("<@") ||
                  contentLines[0].startsWith("@"))
              ) {
                contentLines.shift(); // Remove ping
              }
              const filteredContent = contentLines.join("\n");

              // Check previous message for merging logic
              const previousMessage = arr[index - 1];
              const isSameAuthor = previousMessage?.author === msg.author;
              const previousTimestamp = new Date(
                previousMessage?.timestamp,
              ).getTime();
              const currentTimestamp = new Date(msg.timestamp).getTime();
              const timeDiff = (currentTimestamp - previousTimestamp) / 1000; // in seconds
              const shouldMerge = isSameAuthor && timeDiff < 120;

              const isClientMessage =
                msg.author === `${campaignRepName} | ${campaignCompanyName}`;

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    shouldMerge ? "mt-0.5" : "mt-4"
                  } ${isClientMessage ? "items-end" : "items-start"}`}
                >
                  {/* Show profile pic and name only if it's a new sequence */}
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
                      <p
                        className={`font-semibold text-gray-800 text-sm px-2 py-1 rounded-md bg-gray-100`}
                      >
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

                  {/* Message Text (No Bubble) */}
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

      {/* Message Input Area */}
      <div className="p-4 border-t border-gray-200">
        {errorMessage && (
          <p className="text-red-500 text-sm mb-2">{errorMessage}</p>
        )}
        <div className="flex gap-2">
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault(); // Prevent new line
                handleSendMessage();
              }
            }}
            rows={2}
            className="flex-1 px-4 py-2 rounded-md bg-gray-50 text-gray-800 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="Type your message..."
            disabled={!channelId}
          />

          <button
            onClick={handleSendMessage}
            className="bg-orange-500 text-white p-3 rounded-md hover:bg-orange-600 transition-colors"
            disabled={!channelId}
          >
            <FaPaperPlane />
          </button>
        </div>
      </div>
    </div>
  );
}

export default MessagingComponent;
