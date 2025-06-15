import { motion } from "framer-motion";

const ReferralSkeleton = () => {
  return (
    <div className="max-w-md mx-auto">
      {/* Points Display Skeleton */}
      <div className="flex gap-2 md:gap-4 w-full my-4">
        <motion.div
          className="flex-1 bg-[#292B30] rounded p-4"
          animate={{ opacity: [0.5, 0.7, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          <div className="h-6 bg-gray-700 rounded w-3/4 mx-auto mb-2"></div>
          <div className="h-4 bg-gray-700 rounded w-1/2 mx-auto"></div>
        </motion.div>

        <motion.div
          className="flex-1 bg-[#292B30] rounded p-4"
          animate={{ opacity: [0.5, 0.7, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
        >
          <div className="h-6 bg-gray-700 rounded w-3/4 mx-auto mb-2"></div>
          <div className="h-4 bg-gray-700 rounded w-1/2 mx-auto"></div>
        </motion.div>
      </div>

      {/* Invite Skeleton */}
      <motion.div
        className="bg-[#292B30] rounded-lg p-6 my-6"
        animate={{ opacity: [0.5, 0.7, 0.5] }}
        transition={{ repeat: Infinity, duration: 1.5, delay: 0.3 }}
      >
        <div className="h-5 bg-gray-700 rounded w-3/4 mx-auto mb-3"></div>
        <div className="h-4 bg-gray-700 rounded w-5/6 mx-auto mb-2"></div>
        <div className="h-4 bg-gray-700 rounded w-4/6 mx-auto mb-4"></div>

        <div className="flex gap-2 items-center">
          <div className="flex-1 bg-[#333] p-3 rounded-lg h-12"></div>
          <div className="bg-Red h-12 w-32 rounded-lg"></div>
        </div>
      </motion.div>

      {/* History Skeleton */}
      {[1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className="border-b border-gray-700 py-4"
          animate={{ opacity: [0.5, 0.7, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5, delay: 0.1 * i }}
        >
          <div className="flex justify-between">
            <div>
              <div className="h-4 bg-gray-700 rounded w-32 mb-2"></div>
              <div className="h-5 bg-gray-700 rounded w-40 mb-2"></div>
            </div>
            <div className="flex flex-col items-end">
              <div className="h-6 bg-gray-700 rounded w-20 mb-2"></div>
              <div className="h-3 bg-gray-700 rounded w-16"></div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default ReferralSkeleton;
