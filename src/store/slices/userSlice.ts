import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { UserProfile } from "../../utils/types";
import { api } from "../../utils/services/apiService";

interface UserState {
  profile: UserProfile | null;
  loading: "idle" | "pending" | "succeeded" | "failed";
  error: string | null;
  lastFetched: number | null;
  users: UserProfile[];
  selectedUser: UserProfile | null;
}

const initialState: UserState = {
  profile: null,
  loading: "idle",
  error: null,
  lastFetched: null,
  users: [],
  selectedUser: null,
};

// Cache timeout (5 minutes)
const CACHE_TIMEOUT = 5 * 60 * 1000;

export const fetchUserProfile = createAsyncThunk<
  UserProfile,
  boolean | undefined,
  { rejectValue: string }
>(
  "user/fetchProfile",
  async (forceRefresh = false, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { user: UserState };
      const now = Date.now();

      // Skip fetching if data is fresh and not forcing refresh
      if (
        !forceRefresh &&
        state.user.profile &&
        state.user.lastFetched &&
        now - state.user.lastFetched < CACHE_TIMEOUT
      ) {
        return state.user.profile;
      }

      const response = await api.getUserProfile(forceRefresh);

      if (!response.ok) {
        return rejectWithValue(response.error || "Failed to fetch profile");
      }

      return response.data;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "An unknown error occurred";
      return rejectWithValue(message);
    }
  }
);

export const updateUserProfile = createAsyncThunk<
  UserProfile,
  Partial<UserProfile>,
  { rejectValue: string; state: { user: UserState } }
>("user/updateProfile", async (profileData, { rejectWithValue }) => {
  try {
    const response = await api.updateUserProfile(profileData);

    if (!response.ok) {
      return rejectWithValue(response.error || "Failed to update profile");
    }

    return response.data;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unknown error occurred";
    return rejectWithValue(message);
  }
});

export const getUserById = createAsyncThunk<
  UserProfile,
  string,
  { rejectValue: string }
>("user/getUserById", async (userId, { rejectWithValue }) => {
  try {
    const response = await api.getUserById(userId);

    if (!response.ok) {
      return rejectWithValue(response.error || "Failed to fetch user");
    }

    return response.data;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unknown error occurred";
    return rejectWithValue(message);
  }
});

export const getUserByEmail = createAsyncThunk<
  UserProfile,
  string,
  { rejectValue: string }
>("user/getUserByEmail", async (emailAddress, { rejectWithValue }) => {
  try {
    const response = await api.getUserByEmail(emailAddress);

    if (!response.ok) {
      return rejectWithValue(response.error || "Failed to fetch user by email");
    }

    return response.data;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unknown error occurred";
    return rejectWithValue(message);
  }
});

export const getAllUsers = createAsyncThunk<
  UserProfile[],
  boolean | undefined,
  { rejectValue: string }
>("user/getAllUsers", async (forceRefresh = false, { rejectWithValue }) => {
  try {
    const response = await api.getAllUsers(forceRefresh);

    if (!response.ok) {
      return rejectWithValue(response.error || "Failed to fetch users");
    }

    return response.data;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unknown error occurred";
    return rejectWithValue(message);
  }
});

export const deleteUserProfile = createAsyncThunk<
  { success: boolean; userId: string },
  string,
  { rejectValue: string }
>("user/deleteUserProfile", async (userId, { rejectWithValue }) => {
  try {
    const response = await api.deleteUserProfile(userId);

    if (!response.ok) {
      return rejectWithValue(response.error || "Failed to delete user");
    }

    return { success: true, userId };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unknown error occurred";
    return rejectWithValue(message);
  }
});

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    clearUserProfile: (state) => {
      state.profile = null;
      state.lastFetched = null;
      api.clearCache();
    },
    clearSelectedUser: (state) => {
      state.selectedUser = null;
    },
    syncProfileWithSelectedUser: (state) => {
      if (state.profile) {
        state.selectedUser = state.profile;
      }
    },
    updateUserFromAuth: (state, action: PayloadAction<UserProfile>) => {
      state.profile = action.payload;
      state.lastFetched = Date.now();
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = "pending";
        state.error = null;
      })
      .addCase(
        fetchUserProfile.fulfilled,
        (state, action: PayloadAction<UserProfile>) => {
          state.profile = action.payload;
          state.selectedUser = action.payload;
          state.loading = "succeeded";
          state.lastFetched = Date.now();
        }
      )
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = "failed";
        state.error = (action.payload as string) || "Unknown error occurred";
      })
      .addCase(updateUserProfile.pending, (state) => {
        state.loading = "pending";
        state.error = null;
      })
      .addCase(
        updateUserProfile.fulfilled,
        (state, action: PayloadAction<UserProfile>) => {
          state.profile = action.payload;
          state.loading = "succeeded";
          state.lastFetched = Date.now();
        }
      )
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = "failed";
        state.error = (action.payload as string) || "Unknown error occurred";
      })
      .addCase(getUserById.pending, (state) => {
        state.loading = "pending";
        state.error = null;
      })
      .addCase(
        getUserById.fulfilled,
        (state, action: PayloadAction<UserProfile>) => {
          state.selectedUser = action.payload;
          state.loading = "succeeded";
        }
      )
      .addCase(getUserById.rejected, (state, action) => {
        state.loading = "failed";
        state.error = (action.payload as string) || "Unknown error occurred";
      })
      .addCase(getUserByEmail.pending, (state) => {
        state.loading = "pending";
        state.error = null;
      })
      .addCase(
        getUserByEmail.fulfilled,
        (state, action: PayloadAction<UserProfile>) => {
          state.selectedUser = action.payload;
          state.loading = "succeeded";
        }
      )
      .addCase(getUserByEmail.rejected, (state, action) => {
        state.loading = "failed";
        state.error = (action.payload as string) || "Unknown error occurred";
      })
      .addCase(getAllUsers.pending, (state) => {
        state.loading = "pending";
        state.error = null;
      })
      .addCase(
        getAllUsers.fulfilled,
        (state, action: PayloadAction<UserProfile[]>) => {
          state.users = action.payload;
          state.loading = "succeeded";
        }
      )
      .addCase(getAllUsers.rejected, (state, action) => {
        state.loading = "failed";
        state.error = (action.payload as string) || "Unknown error occurred";
      })
      .addCase(deleteUserProfile.pending, (state) => {
        state.loading = "pending";
        state.error = null;
      })
      .addCase(
        deleteUserProfile.fulfilled,
        (
          state,
          action: PayloadAction<{ success: boolean; userId: string }>
        ) => {
          state.users = state.users.filter(
            (user) => user._id !== action.payload.userId
          );
          state.loading = "succeeded";
          if (state.selectedUser?._id === action.payload.userId) {
            state.selectedUser = null;
          }
        }
      )
      .addCase(deleteUserProfile.rejected, (state, action) => {
        state.loading = "failed";
        state.error = (action.payload as string) || "Unknown error occurred";
      });
  },
});

export const {
  clearUserProfile,
  clearSelectedUser,
  syncProfileWithSelectedUser,
  updateUserFromAuth,
} = userSlice.actions;
export default userSlice.reducer;
