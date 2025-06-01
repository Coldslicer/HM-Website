import React from "react";
import { Eye, Youtube } from "lucide-react";
import { formatNum } from "../../lib/utility";

interface Creator {
  id: string;
  channel_url: string;
  channel_name: string;
  channelTitle?: string;
  rate: number;
  rate_cpm: number;
  cpm_cap: number;
  subscriberCount: number;
  averageViews: number;
  country: string;
  selected: boolean;
  personal_statement: string;
}

interface CreatorTableProps {
  creators: Creator[];
  onSelectCreator?: (creator: Creator) => void;
  onViewStatement: (statement: string) => void;
  selectable?: boolean;
}

export const CreatorTable: React.FC<CreatorTableProps> = ({
  creators,
  onSelectCreator,
  onViewStatement,
  selectable = true,
}) => {
  return (
    <div className="overflow-x-auto rounded-lg shadow-md mb-4">
      <table className="min-w-full bg-white border-collapse rounded-lg">
        <thead>
          <tr className="bg-gray-100">
            <th className="py-3 px-4 text-left rounded-tl-lg">Channel Name</th>
            <th className="py-3 px-4 text-center">Flat Rate</th>
            <th className="py-3 px-4 text-center">CPM Rate</th>
            <th className="py-3 px-4 text-center">CPM Cap</th>
            <th className="py-3 px-4 text-center">Subscribers</th>
            <th className="py-3 px-4 text-center">Avg Views</th>
            <th className="py-3 px-4 text-center">Country</th>
            <th className="py-3 px-4 text-center rounded-tr-lg">Statement</th>
          </tr>
        </thead>
        <tbody>
          {creators.map((creator) => (
            <tr
              key={creator.id}
              onClick={() =>
                selectable && onSelectCreator && onSelectCreator(creator)
              }
              className={`border-b ${selectable ? "cursor-pointer" : ""} ${
                creator.selected
                  ? "bg-orange-100 hover:bg-orange-200"
                  : "hover:bg-gray-50"
              }`}
            >
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <a
                    href={creator.channel_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-gray-500 hover:text-gray-600"
                  >
                    <Youtube className="w-5 h-5 text-red-500" />
                  </a>
                  <span className="text-gray-800">
                    {creator.channel_name || creator.channelTitle || "N/A"}
                  </span>
                </div>
              </td>
              <td className="py-3 px-4 text-center">
                ${formatNum(creator.rate)}
              </td>
              <td className="py-3 px-4 text-center">
                ${formatNum(creator.rate_cpm)}
              </td>
              <td className="py-3 px-4 text-center">
                {creator.cpm_cap > 0 ? `$${formatNum(creator.cpm_cap)}` : "N/A"}
              </td>
              <td className="py-3 px-4 text-center">
                {formatNum(creator.subscriberCount)}
              </td>
              <td className="py-3 px-4 text-center">
                {formatNum(creator.averageViews)}
              </td>
              <td className="py-3 px-4 text-center">
                {creator.country || "N/A"}
              </td>
              <td className="py-3 px-4 text-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewStatement(creator.personal_statement);
                  }}
                  className="text-gray-600 hover:text-gray-800"
                >
                  <Eye size={20} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CreatorTable;
