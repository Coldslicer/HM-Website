import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useCampaignStore } from '../../store/campaignStore';
import { FaPaperPlane } from 'react-icons/fa';

export function Messaging() {
  const [creators, setCreators] = useState([]);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [channelData, setChannelData] = useState({});
  const [campaignStatus, setCampaignStatus] = useState('');
  const [groupChatChannelId, setGroupChatChannelId] = useState('');
  const [clientName, setClientName] = useState('');
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
        .select('id, channel_id, channel_url')
        .eq('campaign_id', currentCampaign?.id);

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
    if (selectedChannel === '') return;
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

  const fetchChannelData = async (creator_id) => {
    if (channelData[creator_id]) {
      return channelData[creator_id];
    }
    const { data: data, error } = await supabase
      .from('channel_data')
      .select('creator_id, handle')
      .eq('creator_id', creator_id);

    if (error) {
      console.error('Error fetching channel data:', error);
    } else {
      console.log('Fetched channel data:', data);
      console.log("error, if present: ", error);
      channelData[creator_id] = data;
      return data;
    }
  };

  const handleChannelChange = (e) => {
    setSelectedChannel(e.target.value);
    fetchMessages(e.target.value);
  };

  const handleSendMessage = async () => {
    if (!selectedChannel || !message.trim()) return;

    try {
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ channelId: selectedChannel, message: message }),
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
    if (selectedChannel === '') return;
    const container = messagesContainerRef.current;
    if (container) {
      const isAtBottom = container.scrollHeight - container.scrollTop === container.clientHeight;
      console.log('Is at bottom:', isAtBottom);
      setWasAtBottom(isAtBottom);
    }
    fetchMessages(selectedChannel);
  }

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
    if (selectedChannel === '') {
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

  const getChannelHandle = (creatorId) => {
    const channel = fetchChannelData(creatorId);
    if (!channel) console.log('Channel data not found for creator ID:', creatorId);
    return channel.handle || 'Unknown';
  };

  if (campaignStatus !== 'contract_signed') {
    return (
      <div className="max-w-4xl mx-auto p-4 bg-gray-800 rounded-md">
        <h2 className="text-2xl font-bold text-white mb-6">Messaging</h2>
        <p className="text-white">You will be able to access messages after signing your contract.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 bg-gray-800 rounded-md flex flex-col h-screen">
      <h2 className="text-2xl font-bold text-white mb-6">Messaging</h2>

      <div className="mb-4">
        <label htmlFor="channel" className="text-white">Select Channel</label>
        <select
          id="channel"
          value={selectedChannel}
          onChange={handleChannelChange}
          className="w-full px-4 py-2 rounded-md bg-gray-700 text-white"
        >
          <option value={''}>-- Select a Channel --</option>
          <option value={groupChatChannelId}>Announcements (Group Chat)</option>
          {creators.map((creator) => (
            <option key={creator.id} value={creator.channel_id}>
              {
                creator.channel_url.split('@')[1] || "Unknown"
              }
            </option>
          ))}
        </select>
      </div>

      <div ref={messagesContainerRef} className="flex-1 p-4 overflow-y-auto bg-gray-900 rounded-md">
        <div className="space-y-4">
          {messages.slice().reverse().map((msg) => (
            <div 
              key={msg.id} 
              className={`bg-gray-800 p-3 rounded-md max-w-2/3 ${msg.author === currentCampaign?.companyName ? 'ml-auto text-right' : ''}`}
            >
              <p className="text-white"><strong>{msg.author}:</strong> {msg.content}</p>
              <p className="text-gray-400 text-sm">{new Date(msg.timestamp).toLocaleString()}</p>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="mt-4 p-4 bg-gray-700 rounded-md flex items-center">
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={2}
          className="w-full px-4 py-2 rounded-md bg-gray-800 text-white mb-2 mr-2"
          placeholder="Type your message..."
          disabled={!selectedChannel}
        />
        <button
          onClick={handleSendMessage}
          className="bg-orange-500 text-white p-2 rounded-md"
          disabled={!selectedChannel}
        >
          <FaPaperPlane />
        </button>
      </div>
    </div>
  );
}

export default Messaging;