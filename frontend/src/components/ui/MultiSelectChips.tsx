import React from "react";

interface MultiSelectChipsProps {
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}

const MultiSelectChips: React.FC<MultiSelectChipsProps> = ({
  options,
  selected,
  onToggle,
}) => {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((value) => {
        const isSelected = selected.includes(value);
        return (
          <button
            key={value}
            type="button"
            onClick={() => onToggle(value)}
            className={`px-4 py-2 rounded-full transition-all duration-200 border ${
              isSelected
                ? "bg-orange-500 border-orange-500 text-white"
                : "bg-white border-gray-300 text-black hover:bg-gray-50"
            }`}
          >
            <span className="text-sm font-medium">{value}</span>
          </button>
        );
      })}
    </div>
  );
};

export default MultiSelectChips;
export { MultiSelectChips };

