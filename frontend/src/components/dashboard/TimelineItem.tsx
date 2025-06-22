import React from "react";
import { motion } from "framer-motion";
import { Youtube } from "lucide-react";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Disclaimer } from "./Disclaimer";

interface TimelineItemProps {
  creator: {
    id: string;
    handle: string;
    channel_url: string;
    contract_signed: boolean;
    draft: string;
    live_url: string;
    final_approved: boolean;
  };
  onOpenPopup: (url: string, creatorId: string, isDraft: boolean) => void;
}

const TimelineItem: React.FC<TimelineItemProps> = ({
  creator,
  onOpenPopup,
}) => {
  const contractComplete = creator.contract_signed;
  const draftComplete = isCompleted(creator.draft);
  const finalComplete = isCompleted(creator.live_url);
  const finalApproved = creator.final_approved;

  return (
    <Card className="p-8 mb-6">
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <a
              href={creator.channel_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Youtube className="w-5 h-5 text-red-600" />
            </a>
            <h3 className="text-xl font-semibold text-gray-800">
              {creator.handle}
            </h3>
          </div>
        </div>

        <div className="flex items-center w-full">
          {/* Contract Signed */}
          <div className="flex-1">
            <div
              className={`p-4 rounded-md ${
                contractComplete
                  ? "bg-orange-500 text-white"
                  : "border-2 border-gray-300 bg-gray-50"
              } text-center mx-2`}
            >
              <div
                className={`text-sm ${contractComplete ? "text-white" : "text-gray-600"} mb-1`}
              >
                Contract Signed
              </div>
              <div
                className={`text-sm ${contractComplete ? "text-white" : "text-gray-500"} flex items-center justify-center gap-1`}
              >
                {contractComplete ? (
                  <>
                    <span>Complete</span>
                    <Disclaimer text="Creator contracts are between Hotslicer Media and creators. We don't show them to clients at this time, but be assured that this creator is contractually obligated to follow through with the campaign." />
                  </>
                ) : (
                  <span>Incomplete</span>
                )}
              </div>
            </div>
          </div>

          <div
            className={`flex-1 h-0.5 ${
              contractComplete && draftComplete
                ? "bg-orange-500"
                : "bg-gray-300"
            }`}
          />

          {/* Draft Submitted */}
          <div className="flex-1">
            <div
              className={`p-4 rounded-md ${
                draftComplete
                  ? "bg-orange-500 text-white"
                  : "border-2 border-gray-300 bg-gray-50"
              } text-center mx-2`}
            >
              <div
                className={`text-sm ${draftComplete ? "text-white" : "text-gray-600"} mb-1`}
              >
                Draft Submitted
              </div>
              {draftComplete ? (
                <Button
                  variant="link"
                  className={`font-semibold underline cursor-pointer text-sm ${draftComplete ? "text-white" : ""}`}
                  onClick={() => onOpenPopup(creator.draft, creator.id, true)}
                >
                  {creator.final_approved ? "Completed" : "Pending Review"}
                </Button>
              ) : (
                <div className="text-gray-500 text-sm">Incomplete</div>
              )}
            </div>
          </div>

          <div
            className={`flex-1 h-0.5 ${
              draftComplete && finalComplete ? "bg-orange-500" : "bg-gray-300"
            }`}
          />

          {/* Live Submitted */}
          <div className="flex-1">
            <div
              className={`p-4 rounded-md ${
                finalComplete
                  ? "bg-orange-500 text-white"
                  : "border-2 border-gray-300 bg-gray-50"
              } text-center mx-2`}
            >
              <div
                className={`text-sm ${finalComplete ? "text-white" : "text-gray-600"} mb-1`}
              >
                Live Submitted
              </div>
              {finalComplete ? (
                <Button
                  variant="link"
                  className={`font-semibold underline cursor-pointer text-sm ${finalComplete ? "text-white" : ""}`}
                  onClick={() =>
                    onOpenPopup(creator.live_url, creator.id, false)
                  }
                >
                  Complete
                </Button>
              ) : (
                <div className="text-gray-500 text-sm">Incomplete</div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </Card>
  );
};

// Helper function to check if a field is completed
const isCompleted = (field: string) =>
  typeof field === "string" && field.trim().length > 0;

export default TimelineItem;
