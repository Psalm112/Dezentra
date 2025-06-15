import { motion } from "framer-motion";

interface NotificationBadgeProps {
  count: number;
}

const NotificationBadge = ({ count }: NotificationBadgeProps) => {
  if (count <= 0) return null;

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-Red flex items-center justify-center"
    >
      <span className="text-white text-[10px] font-bold">
        {count > 9 ? "9+" : count}
      </span>
    </motion.div>
  );
};

export default NotificationBadge;
