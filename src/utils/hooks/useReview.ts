import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "./redux";
import {
  createReview,
  updateUserRating,
  fetchUserReviews,
  fetchOrderReview,
  clearReviewState,
} from "../../store/slices/reviewSlice";
import {
  selectUserReviews,
  selectCurrentReview,
  selectReviewLoading,
  selectReviewError,
  selectFormattedReviews,
  selectFormattedCurrentReview,
  selectReviewStats,
} from "../../store/selectors/reviewSelectors";
import { useSnackbar } from "../../context/SnackbarContext";
import { useEffect } from "react";
import { api } from "../services/apiService";

export const useReviewData = () => {
  const dispatch = useAppDispatch();
  const { showSnackbar } = useSnackbar();

  const reviews = useAppSelector(selectUserReviews);
  const formattedReviews = useAppSelector(selectFormattedReviews);
  const currentReview = useAppSelector(selectCurrentReview);
  const formattedCurrentReview = useAppSelector(selectFormattedCurrentReview);
  const reviewStats = useAppSelector(selectReviewStats);
  const loading = useAppSelector(selectReviewLoading);
  const error = useAppSelector(selectReviewError);

  const submitReview = useCallback(
    async (
      reviewData: {
        reviewed: string;
        order: string;
        rating: number;
        comment: string;
      },
      showNotification = true
    ) => {
      try {
        const result = await dispatch(createReview(reviewData)).unwrap();
        if (showNotification) {
          showSnackbar("Review submitted successfully", "success");
        }
        return result;
      } catch (err) {
        if (showNotification) {
          showSnackbar((err as string) || "Failed to submit review", "error");
        }
        return null;
      }
    },
    [dispatch, showSnackbar]
  );

  const updateRating = useCallback(
    async (productId: string, showNotification = true) => {
      try {
        const result = await dispatch(updateUserRating(productId)).unwrap();
        if (showNotification) {
          showSnackbar("Rating updated successfully", "success");
        }
        return result;
      } catch (err) {
        if (showNotification) {
          showSnackbar((err as string) || "Failed to update rating", "error");
        }
        return null;
      }
    },
    [dispatch, showSnackbar]
  );

  const getProductReviews = useCallback(
    async (
      productId: string,
      showNotification = false,
      forceRefresh = false
    ) => {
      try {
        const result = await dispatch(
          fetchUserReviews({ productId, forceRefresh })
        ).unwrap();
        if (showNotification) {
          showSnackbar("Reviews loaded successfully", "success");
        }
        return result;
      } catch (err) {
        if (showNotification) {
          showSnackbar((err as string) || "Failed to load reviews", "error");
        }
        return [];
      }
    },
    [dispatch, showSnackbar]
  );

  const getOrderReview = useCallback(
    async (productId: string, showNotification = false) => {
      try {
        const result = await dispatch(fetchOrderReview(productId)).unwrap();
        if (showNotification) {
          showSnackbar("Review loaded successfully", "success");
        }
        return result;
      } catch (err) {
        if (showNotification) {
          showSnackbar((err as string) || "Failed to load review", "error");
        }
        return null;
      }
    },
    [dispatch, showSnackbar]
  );

  const clearReviews = useCallback(() => {
    dispatch(clearReviewState());
  }, [dispatch]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      api.cancelRequest("/reviews/user");
      api.cancelRequest("/reviews/order");
    };
  }, []);

  return {
    reviews,
    formattedReviews,
    currentReview,
    formattedCurrentReview,
    reviewStats,
    loading,
    error,
    submitReview,
    updateRating,
    getProductReviews,
    getOrderReview,
    clearReviews,
  };
};
