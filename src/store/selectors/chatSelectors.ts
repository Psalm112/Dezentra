import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "../store";

export const selectConversations = (state: RootState) =>
  state.chat.conversations;
export const selectCurrentConversation = (state: RootState) =>
  state.chat.currentConversation;
export const selectCurrentRecipient = (state: RootState) =>
  state.chat.currentRecipient;
export const selectChatLoading = (state: RootState) => state.chat.loading;
export const selectChatError = (state: RootState) => state.chat.error;

export const selectTotalUnreadMessages = createSelector(
  [selectConversations],
  (conversations) => {
    return conversations.reduce((total, conversation) => {
      return total + conversation.unreadCount;
    }, 0);
  }
);

export const selectFormattedConversations = createSelector(
  [selectConversations],
  (conversations) => {
    return conversations.map((conversation) => {
      const lastMessageTime = new Date(conversation.lastMessage.createdAt);
      const now = new Date();

      // Format timestamp as "Today, 15:42" or "Apr 23, 15:42" or "12/15/2024, 15:42"
      let formattedTime;
      if (lastMessageTime.toDateString() === now.toDateString()) {
        formattedTime = `Today, ${lastMessageTime
          .getHours()
          .toString()
          .padStart(2, "0")}:${lastMessageTime
          .getMinutes()
          .toString()
          .padStart(2, "0")}`;
      } else if (now.getFullYear() === lastMessageTime.getFullYear()) {
        const month = lastMessageTime.toLocaleString("default", {
          month: "short",
        });
        const day = lastMessageTime.getDate();
        formattedTime = `${month} ${day}, ${lastMessageTime
          .getHours()
          .toString()
          .padStart(2, "0")}:${lastMessageTime
          .getMinutes()
          .toString()
          .padStart(2, "0")}`;
      } else {
        formattedTime = lastMessageTime.toLocaleDateString();
      }

      return {
        ...conversation,
        formattedTime,
        // Preview shows truncated message content (first 30 chars)
        preview:
          conversation.lastMessage.content.length > 30
            ? `${conversation.lastMessage.content.substring(0, 30)}...`
            : conversation.lastMessage.content,
      };
    });
  }
);

export const selectFormattedCurrentConversation = createSelector(
  [selectCurrentConversation],
  (messages) => {
    return messages.map((message) => {
      const messageTime = new Date(message.createdAt);

      return {
        ...message,
        formattedTime: `${messageTime
          .getHours()
          .toString()
          .padStart(2, "0")}:${messageTime
          .getMinutes()
          .toString()
          .padStart(2, "0")}`,
      };
    });
  }
);

export const selectActiveConversation = createSelector(
  [selectConversations, selectCurrentRecipient],
  (conversations, currentRecipient) => {
    if (!currentRecipient) return null;

    return (
      conversations.find(
        (conversation) => conversation.user._id === currentRecipient
      ) || null
    );
  }
);
