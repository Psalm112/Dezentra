import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "../store";
import { Review } from "../../utils/types";

export const selectUserReviews = (state: RootState) =>
  state.reviews.userReviews;
export const selectCurrentReview = (state: RootState) =>
  state.reviews.currentReview;
export const selectReviewLoading = (state: RootState) =>
  state.reviews.loading === "pending";
export const selectReviewError = (state: RootState) => state.reviews.error;

export const selectFormattedReviews = createSelector(
  [selectUserReviews],
  (reviews) => {
    return reviews.map((review: Review) => ({
      ...review,
      formattedDate: new Date(review.createdAt).toLocaleDateString(),
    }));
  }
);

export const selectFormattedCurrentReview = createSelector(
  [selectCurrentReview],
  (review) => {
    if (!review) return null;

    return {
      ...review,
      formattedDate: new Date(review.createdAt).toLocaleDateString(),
    };
  }
);

export const selectReviewStats = createSelector(
  [selectUserReviews],
  (reviews) => {
    if (!reviews.length) {
      return {
        averageRating: 0,
        total: 0,
        distribution: {
          5: 0,
          4: 0,
          3: 0,
          2: 0,
          1: 0,
        },
      };
    }

    const total = reviews.length;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    const averageRating = total > 0 ? sum / total : 0;

    const distribution = reviews.reduce(
      (acc, review) => {
        acc[review.rating]++;
        return acc;
      },
      { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    );

    return {
      averageRating: parseFloat(averageRating.toFixed(1)),
      total,
      distribution,
    };
  }
);
