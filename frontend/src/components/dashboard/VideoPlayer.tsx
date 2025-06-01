import React, { useState, useEffect } from "react";
import { ExternalLink } from "lucide-react";

interface VideoPlayerProps {
  url: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ url }) => {
  const [embedURL, setEmbedURL] = useState<string | null>(null);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    if (!url) {
      setError(true);
      return;
    }

    const processedURL = getEmbedURL(url);
    setEmbedURL(processedURL);
    
    // If we couldn't process the URL, set an error
    if (!processedURL) {
      setError(true);
    }
  }, [url]);

  const isURL = (str: string) =>
    typeof str === "string" && /^https?:\/\//.test(str.trim());

  const getEmbedURL = (url: string) => {
    if (!isURL(url)) return null;

    const ytMatch = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/,
    );
    if (ytMatch) {
      return `https://www.youtube.com/embed/${ytMatch[1]}`;
    }

    return url; // fallback for non-YouTube links
  };

  if (error) {
    return (
      <div className="w-full p-4 bg-gray-100 rounded-md border border-gray-300 text-center">
        <p className="text-gray-700 mb-2">Unable to load video from the provided URL:</p>
        <div className="flex items-center justify-center gap-2">
          <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-orange-500 hover:text-orange-600 underline flex items-center gap-1"
          >
            {url} <ExternalLink size={16} />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <iframe
        src={embedURL || ""}
        className="w-full h-64 rounded-md border"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
};

export default VideoPlayer;