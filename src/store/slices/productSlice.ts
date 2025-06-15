import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { Product } from "../../utils/types";
import { api } from "../../utils/services/apiService";

interface ProductState {
  products: Product[];
  sponsoredProducts: Product[];
  currentProduct: Product | null;
  loading: "idle" | "pending" | "succeeded" | "failed";
  error: string | null;
  searchQuery: string;
  searchResults: Product[];
}

const initialState: ProductState = {
  products: [],
  sponsoredProducts: [],
  currentProduct: null,
  loading: "idle",
  error: null,
  searchQuery: "",
  searchResults: [],
};

export const fetchAllProducts = createAsyncThunk(
  "products/fetchAll",
  async (
    {
      forceRefresh = false,
      preventAbort = false,
    }: { forceRefresh?: boolean; preventAbort?: boolean } = {},
    { rejectWithValue }
  ) => {
    try {
      const response = await api.getProducts(forceRefresh, preventAbort);
      if (!response.ok) {
        return rejectWithValue(response.error || "Failed to fetch products");
      }
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }
);

export const fetchProductById = createAsyncThunk(
  "products/fetchById",
  async (productId: string, { rejectWithValue }) => {
    try {
      const response = await api.getProductById(productId);
      if (!response.ok) {
        return rejectWithValue(response.error || "Failed to fetch product");
      }
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }
);

export const fetchSponsoredProducts = createAsyncThunk(
  "products/fetchSponsored",
  async (
    {
      forceRefresh = false,
      preventAbort = false,
    }: { forceRefresh?: boolean; preventAbort?: boolean } = {},
    { rejectWithValue }
  ) => {
    try {
      const response = await api.getSponsoredProducts(
        forceRefresh,
        preventAbort
      );
      if (!response.ok) {
        return rejectWithValue(
          response.error || "Failed to fetch sponsored products"
        );
      }
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }
);

export const searchProducts = createAsyncThunk(
  "products/search",
  async (query: string, { rejectWithValue }) => {
    try {
      const response = await api.searchProducts(query);
      if (!response.ok) {
        return rejectWithValue(response.error || "Failed to search products");
      }
      return { query, results: response.data };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  }
);

const productSlice = createSlice({
  name: "products",
  initialState,
  reducers: {
    clearCurrentProduct: (state) => {
      state.currentProduct = null;
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
      state.searchQuery = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllProducts.pending, (state) => {
        state.loading = "pending";
        state.error = null;
      })
      .addCase(
        fetchAllProducts.fulfilled,
        (state, action: PayloadAction<Product[]>) => {
          state.loading = "succeeded";
          state.products = action.payload;
        }
      )
      .addCase(fetchAllProducts.rejected, (state, action) => {
        state.loading = "failed";
        state.error = action.payload as string;
      })

      .addCase(fetchProductById.pending, (state) => {
        state.loading = "pending";
        state.error = null;
      })
      .addCase(
        fetchProductById.fulfilled,
        (state, action: PayloadAction<Product>) => {
          state.loading = "succeeded";
          state.currentProduct = action.payload;
        }
      )
      .addCase(fetchProductById.rejected, (state, action) => {
        state.loading = "failed";
        state.error = action.payload as string;
      })

      .addCase(fetchSponsoredProducts.pending, (state) => {
        state.loading = "pending";
        state.error = null;
      })
      .addCase(
        fetchSponsoredProducts.fulfilled,
        (state, action: PayloadAction<Product[]>) => {
          state.loading = "succeeded";
          state.sponsoredProducts = action.payload;
        }
      )
      .addCase(fetchSponsoredProducts.rejected, (state, action) => {
        state.loading = "failed";
        state.error = action.payload as string;
      })

      .addCase(searchProducts.pending, (state) => {
        state.loading = "pending";
        state.error = null;
      })
      .addCase(
        searchProducts.fulfilled,
        (
          state,
          action: PayloadAction<{ query: string; results: Product[] }>
        ) => {
          state.loading = "succeeded";
          state.searchQuery = action.payload.query;
          state.searchResults = action.payload.results;
        }
      )
      .addCase(searchProducts.rejected, (state, action) => {
        state.loading = "failed";
        state.error = action.payload as string;
        state.searchResults = [];
      });
  },
});

export const { clearCurrentProduct, clearSearchResults } = productSlice.actions;
export default productSlice.reducer;
