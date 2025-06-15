import { useEffect } from "react";
import { useChat } from "./useChat";

export const useChatEffect = (userId?: string, autoRefresh = true) => {
  const {
    loadConversations,
    loadConversation,
    selectRecipient,
    currentRecipient,
  } = useChat();

  useEffect(() => {
    // Initial load of conversations
    loadConversations(false, true);

    // Set up polling for new messages
    let intervalId: NodeJS.Timeout | null = null;

    if (autoRefresh) {
      intervalId = setInterval(() => {
        loadConversations(false, true);

        if (userId && userId === currentRecipient) {
          loadConversation(userId, false);
        }
      }, 15000); // Poll every 15 seconds
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [
    loadConversations,
    loadConversation,
    userId,
    currentRecipient,
    autoRefresh,
  ]);

  // Effect for setting active conversation
  useEffect(() => {
    if (userId && userId !== currentRecipient) {
      selectRecipient(userId);
      loadConversation(userId, false);
    }
  }, [userId, currentRecipient, selectRecipient, loadConversation]);
};
