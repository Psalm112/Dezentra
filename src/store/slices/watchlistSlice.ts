import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { WatchlistItem, WatchlistCheck } from "../../utils/types";
import { api } from "../../utils/services/apiService";

interface WatchlistState {
  items: WatchlistItem[];
  loading: "idle" | "pending" | "succeeded" | "failed";
  error: string | null;
  lastFetched: number | null;
  isWatchlist: { [productId: string]: boolean };
}

const initialState: WatchlistState = {
  items: [],
  loading: "idle",
  error: null,
  lastFetched: null,
  isWatchlist: {},
};

// Cache timeout (5 minutes)
const CACHE_TIMEOUT = 5 * 60 * 1000;

export const fetchWatchlist = createAsyncThunk<
  WatchlistItem[],
  boolean | undefined,
  { rejectValue: string }
>(
  "watchlist/fetchWatchlist",
  async (forceRefresh = false, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { watchlist: WatchlistState };
      const now = Date.now();

      // Skip fetching if data is fresh and not forcing refresh
      if (
        !forceRefresh &&
        state.watchlist.items.length > 0 &&
        state.watchlist.lastFetched &&
        now - state.watchlist.lastFetched < CACHE_TIMEOUT
      ) {
        return state.watchlist.items;
      }

      const response = await api.getUserWatchlist(forceRefresh);

      if (!response.ok) {
        return rejectWithValue(response.error || "Failed to fetch watchlist");
      }

      return response.data;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "An unknown error occurred";
      return rejectWithValue(message);
    }
  }
);

export const checkWatchlist = createAsyncThunk<
  { isWatchlist: boolean; productId: string },
  string,
  { rejectValue: string }
>("watchlist/checkWatchlist", async (productId, { rejectWithValue }) => {
  try {
    const response = await api.checkWatchlist(productId);

    if (!response.ok) {
      return rejectWithValue(
        response.error || "Failed to check watchlist status"
      );
    }

    return {
      isWatchlist: (response.data as WatchlistCheck).isWatchlist,
      productId,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unknown error occurred";
    return rejectWithValue(message);
  }
});

export const addToWatchlist = createAsyncThunk<
  WatchlistItem,
  string,
  { rejectValue: string }
>("watchlist/addToWatchlist", async (productId, { rejectWithValue }) => {
  try {
    const response = await api.addToWatchlist(productId);

    if (!response.ok) {
      return rejectWithValue(response.error || "Failed to add to watchlist");
    }

    return response.data;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unknown error occurred";
    return rejectWithValue(message);
  }
});

export const removeFromWatchlist = createAsyncThunk<
  { success: boolean; productId: string },
  string,
  { rejectValue: string }
>("watchlist/removeFromWatchlist", async (productId, { rejectWithValue }) => {
  try {
    const response = await api.removeFromWatchlist(productId);

    if (!response.ok) {
      return rejectWithValue(
        response.error || "Failed to remove from watchlist"
      );
    }

    return { ...response.data, productId };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unknown error occurred";
    return rejectWithValue(message);
  }
});

const watchlistSlice = createSlice({
  name: "watchlist",
  initialState,
  reducers: {
    clearWatchlist: (state) => {
      state.items = [];
      state.lastFetched = null;
      state.isWatchlist = {};
    },
    // Add immediate state update for better UX
    optimisticAddToWatchlist: (state, action: PayloadAction<string>) => {
      state.isWatchlist[action.payload] = true;
    },
    optimisticRemoveFromWatchlist: (state, action: PayloadAction<string>) => {
      state.isWatchlist[action.payload] = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWatchlist.pending, (state) => {
        state.loading = "pending";
        state.error = null;
      })
      .addCase(
        fetchWatchlist.fulfilled,
        (state, action: PayloadAction<WatchlistItem[]>) => {
          state.items = action.payload;
          state.loading = "succeeded";
          state.lastFetched = Date.now();

          // Update isWatchlist object
          const newIsWatchlist: { [productId: string]: boolean } = {};
          action.payload.forEach((item) => {
            newIsWatchlist[item.product?._id] = true;
          });
          state.isWatchlist = newIsWatchlist;
        }
      )
      .addCase(fetchWatchlist.rejected, (state, action) => {
        state.loading = "failed";
        state.error = (action.payload as string) || "Unknown error occurred";
      })
      .addCase(checkWatchlist.fulfilled, (state, action) => {
        state.isWatchlist[action.payload.productId] =
          action.payload.isWatchlist;
      })
      .addCase(addToWatchlist.pending, (state, action) => {
        // Optimistic update
        state.isWatchlist[action.meta.arg] = true;
        state.error = null;
      })
      .addCase(
        addToWatchlist.fulfilled,
        (state, action: PayloadAction<WatchlistItem>) => {
          // Confirm the optimistic update
          state.isWatchlist[action.payload.product._id] = true;

          // Add to items if not already present
          if (!state.items.some((item) => item._id === action.payload._id)) {
            state.items.push(action.payload);
          }

          state.loading = "succeeded";
        }
      )
      .addCase(addToWatchlist.rejected, (state, action) => {
        // Revert optimistic update
        state.isWatchlist[action.meta.arg] = false;
        state.loading = "failed";
        state.error = (action.payload as string) || "Unknown error occurred";
      })
      .addCase(removeFromWatchlist.pending, (state, action) => {
        // Optimistic update
        state.isWatchlist[action.meta.arg] = false;
        state.error = null;
      })
      .addCase(
        removeFromWatchlist.fulfilled,
        (
          state,
          action: PayloadAction<{ success: boolean; productId: string }>
        ) => {
          if (action.payload.success) {
            // Confirm the optimistic update
            state.items = state.items.filter(
              (item) => item.product._id !== action.payload.productId
            );
            state.isWatchlist[action.payload.productId] = false;
          }
          state.loading = "succeeded";
        }
      )
      .addCase(removeFromWatchlist.rejected, (state, action) => {
        // Revert optimistic update
        state.isWatchlist[action.meta.arg] = true;
        state.loading = "failed";
        state.error = (action.payload as string) || "Unknown error occurred";
      });
  },
});

export const {
  clearWatchlist,
  optimisticAddToWatchlist,
  optimisticRemoveFromWatchlist,
} = watchlistSlice.actions;
export default watchlistSlice.reducer;
