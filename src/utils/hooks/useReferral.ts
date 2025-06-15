import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "./redux";
import {
  fetchReferralInfo,
  applyReferralCode,
  clearReferralState,
  resetApplyStatus,
} from "../../store/slices/referralSlice";
import {
  selectReferralInfo,
  selectReferralLoading,
  selectReferralError,
  selectReferralApplyStatus,
  selectReferralApplyError,
  selectFormattedReferralInfo,
} from "../../store/selectors/referralSelectors";
import { useSnackbar } from "../../context/SnackbarContext";
import { useEffect } from "react";
import { api } from "../services/apiService";

export const useReferralData = () => {
  const dispatch = useAppDispatch();
  const { showSnackbar } = useSnackbar();

  const referralInfo = useAppSelector(selectReferralInfo);
  const formattedReferralInfo = useAppSelector(selectFormattedReferralInfo);
  const loading = useAppSelector(selectReferralLoading);
  const error = useAppSelector(selectReferralError);
  const applyStatus = useAppSelector(selectReferralApplyStatus);
  const applyError = useAppSelector(selectReferralApplyError);

  const getReferralInfo = useCallback(
    async (showNotification = false, forceRefresh = false) => {
      try {
        const result = await dispatch(fetchReferralInfo(forceRefresh)).unwrap();
        if (showNotification) {
          showSnackbar("Referral info loaded successfully", "success");
        }
        return result;
      } catch (err) {
        if (showNotification) {
          showSnackbar(
            (err as string) || "Failed to load referral info",
            "error"
          );
        }
        return null;
      }
    },
    [dispatch, showSnackbar]
  );

  const applyCode = useCallback(
    async (referralCode: string, showNotification = true) => {
      try {
        const result = await dispatch(applyReferralCode(referralCode)).unwrap();
        if (showNotification) {
          showSnackbar("Referral code applied successfully", "success");
        }
        return result;
      } catch (err) {
        if (showNotification) {
          showSnackbar(
            (err as string) || "Failed to apply referral code",
            "error"
          );
        }
        return null;
      }
    },
    [dispatch, showSnackbar]
  );

  const clearReferral = useCallback(() => {
    dispatch(clearReferralState());
  }, [dispatch]);

  const resetApplyStatuses = useCallback(() => {
    dispatch(resetApplyStatus());
  }, [dispatch]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      api.cancelRequest("/referral/info");
    };
  }, []);

  // Fetch referral info on mount if not available
  useEffect(() => {
    if (!referralInfo && loading === false) {
      getReferralInfo(false);
    }
  }, [referralInfo, loading, getReferralInfo]);

  return {
    referralInfo,
    formattedReferralInfo,
    loading,
    error,
    applyStatus: applyStatus === "pending",
    applySuccess: applyStatus === "succeeded",
    applyError,
    getReferralInfo,
    applyCode,
    clearReferral,
    resetApplyStatus: resetApplyStatuses,
  };
};
