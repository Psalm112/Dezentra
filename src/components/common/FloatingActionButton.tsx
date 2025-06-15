import { FC, ReactNode } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

interface FloatingActionButtonProps {
  icon: ReactNode;
  to: string;
  label?: string;
  position?: "bottom-right" | "bottom-center";
  color?: "primary" | "secondary";
}

const FloatingActionButton: FC<FloatingActionButtonProps> = ({
  icon,
  to,
  label,
  position = "bottom-right",
  color = "primary",
}) => {
  const positionClasses = {
    "bottom-right": "bottom-20 md:bottom-6 right-4 md:right-6",
    "bottom-center":
      "bottom-20 md:bottom-6 left-1/2 transform -translate-x-1/2",
  };

  const colorClasses = {
    primary:
      "bg-Red text-white hover:bg-[#e02d37] transition-colors duration-200",
    secondary:
      "bg-[#212428] text-white hover:bg-[#292B30] transition-colors duration-200",
  };

  return (
    <motion.div
      className={`fixed z-40 ${positionClasses[position]} flex flex-col items-center`}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20,
        delay: 0.1,
      }}
    >
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Link
          to={to}
          className={`flex items-center justify-center ${colorClasses[color]} rounded-full shadow-lg p-3 md:p-4 min-w-[48px] min-h-[48px] md:min-w-[56px] md:min-h-[56px]`}
          aria-label={label || "Action button"}
        >
          <div className="text-lg md:text-xl flex items-center justify-center">
            {icon}
          </div>
        </Link>
      </motion.div>

      {label && (
        <motion.span
          className="hidden md:block mt-2 text-xs bg-[#292B30] text-white px-2 py-1 rounded whitespace-nowrap shadow-lg pointer-events-none text-center"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {label}
        </motion.span>
      )}
    </motion.div>
  );
};

export default FloatingActionButton;
