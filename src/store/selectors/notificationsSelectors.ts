import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "../store";

export const selectNotifications = (state: RootState) =>
  state.notifications.notifications;
export const selectUnreadCount = (state: RootState) =>
  state.notifications.unreadCount;
export const selectNotificationsLoading = (state: RootState) =>
  state.notifications.loading;
export const selectNotificationsError = (state: RootState) =>
  state.notifications.error;

export const selectUnreadNotifications = createSelector(
  [selectNotifications],
  (notifications) => notifications.filter((notification) => !notification.read)
);

export const selectReadNotifications = createSelector(
  [selectNotifications],
  (notifications) => notifications.filter((notification) => notification.read)
);

export const selectNotificationsByType = (type: string) =>
  createSelector([selectNotifications], (notifications) =>
    notifications.filter((notification) => notification.type === type)
  );

export const selectHasUnreadNotifications = createSelector(
  [selectUnreadCount],
  (count) => count > 0
);
