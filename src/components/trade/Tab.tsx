import { FC } from "react";
import { motion } from "framer-motion";
interface TabProps {
  text: string;
  isActive: boolean;
  onClick: () => void;
  count?: number;
  className?: string;
}

const Tab: FC<TabProps> = ({ text, isActive, onClick, count, className }) => (
  <motion.button
    className={`flex items-center justify-center py-4 px-2 text-center font-medium relative ${
      isActive ? "text-Red" : "text-[#545456]"
    }
    ${className}`}
    onClick={onClick}
    whileHover={{ backgroundColor: "rgba(255,255,255,0.05)" }}
    whileTap={{ scale: 0.98 }}
  >
    {text}
    {count !== undefined && (
      <motion.span
        className={`ml-2 text-white text-xs rounded-full px-2 py-0.5 ${
          !isActive ? "bg-[#FFFFFF1A]" : "bg-Red"
        }`}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 25 }}
      >
        {count}
      </motion.span>
    )}
    {isActive && (
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-0.5 bg-Red"
        layoutId="activeTab"
        initial={{ width: "0%" }}
        animate={{ width: "100%" }}
        transition={{ duration: 0.3 }}
      />
    )}
  </motion.button>
);

export default Tab;
