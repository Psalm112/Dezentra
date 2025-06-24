import { useState, useCallback } from "react";
import { Notification } from "../../utils/types";

export const useNotificationModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);

  const openModal = useCallback((notification: Notification) => {
    setSelectedNotification(notification);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setSelectedNotification(null);
  }, []);

  return {
    isOpen,
    selectedNotification,
    openModal,
    closeModal,
  };
};
