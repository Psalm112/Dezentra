import { FC, ReactNode } from "react";
import { motion } from "framer-motion";

interface TradeCardBaseProps {
  children: ReactNode;
  className?: string;
}

const TradeCardBase: FC<TradeCardBaseProps> = ({
  children,
  className = "",
}) => {
  return (
    <motion.div
      className={`bg-[#292B30] rounded-lg overflow-hidden shadow-lg ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      whileHover={{
        scale: 1.01,
        transition: { duration: 0.2 },
      }}
      layout
    >
      {children}
    </motion.div>
  );
};

export default TradeCardBase;
