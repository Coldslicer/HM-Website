interface SelectableCardProps {
  selected: boolean;
  onClick: () => void;
  title: string;
  description: string;
}

const SelectableCard = ({
  selected,
  onClick,
  title,
  description,
}: SelectableCardProps) => (
  <div
    onClick={onClick}
    className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
      selected
        ? "border-orange-500 bg-orange-50 shadow-orange-sm"
        : "border-gray-200 bg-white hover:border-orange-300"
    }`}
  >
    <div className="flex items-center justify-between">
      <span className="text-black font-medium">{title}</span>
      <div
        className={`w-6 h-6 flex items-center justify-center rounded-full ${
          selected ? "bg-orange-500" : "bg-gray-100 border-2 border-gray-300"
        }`}
      >
        {selected && (
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
    <p className="text-sm text-gray-600 mt-2">{description}</p>
  </div>
);

export default SelectableCard;
export { SelectableCard };
