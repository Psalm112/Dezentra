import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "./redux";
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationsAsRead,
} from "../../store/slices/notificationsSlice";
import {
  selectNotifications,
  selectUnreadCount,
  selectNotificationsLoading,
  selectNotificationsError,
  selectUnreadNotifications,
  selectReadNotifications,
  selectNotificationsByType,
  selectHasUnreadNotifications,
} from "../../store/selectors/notificationsSelectors";
import { useSnackbar } from "../../context/SnackbarContext";

export const useNotifications = () => {
  const dispatch = useAppDispatch();
  const { showSnackbar } = useSnackbar();

  const notifications = useAppSelector(selectNotifications);
  const unreadCount = useAppSelector(selectUnreadCount);
  const loading = useAppSelector(selectNotificationsLoading);
  const error = useAppSelector(selectNotificationsError);
  const unreadNotifications = useAppSelector(selectUnreadNotifications);
  const readNotifications = useAppSelector(selectReadNotifications);
  const hasUnread = useAppSelector(selectHasUnreadNotifications);

  const getNotificationsByType = useCallback((type: string) => {
    return useAppSelector(selectNotificationsByType(type));
  }, []);

  const fetchUserNotifications = useCallback(
    async (showNotifications = false, forceRefresh = false) => {
      try {
        await dispatch(fetchNotifications(forceRefresh)).unwrap();
        if (showNotifications) {
          showSnackbar("Notifications loaded successfully", "success");
        }
        return true;
      } catch (err) {
        if (showNotifications) {
          showSnackbar(
            (err as string) || "Failed to load notifications",
            "error"
          );
        }
        return false;
      }
    },
    [dispatch, showSnackbar]
  );

  const fetchUserUnreadCount = useCallback(
    async (showNotifications = false, forceRefresh = false) => {
      try {
        await dispatch(fetchUnreadCount(forceRefresh)).unwrap();
        return true;
      } catch (err) {
        if (showNotifications) {
          showSnackbar(
            (err as string) || "Failed to load unread count",
            "error"
          );
        }
        return false;
      }
    },
    [dispatch, showSnackbar]
  );

  const markAsRead = useCallback(
    async (notificationIds: string[], showNotifications = false) => {
      try {
        await dispatch(markNotificationsAsRead(notificationIds)).unwrap();
        if (showNotifications) {
          showSnackbar("Notifications marked as read", "success");
        }
        return true;
      } catch (err) {
        if (showNotifications) {
          showSnackbar(
            (err as string) || "Failed to mark notifications as read",
            "error"
          );
        }
        return false;
      }
    },
    [dispatch, showSnackbar]
  );

  const markAllAsRead = useCallback(async () => {
    const unreadIds = unreadNotifications.map((n) => n._id);
    if (unreadIds.length === 0) return true;

    return markAsRead(unreadIds, true);
  }, [unreadNotifications, markAsRead]);

  const refreshNotificationData = useCallback(
    async (showNotifications = false) => {
      await fetchUserUnreadCount(false, true);
      return fetchUserNotifications(showNotifications, true);
    },
    [fetchUserUnreadCount, fetchUserNotifications]
  );

  return {
    notifications,
    unreadCount,
    unreadNotifications,
    readNotifications,
    hasUnread,
    isLoading: loading === "pending",
    error,
    getNotificationsByType,
    fetchUserNotifications,
    fetchUserUnreadCount,
    markAsRead,
    markAllAsRead,
    refreshNotificationData,
    isError: loading === "failed" && error !== null,
    isSuccess: loading === "succeeded",
  };
};
