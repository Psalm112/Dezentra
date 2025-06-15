import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
  Message,
  Conversation,
  MarkReadParams,
  SendMessageParams,
} from "../../utils/types";
import { api } from "../../utils/services/apiService";

interface ChatState {
  conversations: Conversation[];
  currentConversation: Message[];
  currentRecipient: string | null;
  loading: "idle" | "pending" | "succeeded" | "failed";
  error: string | null;
  lastFetched: number | null;
}

const initialState: ChatState = {
  conversations: [],
  currentConversation: [],
  currentRecipient: null,
  loading: "idle",
  error: null,
  lastFetched: null,
};

// Cache timeout (2 minutes)
const CACHE_TIMEOUT = 2 * 60 * 1000;

export const sendMessage = createAsyncThunk<
  Message,
  SendMessageParams,
  { rejectValue: string }
>("chat/sendMessage", async (messageData, { rejectWithValue }) => {
  try {
    const response = await api.sendMessage(messageData);

    if (!response.ok) {
      return rejectWithValue(response.error || "Failed to send message");
    }

    return response.data;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unknown error occurred";
    return rejectWithValue(message);
  }
});

export const getConversation = createAsyncThunk<
  Message[],
  { userId: string; preventAbort?: boolean },
  { rejectValue: string }
>(
  "chat/getConversation",
  async ({ userId, preventAbort = false }, { rejectWithValue, dispatch }) => {
    try {
      dispatch(setCurrentRecipient(userId));
      const response = await api.getConversation(userId, preventAbort);

      if (!response.ok) {
        return rejectWithValue(response.error || "Failed to load conversation");
      }

      return response.data;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "An unknown error occurred";
      return rejectWithValue(message);
    }
  }
);

export const markMessagesAsRead = createAsyncThunk<
  { success: boolean; messageIds: string[] },
  MarkReadParams,
  { rejectValue: string }
>("chat/markMessagesAsRead", async (params, { rejectWithValue }) => {
  try {
    const response = await api.markMessagesAsRead(params);

    if (!response.ok) {
      return rejectWithValue(
        response.error || "Failed to mark messages as read"
      );
    }

    return { ...response.data, messageIds: params.messageIds };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unknown error occurred";
    return rejectWithValue(message);
  }
});

export const getConversations = createAsyncThunk<
  Conversation[],
  { forceRefresh?: boolean; preventAbort?: boolean } | undefined,
  { rejectValue: string; state: { chat: ChatState } }
>(
  "chat/getConversations",
  async (
    {
      forceRefresh = false,
      preventAbort = false,
    }: { forceRefresh?: boolean; preventAbort?: boolean } = {},
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState();
      const now = Date.now();

      if (
        !forceRefresh &&
        state.chat.conversations.length > 0 &&
        state.chat.lastFetched &&
        now - state.chat.lastFetched < CACHE_TIMEOUT
      ) {
        return state.chat.conversations;
      }

      const response = await api.getConversations(forceRefresh, preventAbort);

      if (!response.ok) {
        return rejectWithValue(
          response.error || "Failed to fetch conversations"
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

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    clearChatState: (state) => {
      state.conversations = [];
      state.currentConversation = [];
      state.currentRecipient = null;
      state.lastFetched = null;
    },
    setCurrentRecipient: (state, action: PayloadAction<string>) => {
      state.currentRecipient = action.payload;
    },
    addLocalMessage: (state, action: PayloadAction<Message>) => {
      state.currentConversation.push(action.payload);
      console.log("local", state.currentConversation);
      const conversationIndex = state.conversations.findIndex(
        (conv) => conv.user._id === action.payload.recipient
      );

      if (conversationIndex !== -1) {
        state.conversations[conversationIndex].lastMessage = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Send Message
      .addCase(sendMessage.pending, (state) => {
        state.loading = "pending";
        state.error = null;
      })
      .addCase(
        sendMessage.fulfilled,
        (state, action: PayloadAction<Message>) => {
          state.loading = "succeeded";

          if (
            state.currentRecipient === action.payload.recipient ||
            state.currentRecipient === action.payload.sender
          ) {
            state.currentConversation.push(action.payload);
          }

          // Update conversation list
          const existingConvIndex = state.conversations.findIndex(
            (conv) => conv.user._id === action.payload.recipient
          );

          if (existingConvIndex !== -1) {
            state.conversations[existingConvIndex].lastMessage = action.payload;
            const updatedConv = state.conversations[existingConvIndex];
            state.conversations.splice(existingConvIndex, 1);
            state.conversations.unshift(updatedConv);
          } else {
            // new conversation,  refresh the list
            // if (action.payload.recipient) {
            //   const newConversation: Conversation = {
            //     user: action.payload.recipient,
            //     lastMessage: action.payload,
            //     unreadCount: 0,
            //   };
            //   state.conversations.unshift(newConversation);
            // }
            // state.lastFetched = null;
          }
        }
      )
      .addCase(sendMessage.rejected, (state, action) => {
        state.loading = "failed";
        state.error = (action.payload as string) || "Unknown error occurred";
      })

      // Get Conversation
      .addCase(getConversation.pending, (state) => {
        state.loading = "pending";
        state.error = null;
      })
      .addCase(
        getConversation.fulfilled,
        (state, action: PayloadAction<Message[]>) => {
          state.loading = "succeeded";
          state.currentConversation = action.payload;
        }
      )
      .addCase(getConversation.rejected, (state, action) => {
        state.loading = "failed";
        state.error = (action.payload as string) || "Unknown error occurred";
      })

      // Mark Messages as Read
      .addCase(markMessagesAsRead.pending, (state) => {
        state.loading = "pending";
        state.error = null;
      })
      .addCase(
        markMessagesAsRead.fulfilled,
        (
          state,
          action: PayloadAction<{ success: boolean; messageIds: string[] }>
        ) => {
          state.loading = "succeeded";

          // Update read status in current conversation
          action.payload.messageIds.forEach((messageId) => {
            const messageToUpdate = state.currentConversation.find(
              (msg) => msg._id === messageId
            );
            if (messageToUpdate) {
              messageToUpdate.read = true;
            }
          });

          // Update unread counts in conversations list
          if (state.currentRecipient) {
            const conversationToUpdate = state.conversations.find(
              (conv) => conv.user._id === state.currentRecipient
            );
            if (conversationToUpdate) {
              conversationToUpdate.unreadCount = 0;
            }
          }
        }
      )
      .addCase(markMessagesAsRead.rejected, (state, action) => {
        state.loading = "failed";
        state.error = (action.payload as string) || "Unknown error occurred";
      })

      // Get Conversations
      .addCase(getConversations.pending, (state) => {
        state.loading = "pending";
        state.error = null;
      })
      .addCase(
        getConversations.fulfilled,
        (state, action: PayloadAction<Conversation[]>) => {
          state.loading = "succeeded";
          state.conversations = action.payload;
          state.lastFetched = Date.now();
        }
      )
      .addCase(getConversations.rejected, (state, action) => {
        state.loading = "failed";
        state.error = (action.payload as string) || "Unknown error occurred";
      });
  },
});

export const { clearChatState, setCurrentRecipient, addLocalMessage } =
  chatSlice.actions;
export default chatSlice.reducer;
