import { useCallback, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "./redux";
import {
  sendMessage,
  getConversation,
  markMessagesAsRead,
  getConversations,
  setCurrentRecipient,
  clearChatState,
  addLocalMessage,
} from "../../store/slices/chatSlice";
import {
  selectConversations,
  selectCurrentConversation,
  selectChatLoading,
  selectChatError,
  selectCurrentRecipient,
  selectFormattedConversations,
  selectFormattedCurrentConversation,
  selectTotalUnreadMessages,
  selectActiveConversation,
} from "../../store/selectors/chatSelectors";
import { useSnackbar } from "../../context/SnackbarContext";
import { Message, SendMessageParams, MarkReadParams } from "../types";
import { useAuth } from "../../context/AuthContext";

export const useChat = () => {
  const dispatch = useAppDispatch();
  const { showSnackbar } = useSnackbar();
  const { user } = useAuth();

  const conversations = useAppSelector(selectConversations);
  const formattedConversations = useAppSelector(selectFormattedConversations);
  const currentConversation = useAppSelector(selectCurrentConversation);
  const formattedCurrentConversation = useAppSelector(
    selectFormattedCurrentConversation
  );
  const currentRecipient = useAppSelector(selectCurrentRecipient);
  const activeConversation = useAppSelector(selectActiveConversation);
  const totalUnreadMessages = useAppSelector(selectTotalUnreadMessages);
  const loading = useAppSelector(selectChatLoading);
  const error = useAppSelector(selectChatError);

  // Auto-mark messages as read when entering a conversation
  useEffect(() => {
    if (currentRecipient && currentConversation.length > 0) {
      const unreadMessages = currentConversation
        .filter((msg) => !msg.read && msg.sender !== user?._id)
        .map((msg) => msg._id);

      if (unreadMessages.length > 0) {
        handleMarkAsRead({ messageIds: unreadMessages });
      }
    }
  }, [currentRecipient, currentConversation, user?._id]);

  const handleSendMessage = useCallback(
    async (messageData: SendMessageParams, showNotifications = false) => {
      try {
        await dispatch(sendMessage(messageData)).unwrap();

        // Auto-refresh conversations after sending
        dispatch(getConversations({ forceRefresh: true }));

        if (showNotifications) {
          showSnackbar("Message sent successfully", "success");
        }
        return true;
      } catch (err) {
        if (showNotifications) {
          showSnackbar((err as string) || "Failed to send message", "error");
        }
        return false;
      }
    },
    [dispatch, showSnackbar]
  );

  const handleLoadConversation = useCallback(
    async (userId: string, preventAbort = false, showNotifications = false) => {
      try {
        await dispatch(getConversation({ userId, preventAbort })).unwrap();

        if (showNotifications) {
          showSnackbar("Conversation loaded successfully", "success");
        }
        return true;
      } catch (err) {
        if (showNotifications) {
          showSnackbar(
            (err as string) || "Failed to load conversation",
            "error"
          );
        }
        return false;
      }
    },
    [dispatch, showSnackbar]
  );

  const handleMarkAsRead = useCallback(
    async (params: MarkReadParams, showNotifications = false) => {
      try {
        await dispatch(markMessagesAsRead(params)).unwrap();

        // Auto-refresh conversations to update unread counts
        dispatch(getConversations({ forceRefresh: true }));

        if (showNotifications) {
          showSnackbar("Messages marked as read", "success");
        }
        return true;
      } catch (err) {
        if (showNotifications) {
          showSnackbar(
            (err as string) || "Failed to mark messages as read",
            "error"
          );
        }
        return false;
      }
    },
    [dispatch, showSnackbar]
  );

  const handleLoadConversations = useCallback(
    async (
      forceRefresh = false,
      preventAbort = false,
      showNotifications = false
    ) => {
      try {
        await dispatch(
          getConversations({ forceRefresh, preventAbort })
        ).unwrap();

        if (showNotifications) {
          showSnackbar("Conversations loaded successfully", "success");
        }
        return true;
      } catch (err) {
        if (showNotifications) {
          showSnackbar(
            (err as string) || "Failed to load conversations",
            "error"
          );
        }
        return false;
      }
    },
    [dispatch, showSnackbar]
  );

  const handleSelectRecipient = useCallback(
    (userId: string) => {
      dispatch(setCurrentRecipient(userId));
      handleLoadConversation(userId);
    },
    [dispatch, handleLoadConversation]
  );

  const handleClearChat = useCallback(() => {
    dispatch(clearChatState());
  }, [dispatch]);

  // Add message locally
  const addMessageLocally = useCallback(
    (message: Message) => {
      dispatch(addLocalMessage(message));
    },
    [dispatch]
  );

  return {
    conversations,
    formattedConversations,
    currentConversation,
    formattedCurrentConversation,
    currentRecipient,
    activeConversation,
    totalUnreadMessages,
    isLoading: loading === "pending",
    error,
    sendMessage: handleSendMessage,
    loadConversation: handleLoadConversation,
    markAsRead: handleMarkAsRead,
    loadConversations: handleLoadConversations,
    selectRecipient: handleSelectRecipient,
    clearChat: handleClearChat,
    addMessageLocally,
    isError: loading === "failed" && error !== null,
    isSuccess: loading === "succeeded",
  };
};
