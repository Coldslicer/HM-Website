// src/components/CreatorCard.tsx
import React, { useState, useEffect } from 'react';
import { getPlatformData } from '../../util/socialMediaApi'; // Import API call logic

export function CreatorCard({ creator }) {
  const [platformData, setPlatformData] = useState(null);
  const [error, setError] = useState(false);

  const fetchSocialData = async (url) => {
    try {
      const data = await getPlatformData(url); // API call to get platform data
      setPlatformData(data);
    } catch (err) {
      setError(true);
    }
  };

  useEffect(() => {
    fetchSocialData(creator.channel_url);
  }, [creator.channel_url]);

  return (
    <div className="creator-card">
      <h3 className="creator-name">{creator.discord_ign}</h3>
      <p className="creator-rate">Rate: ${creator.rate} per video</p>
      <a href={creator.channel_url} target="_blank" rel="noopener noreferrer">
        {creator.channel_url}
      </a>

      {error ? (
        <p className="error-text">Could not fetch data for this creator.</p>
      ) : platformData ? (
        <div className="platform-info">
          <p><strong>Followers: </strong>{platformData.followers}</p>
          <p><strong>Recent Post: </strong>{platformData.recent_post}</p>
        </div>
      ) : (
        <p>Loading social media data...</p>
      )}

      <button className="chat-button">Chat with this Creator</button>
    </div>
  );
};
