// src/components/account/referrals/PointsDisplay.tsx (mobile optimized)
import { motion } from "framer-motion";

interface PointsDisplayProps {
  activePoints: number;
  usedPoints: number;
}

const PointsDisplay: React.FC<PointsDisplayProps> = ({
  activePoints,
  usedPoints,
}) => {
  return (
    <motion.div
      className="flex flex-col xs:flex-row gap-2 md:gap-4 w-full max-w-md mx-auto my-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        className="flex-1 bg-[#292B30] rounded p-4 text-center"
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
      >
        <p className="text-xl font-bold text-white">{activePoints} Points</p>
        <p className="text-sm text-gray-400">Active Points</p>
      </motion.div>

      <motion.div
        className="flex-1 bg-[#292B30] rounded p-4 text-center opacity-70"
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
      >
        <p className="text-xl font-bold text-white">{usedPoints} Points</p>
        <p className="text-sm text-gray-400">Used Points</p>
      </motion.div>
    </motion.div>
  );
};

export default PointsDisplay;
