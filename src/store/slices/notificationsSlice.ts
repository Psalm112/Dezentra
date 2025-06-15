import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
  Notification,
  NotificationCount,
  MarkReadResponse,
} from "../../utils/types";
import { api } from "../../utils/services/apiService";

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  loading: "idle" | "pending" | "succeeded" | "failed";
  error: string | null;
  lastFetched: number | null;
  lastCountFetched: number | null;
}

const initialState: NotificationsState = {
  notifications: [],
  unreadCount: 0,
  loading: "idle",
  error: null,
  lastFetched: null,
  lastCountFetched: null,
};

const CACHE_TIMEOUT = 2 * 60 * 1000;

export const fetchNotifications = createAsyncThunk<
  Notification[],
  boolean | undefined,
  { rejectValue: string }
>(
  "notifications/fetchNotifications",
  async (forceRefresh = false, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { notifications: NotificationsState };
      const now = Date.now();

      if (
        !forceRefresh &&
        state.notifications.notifications.length > 0 &&
        state.notifications.lastFetched &&
        now - state.notifications.lastFetched < CACHE_TIMEOUT
      ) {
        return state.notifications.notifications;
      }

      const response = await api.getUserNotifications(forceRefresh);

      if (!response.ok) {
        return rejectWithValue(
          response.error || "Failed to fetch notifications"
        );
      }

      return response.data;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "An unknown error occurred";
      return rejectWithValue(message);
    }
  }
);

export const fetchUnreadCount = createAsyncThunk<
  number,
  boolean | undefined,
  { rejectValue: string }
>(
  "notifications/fetchUnreadCount",
  async (forceRefresh = false, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { notifications: NotificationsState };
      const now = Date.now();

      if (
        !forceRefresh &&
        state.notifications.lastCountFetched &&
        now - state.notifications.lastCountFetched < CACHE_TIMEOUT
      ) {
        return state.notifications.unreadCount;
      }

      const response = await api.getUnreadNotificationCount(forceRefresh);

      if (!response.ok) {
        return rejectWithValue(
          response.error || "Failed to fetch unread count"
        );
      }

      return (response.data as NotificationCount).count;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "An unknown error occurred";
      return rejectWithValue(message);
    }
  }
);

export const markNotificationsAsRead = createAsyncThunk<
  { success: boolean; notificationIds: string[] },
  string[],
  { rejectValue: string }
>("notifications/markAsRead", async (notificationIds, { rejectWithValue }) => {
  try {
    const response = await api.markNotificationsAsRead(notificationIds);

    if (!response.ok) {
      return rejectWithValue(
        response.error || "Failed to mark notifications as read"
      );
    }

    return {
      success: (response.data as MarkReadResponse).success,
      notificationIds,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unknown error occurred";
    return rejectWithValue(message);
  }
});

const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    clearNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
      state.lastFetched = null;
      state.lastCountFetched = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = "pending";
        state.error = null;
      })
      .addCase(
        fetchNotifications.fulfilled,
        (state, action: PayloadAction<Notification[]>) => {
          state.notifications = action.payload;
          state.loading = "succeeded";
          state.lastFetched = Date.now();

          state.unreadCount = action.payload.filter((n) => !n.read).length;
        }
      )
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = "failed";
        state.error = (action.payload as string) || "Unknown error occurred";
      })
      .addCase(fetchUnreadCount.pending, (state) => {
        state.loading = "pending";
        state.error = null;
      })
      .addCase(
        fetchUnreadCount.fulfilled,
        (state, action: PayloadAction<number>) => {
          state.unreadCount = action.payload;
          state.loading = "succeeded";
          state.lastCountFetched = Date.now();
        }
      )
      .addCase(fetchUnreadCount.rejected, (state, action) => {
        state.loading = "failed";
        state.error = (action.payload as string) || "Unknown error occurred";
      })
      .addCase(markNotificationsAsRead.pending, (state) => {
        state.loading = "pending";
        state.error = null;
      })
      .addCase(
        markNotificationsAsRead.fulfilled,
        (
          state,
          action: PayloadAction<{ success: boolean; notificationIds: string[] }>
        ) => {
          if (action.payload.success) {
            state.notifications = state.notifications.map((notification) =>
              action.payload.notificationIds.includes(notification._id)
                ? { ...notification, read: true }
                : notification
            );

            // Recalculate unread count
            state.unreadCount = state.notifications.filter(
              (n) => !n.read
            ).length;
          }
          state.loading = "succeeded";
        }
      )
      .addCase(markNotificationsAsRead.rejected, (state, action) => {
        state.loading = "failed";
        state.error = (action.payload as string) || "Unknown error occurred";
      });
  },
});

export const { clearNotifications } = notificationsSlice.actions;
export default notificationsSlice.reducer;
