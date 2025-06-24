import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { HiChevronRight } from "react-icons/hi";
import {
  HiOutlineBell,
  HiOutlineCurrencyDollar,
  HiOutlineShoppingBag,
  HiOutlineInformationCircle,
} from "react-icons/hi";
import { Notification } from "../../utils/types";
import { useState } from "react";
import NotificationModal from "./NotificationModal";

interface NotificationItemProps {
  notification: Notification;
  onRead: (id: string) => void;
}

const NotificationItem = ({ notification, onRead }: NotificationItemProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const handleClick = () => {
    setIsModalOpen(true);
    if (!notification.read) {
      onRead(notification._id);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // const link = notification.metadata?.orderId
  //   ? `/notifications/type/${notification.metadata._id}`
  //   : undefined;

  const getNotificationIcon = () => {
    switch (notification.type) {
      case "update":
        return <HiOutlineInformationCircle className="w-6 h-6 text-blue-400" />;
      case "funds":
        return <HiOutlineCurrencyDollar className="w-6 h-6 text-green-400" />;
      case "buyer":
        return <HiOutlineShoppingBag className="w-6 h-6 text-purple-400" />;
      default:
        return <HiOutlineBell className="w-6 h-6 text-gray-400" />;
    }
  };

  const itemContent = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={`flex items-start p-4 cursor-pointer hover:bg-[#333940] transition-colors duration-200 ${
        notification.read ? "bg-[#22252b]" : "bg-[#292B30]"
      }`}
      onClick={handleClick}
    >
      <div className="flex-shrink-0 mr-3 w-10 h-10 rounded-full bg-[#333940] flex items-center justify-center">
        {getNotificationIcon()}
      </div>

      <div className="flex-grow min-w-0">
        <div className="flex justify-between items-start">
          <p
            className={`text-sm ${
              !notification.read ? "text-white" : "text-gray-300"
            }`}
          >
            {notification.message}
          </p>
          {!notification.read && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-2 h-2 rounded-full bg-Red flex-shrink-0 ml-2 mt-1"
            />
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {getTimeString(notification.createdAt)}
        </p>
      </div>

      <HiChevronRight className="text-gray-400 flex-shrink-0 ml-2 text-lg" />
    </motion.div>
  );

  return (
    <>
      {itemContent}
      <NotificationModal
        notification={notification}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onMarkAsRead={onRead}
      />
    </>
  );
};

export default NotificationItem;
