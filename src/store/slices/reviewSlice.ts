import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { Review } from "../../utils/types";
import { api } from "../../utils/services/apiService";

interface ReviewState {
  userReviews: Review[];
  currentReview: Review | null;
  loading: "idle" | "pending" | "succeeded" | "failed";
  error: string | null;
}

const initialState: ReviewState = {
  userReviews: [],
  currentReview: null,
  loading: "idle",
  error: null,
};

export const createReview = createAsyncThunk<
  Review,
  {
    reviewed: string;
    order: string;
    rating: number;
    comment: string;
  },
  { rejectValue: string }
>("reviews/create", async (reviewData, { rejectWithValue }) => {
  try {
    const response = await api.createReview(reviewData);
    if (!response.ok) {
      return rejectWithValue(response.error || "Failed to create review");
    }
    return response.data;
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Unknown error"
    );
  }
});

export const updateUserRating = createAsyncThunk<
  { success: boolean },
  string,
  { rejectValue: string }
>("reviews/updateRating", async (productId, { rejectWithValue }) => {
  try {
    const response = await api.updateUserRating(productId);
    if (!response.ok) {
      return rejectWithValue(response.error || "Failed to update rating");
    }
    return response.data;
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Unknown error"
    );
  }
});

export const fetchUserReviews = createAsyncThunk<
  Review[],
  { productId: string; forceRefresh?: boolean },
  { rejectValue: string }
>(
  "reviews/fetchUserReviews",
  async ({ productId, forceRefresh = false }, { rejectWithValue }) => {
    try {
      const response = await api.getUserReviews(productId, forceRefresh);
      if (!response.ok) {
        return rejectWithValue(response.error || "Failed to fetch reviews");
      }
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }
);

export const fetchOrderReview = createAsyncThunk<
  Review,
  string,
  { rejectValue: string }
>("reviews/fetchOrderReview", async (productId, { rejectWithValue }) => {
  try {
    const response = await api.getOrderReview(productId);
    if (!response.ok) {
      return rejectWithValue(response.error || "Failed to fetch review");
    }
    return response.data;
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : "Unknown error"
    );
  }
});

const reviewSlice = createSlice({
  name: "reviews",
  initialState,
  reducers: {
    clearReviewState: (state) => {
      state.currentReview = null;
      state.userReviews = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Create review
      .addCase(createReview.pending, (state) => {
        state.loading = "pending";
        state.error = null;
      })
      .addCase(
        createReview.fulfilled,
        (state, action: PayloadAction<Review>) => {
          state.loading = "succeeded";
          state.currentReview = action.payload;
          // Add to user reviews if it's a new one
          const exists = state.userReviews.some(
            (review) => review._id === action.payload._id
          );
          if (!exists) {
            state.userReviews.push(action.payload);
          }
        }
      )
      .addCase(createReview.rejected, (state, action) => {
        state.loading = "failed";
        state.error = action.payload as string;
      })

      // Update user rating
      .addCase(updateUserRating.pending, (state) => {
        state.loading = "pending";
        state.error = null;
      })
      .addCase(updateUserRating.fulfilled, (state) => {
        state.loading = "succeeded";
      })
      .addCase(updateUserRating.rejected, (state, action) => {
        state.loading = "failed";
        state.error = action.payload as string;
      })

      // Fetch user reviews
      .addCase(fetchUserReviews.pending, (state) => {
        state.loading = "pending";
        state.error = null;
      })
      .addCase(
        fetchUserReviews.fulfilled,
        (state, action: PayloadAction<Review[]>) => {
          state.loading = "succeeded";
          state.userReviews = action.payload;
        }
      )
      .addCase(fetchUserReviews.rejected, (state, action) => {
        state.loading = "failed";
        state.error = action.payload as string;
      })

      // Fetch order review
      .addCase(fetchOrderReview.pending, (state) => {
        state.loading = "pending";
        state.error = null;
      })
      .addCase(
        fetchOrderReview.fulfilled,
        (state, action: PayloadAction<Review>) => {
          state.loading = "succeeded";
          state.currentReview = action.payload;
        }
      )
      .addCase(fetchOrderReview.rejected, (state, action) => {
        state.loading = "failed";
        state.error = action.payload as string;
      });
  },
});

export const { clearReviewState } = reviewSlice.actions;
export default reviewSlice.reducer;
