import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "../store";

export const selectWatchlistItems = (state: RootState) => state.watchlist.items;
export const selectWatchlistLoading = (state: RootState) =>
  state.watchlist.loading;
export const selectWatchlistError = (state: RootState) => state.watchlist.error;
export const selectIsWatchlistMap = (state: RootState) =>
  state.watchlist.isWatchlist;

export const selectIsProductInWatchlist = (productId: string) =>
  createSelector(
    [selectIsWatchlistMap],
    (isWatchlistMap) => !!isWatchlistMap[productId]
  );

export const selectWatchlistProductIds = createSelector(
  [selectWatchlistItems],
  (items) => items.map((item) => item.product._id)
);

export const selectWatchlistCount = createSelector(
  [selectWatchlistItems],
  (items) => items.length
);
