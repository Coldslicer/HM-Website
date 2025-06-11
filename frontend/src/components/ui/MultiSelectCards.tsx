import React from "react";

interface MultiSelectCardsProps {
  options: {
    id: string;
    label: string;
    description?: string;
  }[];
  selected: string[];
  onToggle: (id: string) => void;
  columns?: number;
}

const MultiSelectCards: React.FC<MultiSelectCardsProps> = ({
  options,
  selected,
  onToggle,
  columns = 2,
}) => {
  return (
    <div className={`grid grid-cols-${columns} gap-4`}>
      {options.map(({ id, label, description }) => {
        const isSelected = selected.includes(id);
        return (
          <div
            key={id}
            onClick={() => onToggle(id)}
            className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
              isSelected
                ? "border-orange-500 bg-orange-50 shadow-orange-sm"
                : "border-gray-200 bg-white hover:border-orange-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-black font-medium">{label}</span>
              <div
                className={`w-6 h-6 flex items-center justify-center rounded-full ${
                  isSelected
                    ? "bg-orange-500"
                    : "bg-gray-100 border-2 border-gray-300"
                }`}
              >
                {isSelected && (
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </div>
            </div>
            {description && (
              <p className="text-sm text-gray-600 mt-2">{description}</p>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MultiSelectCards;
export { MultiSelectCards }
