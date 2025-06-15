import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "../store";

export const selectRewards = (state: RootState) => state.rewards.rewards;
export const selectRewardsSummary = (state: RootState) => state.rewards.summary;
export const selectRewardsLoading = (state: RootState) => state.rewards.loading;
export const selectRewardsError = (state: RootState) => state.rewards.error;

export const selectTotalPoints = createSelector(
  [selectRewardsSummary],
  (summary) => summary?.totalPoints || 0
);

export const selectAvailablePoints = createSelector(
  [selectRewardsSummary],
  (summary) => summary?.availablePoints || 0
);

export const selectMilestones = createSelector(
  [selectRewardsSummary],
  (summary) => summary?.milestones || { sales: 0, purchases: 0 }
);

export const selectRewardsByType = (actionType: string) =>
  createSelector([selectRewards], (rewards) =>
    rewards.filter((reward) => reward.actionType === actionType)
  );
