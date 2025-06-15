import { motion } from "framer-motion";
import { HiOutlineBell } from "react-icons/hi";

const EmptyNotifications = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-20 px-4"
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20,
        }}
        className="w-16 h-16 bg-[#292B30] rounded-full flex items-center justify-center mb-4"
      >
        <HiOutlineBell className="text-3xl text-gray-400" />
      </motion.div>
      <h3 className="text-lg font-medium text-white mb-2">
        No notifications yet
      </h3>
      <p className="text-sm text-gray-400 text-center max-w-xs">
        When you get notifications, they'll show up here
      </p>
    </motion.div>
  );
};

export default EmptyNotifications;
