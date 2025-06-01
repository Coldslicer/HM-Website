import React from "react";

interface DisclaimerProps {
  text: string;
}

export const Disclaimer: React.FC<DisclaimerProps> = ({ text }) => {
  return (
    <div className="relative group">
      <span className="opacity-70 cursor-help">?</span>
      <div className="absolute z-50 bottom-full mb-2 left-1/2 transform -translate-x-1/2 w-64 text-xs bg-white text-gray-700 border border-gray-300 rounded-md p-2 shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
        {text}
      </div>
    </div>
  );
};

export default Disclaimer;
