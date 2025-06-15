import { FC, ReactNode } from "react";
import { motion } from "framer-motion";

interface StatusBadgeProps {
  status: string;
  icon?: ReactNode;
  type?: "pending" | "completed" | "error";
  className?: string;
}

const StatusBadge: FC<StatusBadgeProps> = ({
  status,
  icon,
  type = "pending",
  className = "",
}) => {
  const bgColor = {
    pending: "bg-blue-500",
    completed: "bg-green-500",
    error: "bg-red-500",
  }[type];

  return (
    <motion.span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-white ${bgColor} ${className}`}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {icon && <span className="mr-1">{icon}</span>}
      {status}
    </motion.span>
  );
};

export default StatusBadge;
