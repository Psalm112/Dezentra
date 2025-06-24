import { motion, AnimatePresence } from "framer-motion";
import {
  HiX,
  HiOutlineBell,
  HiOutlineCurrencyDollar,
  HiOutlineShoppingBag,
  HiOutlineInformationCircle,
} from "react-icons/hi";
import { Notification } from "../../utils/types";

interface NotificationModalProps {
  notification: Notification | null;
  isOpen: boolean;
  onClose: () => void;
  onMarkAsRead?: (id: string) => void;
}

const NotificationModal = ({
  notification,
  isOpen,
  onClose,
  onMarkAsRead,
}: NotificationModalProps) => {
  const getTimeString = (date: string) => {
    const notificationDate = new Date(date);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - notificationDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays < 1) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays <= 7) return `${diffDays} days ago`;
    if (diffDays <= 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays <= 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  const getNotificationIcon = () => {
    if (!notification)
      return <HiOutlineBell className="w-8 h-8 text-gray-400" />;

    switch (notification.type) {
      case "update":
        return <HiOutlineInformationCircle className="w-8 h-8 text-blue-400" />;
      case "funds":
        return <HiOutlineCurrencyDollar className="w-8 h-8 text-green-400" />;
      case "buyer":
        return <HiOutlineShoppingBag className="w-8 h-8 text-purple-400" />;
      default:
        return <HiOutlineBell className="w-8 h-8 text-gray-400" />;
    }
  };

  const getNotificationTypeLabel = () => {
    if (!notification) return "Notification";

    switch (notification.type) {
      case "update":
        return "System Update";
      case "funds":
        return "Funds Notification";
      case "buyer":
        return "Purchase Notification";
      default:
        return "Notification";
    }
  };

  const handleClose = () => {
    // Mark as read if not already read
    if (notification && !notification.read && onMarkAsRead) {
      onMarkAsRead(notification._id);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && notification && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-2xl mx-4 bg-[#1E1E1E] rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#333940]">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-[#333940] flex items-center justify-center">
                  {getNotificationIcon()}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    {getNotificationTypeLabel()}
                  </h2>
                  <p className="text-sm text-gray-400">
                    {getTimeString(notification.createdAt)}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 rounded-full hover:bg-[#333940] transition-colors duration-200"
              >
                <HiX className="w-6 h-6 text-gray-400 hover:text-white" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="space-y-4">
                <div className="bg-[#292B30] rounded-lg p-4">
                  <p className="text-white text-lg leading-relaxed">
                    {notification.message}
                  </p>
                </div>

                {/* Metadata section if available */}
                {notification.metadata &&
                  Object.keys(notification.metadata).length > 0 && (
                    <div className="bg-[#22252b] rounded-lg p-4">
                      <h3 className="text-sm font-medium text-gray-300 mb-3">
                        Additional Details
                      </h3>
                      <div className="space-y-2">
                        {Object.entries(notification.metadata).map(
                          ([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="text-sm text-gray-400 capitalize">
                                {key.replace(/([A-Z])/g, " $1").trim()}:
                              </span>
                              <span className="text-sm text-white">
                                {typeof value === "string"
                                  ? value
                                  : JSON.stringify(value)}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                {/* Status indicator */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        notification.read ? "bg-gray-500" : "bg-red-500"
                      }`}
                    />
                    <span className="text-sm text-gray-400">
                      {notification.read ? "Read" : "Unread"}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    ID: {notification._id.slice(-8)}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end p-6 border-t border-[#333940]">
              <button
                onClick={handleClose}
                className="px-6 py-2 bg-[#333940] text-white rounded-lg hover:bg-[#404550] transition-colors duration-200"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotificationModal;
