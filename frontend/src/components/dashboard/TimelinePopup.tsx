import React from "react";
import { X } from "lucide-react";
import { Button } from "../ui/Button";
import VideoPlayer from "./VideoPlayer";
import CompactReviewMessaging from "./CompactReviewMessaging";

interface TimelinePopupProps {
  content: string;
  creatorId: string;
  isDraft: boolean;
  onClose: () => void;
  onApprove?: (creatorId: string) => void;
  isApproved?: boolean;
}

export const TimelinePopup: React.FC<TimelinePopupProps> = ({
  content,
  creatorId,
  isDraft,
  onClose,
  onApprove,
  isApproved = false,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto relative">
        {/* Floating close button */}
        <Button
          variant="ghost"
          className="absolute top-2 right-2 p-2 rounded-full hover:bg-gray-100 z-10"
          onClick={onClose}
        >
          <X size={24} />
        </Button>

        <div className="p-8">
          {/* Video Player */}
          <div className="mb-6">
            <VideoPlayer url={content} />
          </div>

          {/* Review Messaging */}
          {creatorId && <CompactReviewMessaging creatorId={creatorId} />}

          {/* Approval Button (only for drafts) */}
          {isDraft && onApprove && (
            <Button
              disabled={isApproved}
              onClick={() => {
                if (!isApproved && onApprove) {
                  onApprove(creatorId);
                  onClose();
                }
              }}
              className={`w-full px-4 py-2 rounded-md mt-4 transition ${
                isApproved
                  ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                  : "bg-orange-500 hover:bg-orange-600 text-white"
              }`}
            >
              {isApproved ? "Draft Already Approved" : "Approve Draft"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TimelinePopup;
