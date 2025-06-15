import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { CreateTradeParams, TradeResponse } from "../../utils/types";
import { api } from "../../utils/services/apiService";

interface ContractState {
  loading: "idle" | "pending" | "succeeded" | "failed";
  error: string | null;
  tradeResponse: TradeResponse | null;
  transactionPending: boolean;
  deliveryConfirmLoading: boolean;
  deliveryConfirmError: string | null;
  currentTrade: any | null;
  sellerTrades: any[];
  buyerTrades: any[];
  logisticsProviders: { status: string; data: string[] } | null;
  logisticsProviderLoading: boolean;
  logisticsProviderError: string | null;
  registerLogisticsLoading: boolean;
  registerLogisticsError: string | null;
  registerLogisticsHash: string | null;
}

const initialState: ContractState = {
  loading: "idle",
  error: null,
  tradeResponse: null,
  transactionPending: false,
  deliveryConfirmLoading: false,
  deliveryConfirmError: null,
  currentTrade: null,
  sellerTrades: [],
  buyerTrades: [],
  logisticsProviders: null,
  logisticsProviderLoading: false,
  logisticsProviderError: null,
  registerLogisticsLoading: false,
  registerLogisticsError: null,
  registerLogisticsHash: null,
};

export const createTrade = createAsyncThunk<
  TradeResponse,
  CreateTradeParams,
  { rejectValue: string }
>("contract/createTrade", async (tradeData, { rejectWithValue }) => {
  try {
    const response = await api.createTrade(tradeData);

    if (!response.ok) {
      return rejectWithValue(
        response.error || "Failed to create trade contract"
      );
    }

    return response.data as TradeResponse;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unknown error occurred";
    return rejectWithValue(message);
  }
});

export const confirmDelivery = createAsyncThunk<
  TradeResponse,
  string,
  { rejectValue: string }
>("contract/confirmDelivery", async (tradeId, { rejectWithValue }) => {
  try {
    const response = await api.confirmDelivery(tradeId);

    if (!response.ok) {
      return rejectWithValue(response.error || "Failed to confirm delivery");
    }

    return response.data as TradeResponse;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unknown error occurred";
    return rejectWithValue(message);
  }
});

export const registerLogisticsProvider = createAsyncThunk<
  { transactionHash: string },
  string,
  { rejectValue: string }
>(
  "contract/registerLogisticsProvider",
  async (providerAddress, { rejectWithValue }) => {
    try {
      const response = await api.registerLogisticsProvider(providerAddress);

      if (!response.ok) {
        return rejectWithValue(
          response.error || "Failed to register logistics provider"
        );
      }

      return response.data as { transactionHash: string };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "An unknown error occurred";
      return rejectWithValue(message);
    }
  }
);

export const getTradeById = createAsyncThunk<
  any,
  string,
  { rejectValue: string }
>("contract/getTradeById", async (tradeId, { rejectWithValue }) => {
  try {
    const response = await api.getTradeById(tradeId);

    if (!response.ok) {
      return rejectWithValue(response.error || "Failed to fetch trade details");
    }

    return response.data;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unknown error occurred";
    return rejectWithValue(message);
  }
});

export const getTradesBySeller = createAsyncThunk<
  any[],
  void,
  { rejectValue: string }
>("contract/getTradesBySeller", async (_, { rejectWithValue }) => {
  try {
    const response = await api.getTradesBySeller();

    if (!response.ok) {
      return rejectWithValue(response.error || "Failed to fetch seller trades");
    }

    return response.data;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unknown error occurred";
    return rejectWithValue(message);
  }
});

export const getTradesByBuyer = createAsyncThunk<
  any[],
  void,
  { rejectValue: string }
>("contract/getTradesByBuyer", async (_, { rejectWithValue }) => {
  try {
    const response = await api.getTradesByBuyer();

    if (!response.ok) {
      return rejectWithValue(response.error || "Failed to fetch buyer trades");
    }

    return response.data;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unknown error occurred";
    return rejectWithValue(message);
  }
});

export const buyTrade = createAsyncThunk<
  any,
  { tradeId: string; quantity: number; logisticsProvider: string },
  { rejectValue: string }
>(
  "contract/buyTrade",
  async ({ tradeId, quantity, logisticsProvider }, { rejectWithValue }) => {
    try {
      const response = await api.buyTrade(tradeId, {
        quantity,
        logisticsProvider,
      });

      if (!response.ok) {
        return rejectWithValue(response.error || "Failed to buy trade");
      }

      return response.data;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "An unknown error occurred";
      return rejectWithValue(message);
    }
  }
);

export const getLogisticsProviders = createAsyncThunk<
  { status: string; data: string[] },
  void,
  { rejectValue: string }
>("contract/getLogisticsProviders", async (_, { rejectWithValue }) => {
  try {
    const response = await api.getLogisticsProviders();

    if (!response.ok) {
      return rejectWithValue(
        response.error || "Failed to fetch logistics providers"
      );
    }

    return response.data;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unknown error occurred";
    return rejectWithValue(message);
  }
});

const contractSlice = createSlice({
  name: "contract",
  initialState,
  reducers: {
    clearTradeResponse: (state) => {
      state.tradeResponse = null;
    },
    setTransactionPending: (state, action: PayloadAction<boolean>) => {
      state.transactionPending = action.payload;
    },
    clearDeliveryConfirmError: (state) => {
      state.deliveryConfirmError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createTrade.pending, (state) => {
        state.loading = "pending";
        state.error = null;
      })
      .addCase(
        createTrade.fulfilled,
        (state, action: PayloadAction<TradeResponse>) => {
          state.loading = "succeeded";
          state.tradeResponse = action.payload;
        }
      )
      .addCase(createTrade.rejected, (state, action) => {
        state.loading = "failed";
        state.error = (action.payload as string) || "Unknown error occurred";
      })
      .addCase(confirmDelivery.pending, (state) => {
        state.deliveryConfirmLoading = true;
        state.deliveryConfirmError = null;
      })
      .addCase(confirmDelivery.fulfilled, (state) => {
        state.deliveryConfirmLoading = false;
      })
      .addCase(confirmDelivery.rejected, (state, action) => {
        state.deliveryConfirmLoading = false;
        state.deliveryConfirmError =
          (action.payload as string) || "Failed to confirm delivery";
      })
      .addCase(registerLogisticsProvider.pending, (state) => {
        state.registerLogisticsLoading = true;
        state.registerLogisticsError = null;
      })
      .addCase(registerLogisticsProvider.fulfilled, (state, action) => {
        state.registerLogisticsLoading = false;
        state.registerLogisticsHash = action.payload.transactionHash;
      })
      .addCase(registerLogisticsProvider.rejected, (state, action) => {
        state.registerLogisticsLoading = false;
        state.registerLogisticsError = action.payload as string;
      })
      .addCase(getTradeById.pending, (state) => {
        state.loading = "pending";
        state.error = null;
      })
      .addCase(getTradeById.fulfilled, (state, action) => {
        state.loading = "succeeded";
        state.currentTrade = action.payload;
      })
      .addCase(getTradeById.rejected, (state, action) => {
        state.loading = "failed";
        state.error = action.payload as string;
      })
      .addCase(getTradesBySeller.pending, (state) => {
        state.loading = "pending";
        state.error = null;
      })
      .addCase(getTradesBySeller.fulfilled, (state, action) => {
        state.loading = "succeeded";
        state.sellerTrades = action.payload;
      })
      .addCase(getTradesBySeller.rejected, (state, action) => {
        state.loading = "failed";
        state.error = action.payload as string;
      })
      .addCase(getTradesByBuyer.pending, (state) => {
        state.loading = "pending";
        state.error = null;
      })
      .addCase(getTradesByBuyer.fulfilled, (state, action) => {
        state.loading = "succeeded";
        state.buyerTrades = action.payload;
      })
      .addCase(getTradesByBuyer.rejected, (state, action) => {
        state.loading = "failed";
        state.error = action.payload as string;
      })
      .addCase(getLogisticsProviders.pending, (state) => {
        state.logisticsProviderLoading = true;
        state.logisticsProviderError = null;
      })
      .addCase(getLogisticsProviders.fulfilled, (state, action) => {
        state.logisticsProviderLoading = false;
        state.logisticsProviders = action.payload;
      })
      .addCase(getLogisticsProviders.rejected, (state, action) => {
        state.logisticsProviderLoading = false;
        state.logisticsProviderError = action.payload as string;
      })
      .addCase(buyTrade.pending, (state) => {
        state.loading = "pending";
        state.error = null;
      })
      .addCase(buyTrade.fulfilled, (state) => {
        state.loading = "succeeded";
      })
      .addCase(buyTrade.rejected, (state, action) => {
        state.loading = "failed";
        state.error = action.payload as string;
      });
  },
});

export const {
  clearTradeResponse,
  setTransactionPending,
  clearDeliveryConfirmError,
} = contractSlice.actions;
export default contractSlice.reducer;
