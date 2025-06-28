import { FC, memo, useCallback } from "react";
import { motion } from "framer-motion";

interface TabProps {
  text: string;
  isActive: boolean;
  onClick: () => void;
  count?: number;
  className?: string;
}

const Tab: FC<TabProps> = memo(
  ({ text, isActive, onClick, count, className = "" }) => {
    const handleClick = useCallback(() => {
      onClick();
    }, [onClick]);

    const displayCount = count !== undefined ? count : 0;

    return (
      <motion.button
        className={`flex-1 px-4 py-3 text-sm font-medium transition-colors duration-200 ${
          isActive
            ? "bg-Red text-white"
            : "bg-transparent text-gray-400 hover:text-white hover:bg-gray-800"
        } ${className}`}
        onClick={handleClick}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
      >
        <div className="flex items-center justify-center gap-2">
          <span>{text}</span>
          {count !== undefined && (
            <span className="bg-white bg-opacity-20 text-xs px-2 py-1 rounded-full">
              {displayCount}
            </span>
          )}
        </div>
      </motion.button>
    );
  }
);

Tab.displayName = "Tab";

export default Tab;
