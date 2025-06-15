import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "../store";

export const selectReferralInfo = (state: RootState) =>
  state.referrals.referralInfo;
export const selectReferralLoading = (state: RootState) =>
  state.referrals.loading === "pending";
export const selectReferralError = (state: RootState) => state.referrals.error;
export const selectReferralApplyStatus = (state: RootState) =>
  state.referrals.applyStatus;
export const selectReferralApplyError = (state: RootState) =>
  state.referrals.applyError;

export const selectFormattedReferralInfo = createSelector(
  [selectReferralInfo],
  (info) => {
    if (!info) return null;

    return {
      code: info.referralCode,
      count: info.referralCount,
      shareLink: `${window.location.origin}/referral?code=${info.referralCode}`,
    };
  }
);
