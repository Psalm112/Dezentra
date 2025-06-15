import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { Reward, RewardSummary } from "../../utils/types";
import { api } from "../../utils/services/apiService";

interface RewardsState {
  rewards: Reward[];
  summary: RewardSummary | null;
  loading: "idle" | "pending" | "succeeded" | "failed";
  error: string | null;
  lastFetched: number | null;
  lastSummaryFetched: number | null;
}

const initialState: RewardsState = {
  rewards: [],
  summary: null,
  loading: "idle",
  error: null,
  lastFetched: null,
  lastSummaryFetched: null,
};

// Cache timeout (5 minutes)
const CACHE_TIMEOUT = 5 * 60 * 1000;

export const fetchUserRewards = createAsyncThunk<
  Reward[],
  boolean | undefined,
  { rejectValue: string }
>(
  "rewards/fetchUserRewards",
  async (forceRefresh = false, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { rewards: RewardsState };
      const now = Date.now();

      // Skip fetching if data is fresh and not forcing refresh
      if (
        !forceRefresh &&
        state.rewards.rewards.length > 0 &&
        state.rewards.lastFetched &&
        now - state.rewards.lastFetched < CACHE_TIMEOUT
      ) {
        return state.rewards.rewards;
      }

      const response = await api.getUserRewards(forceRefresh);

      if (!response.ok) {
        return rejectWithValue(response.error || "Failed to fetch rewards");
      }

      return response.data;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "An unknown error occurred";
      return rejectWithValue(message);
    }
  }
);

export const fetchRewardsSummary = createAsyncThunk<
  RewardSummary,
  boolean | undefined,
  { rejectValue: string }
>(
  "rewards/fetchRewardsSummary",
  async (forceRefresh = false, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { rewards: RewardsState };
      const now = Date.now();

      // Skip fetching if data is fresh and not forcing refresh
      if (
        !forceRefresh &&
        state.rewards.summary &&
        state.rewards.lastSummaryFetched &&
        now - state.rewards.lastSummaryFetched < CACHE_TIMEOUT
      ) {
        return state.rewards.summary;
      }

      const response = await api.getRewardsSummary(forceRefresh);

      if (!response.ok) {
        return rejectWithValue(
          response.error || "Failed to fetch rewards summary"
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

const rewardsSlice = createSlice({
  name: "rewards",
  initialState,
  reducers: {
    clearRewards: (state) => {
      state.rewards = [];
      state.summary = null;
      state.lastFetched = null;
      state.lastSummaryFetched = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserRewards.pending, (state) => {
        state.loading = "pending";
        state.error = null;
      })
      .addCase(
        fetchUserRewards.fulfilled,
        (state, action: PayloadAction<Reward[]>) => {
          state.rewards = action.payload;
          state.loading = "succeeded";
          state.lastFetched = Date.now();
        }
      )
      .addCase(fetchUserRewards.rejected, (state, action) => {
        state.loading = "failed";
        state.error = (action.payload as string) || "Unknown error occurred";
      })
      .addCase(fetchRewardsSummary.pending, (state) => {
        state.loading = "pending";
        state.error = null;
      })
      .addCase(
        fetchRewardsSummary.fulfilled,
        (state, action: PayloadAction<RewardSummary>) => {
          state.summary = action.payload;
          state.loading = "succeeded";
          state.lastSummaryFetched = Date.now();
        }
      )
      .addCase(fetchRewardsSummary.rejected, (state, action) => {
        state.loading = "failed";
        state.error = (action.payload as string) || "Unknown error occurred";
      });
  },
});

export const { clearRewards } = rewardsSlice.actions;
export default rewardsSlice.reducer;
