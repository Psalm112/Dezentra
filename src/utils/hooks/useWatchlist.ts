import { useCallback, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "./redux";
import {
  fetchWatchlist,
  checkWatchlist,
  addToWatchlist,
  removeFromWatchlist,
} from "../../store/slices/watchlistSlice";
import {
  selectWatchlistItems,
  selectWatchlistLoading,
  selectWatchlistError,
  selectWatchlistCount,
  selectIsWatchlistMap,
} from "../../store/selectors/watchlistSelectors";
import { useSnackbar } from "../../context/SnackbarContext";

export const useWatchlist = () => {
  const dispatch = useAppDispatch();
  const { showSnackbar } = useSnackbar();

  const watchlistItems = useAppSelector(selectWatchlistItems);
  const loading = useAppSelector(selectWatchlistLoading);
  const error = useAppSelector(selectWatchlistError);
  const watchlistCount = useAppSelector(selectWatchlistCount);
  const isWatchlistMap = useAppSelector(selectIsWatchlistMap);

  // Fetch watchlist on mount if not already loaded
  useEffect(() => {
    if (watchlistItems.length === 0 && loading === "idle") {
      dispatch(fetchWatchlist(false));
    }
  }, [dispatch, watchlistItems.length, loading]);

  const isProductInWatchlist = useCallback(
    (productId: string) => {
      return !!isWatchlistMap[productId];
    },
    [isWatchlistMap]
  );

  const fetchUserWatchlist = useCallback(
    async (showNotifications = false, forceRefresh = false) => {
      try {
        await dispatch(fetchWatchlist(forceRefresh)).unwrap();
        if (showNotifications) {
          showSnackbar("Watchlist loaded successfully", "success");
        }
        return true;
      } catch (err) {
        if (showNotifications) {
          showSnackbar((err as string) || "Failed to load watchlist", "error");
        }
        return false;
      }
    },
    [dispatch, showSnackbar]
  );

  const checkProductWatchlist = useCallback(
    async (productId: string) => {
      try {
        await dispatch(checkWatchlist(productId)).unwrap();
        return true;
      } catch (err) {
        return false;
      }
    },
    [dispatch]
  );

  const addProductToWatchlist = useCallback(
    async (productId: string, showNotifications = true) => {
      try {
        await dispatch(addToWatchlist(productId)).unwrap();
        if (showNotifications) {
          showSnackbar("Product added to watchlist", "success");
        }
        return true;
      } catch (err) {
        if (showNotifications) {
          showSnackbar(
            (err as string) || "Failed to add product to watchlist",
            "error"
          );
        }
        return false;
      }
    },
    [dispatch, showSnackbar]
  );

  const removeProductFromWatchlist = useCallback(
    async (productId: string, showNotifications = true) => {
      try {
        await dispatch(removeFromWatchlist(productId)).unwrap();
        if (showNotifications) {
          showSnackbar("Product removed from watchlist", "success");
        }
        return true;
      } catch (err) {
        if (showNotifications) {
          showSnackbar(
            (err as string) || "Failed to remove product from watchlist",
            "error"
          );
        }
        return false;
      }
    },
    [dispatch, showSnackbar]
  );

  const toggleWatchlist = useCallback(
    async (productId: string, showNotifications = true) => {
      const inWatchlist = isProductInWatchlist(productId);

      if (inWatchlist) {
        return await removeProductFromWatchlist(productId, showNotifications);
      } else {
        return await addProductToWatchlist(productId, showNotifications);
      }
    },
    [isProductInWatchlist, addProductToWatchlist, removeProductFromWatchlist]
  );

  return {
    watchlistItems,
    isLoading: loading === "pending",
    error,
    watchlistCount,
    isProductInWatchlist,
    fetchUserWatchlist,
    checkProductWatchlist,
    addProductToWatchlist,
    removeProductFromWatchlist,
    toggleWatchlist,
    isError: loading === "failed" && error !== null,
    isSuccess: loading === "succeeded",
  };
};
