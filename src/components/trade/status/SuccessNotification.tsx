import { FC } from "react";
import { motion } from "framer-motion";
import { FaCheck } from "react-icons/fa";
import { MdClose } from "react-icons/md";

interface SuccessNotificationProps {
  message: string;
  onClose?: () => void;
}

const SuccessNotification: FC<SuccessNotificationProps> = ({
  message,
  onClose,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      // className="bg-green-100 text-green-800 p-4 rounded-lg mb-6 flex items-center justify-between"
      className="bg-green-50 border border-green-200 text-green-800 rounded-md p-4 flex items-center justify-between mb-6"
    >
      <div className="flex items-center gap-2">
        <FaCheck className="text-green-500" />
        <span>{message}</span>
      </div>

      {onClose && (
        <button
          className="text-gray-500 hover:text-gray-700 transition-colors"
          onClick={onClose}
          aria-label="Close notification"
        >
          <MdClose className="text-lg" />
        </button>
      )}
    </motion.div>
  );
};

export default SuccessNotification;
