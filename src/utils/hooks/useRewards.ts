import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "./redux";
import {
  fetchUserRewards,
  fetchRewardsSummary,
} from "../../store/slices/rewardsSlice";
import {
  selectRewards,
  selectRewardsSummary,
  selectRewardsLoading,
  selectRewardsError,
  selectTotalPoints,
  selectAvailablePoints,
  selectMilestones,
  selectRewardsByType,
} from "../../store/selectors/rewardsSelectors";
import { useSnackbar } from "../../context/SnackbarContext";

export const useRewards = () => {
  const dispatch = useAppDispatch();
  const { showSnackbar } = useSnackbar();

  const rewards = useAppSelector(selectRewards);
  const summary = useAppSelector(selectRewardsSummary);
  const loading = useAppSelector(selectRewardsLoading);
  const error = useAppSelector(selectRewardsError);
  const totalPoints = useAppSelector(selectTotalPoints);
  const availablePoints = useAppSelector(selectAvailablePoints);
  const milestones = useAppSelector(selectMilestones);

  const getRewardsByType = useCallback((actionType: string) => {
    return useAppSelector(selectRewardsByType(actionType));
  }, []);

  const fetchRewards = useCallback(
    async (showNotifications = false, forceRefresh = false) => {
      try {
        await dispatch(fetchUserRewards(forceRefresh)).unwrap();
        if (showNotifications) {
          showSnackbar("Rewards loaded successfully", "success");
        }
        return true;
      } catch (err) {
        if (showNotifications) {
          showSnackbar((err as string) || "Failed to load rewards", "error");
        }
        return false;
      }
    },
    [dispatch, showSnackbar]
  );

  const fetchSummary = useCallback(
    async (showNotifications = false, forceRefresh = false) => {
      try {
        await dispatch(fetchRewardsSummary(forceRefresh)).unwrap();
        if (showNotifications) {
          showSnackbar("Rewards summary loaded successfully", "success");
        }
        return true;
      } catch (err) {
        if (showNotifications) {
          showSnackbar(
            (err as string) || "Failed to load rewards summary",
            "error"
          );
        }
        return false;
      }
    },
    [dispatch, showSnackbar]
  );

  const loadAllRewardsData = useCallback(
    async (showNotifications = false, forceRefresh = false) => {
      const summarySuccess = await fetchSummary(false, forceRefresh);
      const rewardsSuccess = await fetchRewards(false, forceRefresh);

      if (showNotifications) {
        if (summarySuccess && rewardsSuccess) {
          showSnackbar("Rewards data loaded successfully", "success");
        } else {
          showSnackbar("Failed to load some rewards data", "error");
        }
      }

      return summarySuccess && rewardsSuccess;
    },
    [fetchSummary, fetchRewards, showSnackbar]
  );

  return {
    rewards,
    summary,
    isLoading: loading === "pending",
    error,
    totalPoints,
    availablePoints,
    milestones,
    getRewardsByType,
    fetchRewards,
    fetchSummary,
    loadAllRewardsData,
    isError: loading === "failed" && error !== null,
    isSuccess: loading === "succeeded",
  };
};
