import React from "react";
import { motion } from "framer-motion";
import EmptyReferralHistory from "./EmptyReferralHistory";
import { ReferralHistoryProps, RewardItem } from "../../../../utils/types";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const ReferralHistoryItem = React.memo(
  ({ item: historyItem, index }: { item: RewardItem; index: number }) => (
    <motion.div
      variants={item}
      className="bg-[#292B30] px-4 py-4 md:px-6 flex flex-col"
    >
      <div className="flex justify-between items-start">
        <div>
          {(historyItem.action || historyItem.name) && (
            <p className="text-white">
              {historyItem.action && (
                <span className="text-gray-400">
                  {historyItem.action}:&nbsp;
                </span>
              )}
              {historyItem.name}
            </p>
          )}

          <p
            className={`${index !== 0 ? "text-white" : "text-Red"} font-medium`}
          >
            {historyItem.type}
          </p>

          {historyItem.status && (
            <p className="text-gray-400 text-sm mt-1">{historyItem.status}</p>
          )}
        </div>

        <div className="flex flex-col items-end mt-auto">
          {historyItem.points > 0 && (
            <span className="text-Red bg-red-900 bg-opacity-20 px-2 py-1 rounded-full text-sm">
              +{historyItem.points} points
            </span>
          )}

          <span className="text-gray-500 text-xs mt-1">{historyItem.date}</span>
        </div>
      </div>
    </motion.div>
  )
);

const ReferralHistory: React.FC<ReferralHistoryProps> = ({
  history,
  // onInviteFriends,
}) => {
  if (!history || history.length === 0) {
    return <EmptyReferralHistory />;
  }

  return (
    <motion.div
      className="w-full"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <div className="flex flex-col gap-y-4">
        {history.map((item, index) => (
          <ReferralHistoryItem key={item.id} item={item} index={index} />
        ))}
      </div>
    </motion.div>
  );
};

export default React.memo(ReferralHistory);
