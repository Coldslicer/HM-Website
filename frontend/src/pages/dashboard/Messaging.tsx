import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useCampaignStore } from '../../store/campaignStore';
import { FaPaperPlane } from 'react-icons/fa';

export function Messaging() {
  const [creators, setCreators] = useState([]);
  const [currentCreatorId, setCurrentCreatorId] = useState('');
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [channelData, setChannelData] = useState({});
  const [campaignStatus, setCampaignStatus] = useState('');
  const [groupChatChannelId, setGroupChatChannelId] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('');
  const intervalRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [justLoaded, setJustLoaded] = useState(false);
  const [wasAtBottom, setWasAtBottom] = useState(false);

  const currentCampaign = useCampaignStore((state) => state.currentCampaign);

  useEffect(() => {
    const fetchCampaignStatus = async () => {
      if (currentCampaign) {
        const { data, error } = await supabase
          .from('campaigns')
          .select('status, group_chat_channel_id')
          .eq('id', currentCampaign.id)
          .single();

        if (error) {
          console.error('Error fetching campaign status:', error);
        } else {
          setCampaignStatus(data.status);
          setGroupChatChannelId(data.group_chat_channel_id);
        }
      }
    };

    fetchCampaignStatus();
  }, [currentCampaign]);

  useEffect(() => {
    const fetchCreators = async () => {
      const { data, error } = await supabase
        .from('campaign_creators')
        .select('id, channel_id, channel_url, channel_name')
        .eq('campaign_id', currentCampaign?.id)
        .eq('selected',true);

      if (error) {
        console.error('Error fetching creators:', error);
        return;
      }

      console.log('Fetched creators:', data);
      setCreators(data);
    };

    fetchCreators();
  }, []);

  const fetchMessages = async (channelId) => {
    if (!channelId) return;
    try {
      console.log(`Fetching messages for channel ID: ${channelId}`);
      const response = await fetch(`/api/messages/read-messages/${channelId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      console.log('Fetched messages:', data);
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
    }
  };

  const handleCreatorChange = (creator) => {
    handleChannelChange(creator.channel_id);
    setCurrentCreatorId(creator.id);
  }
  const handleChannelChange = (channelId) => {
    setSelectedChannel(channelId);
    fetchMessages(channelId);
  };

  const handleSendMessage = async (isGroupChat: boolean) => {
    if (!selectedChannel || !message.trim()) return;

    try {
      const response = await fetch('/api/messages/sendDM', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: (isGroupChat ? currentCampaign?.id : currentCreatorId), message: message, isGroup: {isGroupChat} }),
      });

      if (response.ok) {
        console.log('Message sent successfully');
        setMessage('');
        fetchMessages(selectedChannel);
      } else {
        console.error('Error sending message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const refreshSelected = () => {
    console.log('Refreshing selected channel messages');
    if (!selectedChannel) return;
    const container = messagesContainerRef.current;
    if (container) {
      const isAtBottom = container.scrollHeight - container.scrollTop === container.clientHeight;
      console.log('Is at bottom:', isAtBottom);
      setWasAtBottom(isAtBottom);
    }
    fetchMessages(selectedChannel);
  };

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      console.log('Scrolling to bottom');
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    } else {
      console.log('messagesContainerRef.current is null');
    }
  };

  useEffect(() => {
    const handleNewMessages = () => {
      console.log('Handling new messages');
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
    console.log('Selected channel:', selectedChannel);
    if (!selectedChannel && groupChatChannelId) {
      setSelectedChannel(groupChatChannelId);
    }

    // Fetch initial messages for the default or first channel if needed
    refreshSelected();

    // Set up interval to fetch messages every 5 seconds
    const intervalId = setInterval(refreshSelected, 5000);

    setJustLoaded(true);

    // Clear interval on component unmount or when selectedChannel changes
    return () => clearInterval(intervalId);
  }, [selectedChannel]);

  if (campaignStatus !== 'contract_signed') {
    return (
      <div className="max-w-4xl mx-auto p-4 bg-white rounded-md shadow-md">
        <h2 className="text-2xl font-bold text-black mb-6">Messaging</h2>
        <p className="text-gray-700">You will be able to access messages after signing your contract.</p>
      </div>
    );
  }

  return (
    <div className="flex h-[80vh] max-w-6xl mx-auto bg-white rounded-md shadow-md overflow-hidden">
      {/* Sidebar for Channel Selection */}
      <div className="w-64 bg-gray-50 border-r border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Channels</h3>
        <ul className="space-y-2">
          <li>
            <button
              onClick={() => handleChannelChange(groupChatChannelId)}
              className={`w-full text-left px-4 py-2 rounded-md ${
                selectedChannel === groupChatChannelId
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
          </li>
          {creators.map((creator) => (
            <li key={creator.id}>
              <button
                onClick={() => {
                  handleCreatorChange(creator)
                }}
                className={`w-full text-left px-4 py-2 rounded-md ${
                  selectedChannel === creator.channel_id
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {creator.channel_name || creator.channel_url.split('@')[1] || "Unknown"}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Main Messaging Area */}
      <div className="flex-1 flex flex-col">
        {/* Messages Container */}
        <div
          ref={messagesContainerRef}
          className="flex-1 p-6 overflow-y-auto bg-white"
        >
          <div className="space-y-4">
            {messages.slice().reverse().map((msg) => {
              const displayName = msg.author
                .split(' ')
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');

              return (
                <div
                  key={msg.id}
                  className={`max-w-[70%] p-4 rounded-lg ${
                    msg.author === currentCampaign?.company_name
                      ? 'ml-auto bg-orange-50'
                      : 'bg-gray-50'
                  }`}
                >
                  <p className="font-semibold text-gray-800">{displayName}</p>
                  <p className="text-gray-700 mt-1">{msg.content}</p>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Message Input Area */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex gap-2">
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={2}
              className="flex-1 px-4 py-2 rounded-md bg-gray-50 text-gray-800 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Type your message..."
              disabled={!selectedChannel}
            />
            <button
              onClick={async() => {handleSendMessage(selectedChannel == groupChatChannelId)}}
              className="bg-orange-500 text-white p-3 rounded-md hover:bg-orange-600 transition-colors"
              disabled={!selectedChannel}
            >
              <FaPaperPlane />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Messaging;