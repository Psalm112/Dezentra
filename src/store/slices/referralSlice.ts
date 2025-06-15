import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { ReferralInfo } from "../../utils/types";
import { api } from "../../utils/services/apiService";

interface ReferralState {
  referralInfo: ReferralInfo | null;
  loading: "idle" | "pending" | "succeeded" | "failed";
  error: string | null;
  applyStatus: "idle" | "pending" | "succeeded" | "failed";
  applyError: string | null;
}

const initialState: ReferralState = {
  referralInfo: null,
  loading: "idle",
  error: null,
  applyStatus: "idle",
  applyError: null,
};

export const fetchReferralInfo = createAsyncThunk<
  ReferralInfo,
  boolean | undefined,
  { rejectValue: string }
>("referrals/fetchInfo", async (forceRefresh = false, { rejectWithValue }) => {
  try {
    const response = await api.getReferralInfo(forceRefresh);
    if (!response.ok) {
      return rejectWithValue(response.error || "Failed to fetch referral info");
    }
    return response.data;
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Unknown error"
    );
  }
});

export const applyReferralCode = createAsyncThunk<
  { success: boolean },
  string,
  { rejectValue: string }
>("referrals/apply", async (referralCode, { rejectWithValue }) => {
  try {
    const response = await api.applyReferralCode(referralCode);
    if (!response.ok) {
      return rejectWithValue(response.error || "Failed to apply referral code");
    }
    return response.data;
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Unknown error"
    );
  }
});

const referralSlice = createSlice({
  name: "referrals",
  initialState,
  reducers: {
    clearReferralState: (state) => {
      state.referralInfo = null;
      state.applyStatus = "idle";
      state.applyError = null;
    },
    resetApplyStatus: (state) => {
      state.applyStatus = "idle";
      state.applyError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch referral info
      .addCase(fetchReferralInfo.pending, (state) => {
        state.loading = "pending";
        state.error = null;
      })
      .addCase(
        fetchReferralInfo.fulfilled,
        (state, action: PayloadAction<ReferralInfo>) => {
          state.loading = "succeeded";
          state.referralInfo = action.payload;
        }
      )
      .addCase(fetchReferralInfo.rejected, (state, action) => {
        state.loading = "failed";
        state.error = action.payload as string;
      })

      // Apply referral code
      .addCase(applyReferralCode.pending, (state) => {
        state.applyStatus = "pending";
        state.applyError = null;
      })
      .addCase(applyReferralCode.fulfilled, (state) => {
        state.applyStatus = "succeeded";
      })
      .addCase(applyReferralCode.rejected, (state, action) => {
        state.applyStatus = "failed";
        state.applyError = action.payload as string;
      });
  },
});

export const { clearReferralState, resetApplyStatus } = referralSlice.actions;
export default referralSlice.reducer;
