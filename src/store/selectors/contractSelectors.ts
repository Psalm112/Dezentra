import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "../store";

export const selectContractLoading = (state: RootState) =>
  state.contract.loading;
export const selectContractError = (state: RootState) => state.contract.error;
export const selectTradeResponse = (state: RootState) =>
  state.contract.tradeResponse;
export const selectTransactionPending = (state: RootState) =>
  state.contract.transactionPending;
export const selectDeliveryConfirmLoading = (state: RootState) =>
  state.contract.deliveryConfirmLoading;
export const selectDeliveryConfirmError = (state: RootState) =>
  state.contract.deliveryConfirmError;
export const selectCurrentTrade = (state: RootState) =>
  state.contract.currentTrade;
export const selectSellerTrades = (state: RootState) =>
  state.contract.sellerTrades;
export const selectBuyerTrades = (state: RootState) =>
  state.contract.buyerTrades;
export const selectLogisticsProviders = (state: RootState) =>
  state.contract.logisticsProviders;
export const selectLogisticsProviderLoading = (state: RootState) =>
  state.contract.logisticsProviderLoading;
export const selectLogisticsProviderError = (state: RootState) =>
  state.contract.logisticsProviderError;
export const selectRegisterLogisticsLoading = (state: RootState) =>
  state.contract.registerLogisticsLoading;
export const selectRegisterLogisticsError = (state: RootState) =>
  state.contract.registerLogisticsError;
export const selectRegisterLogisticsHash = (state: RootState) =>
  state.contract.registerLogisticsHash;

export const selectIsContractPending = createSelector(
  [selectContractLoading],
  (loading) => loading === "pending"
);

export const selectIsContractSuccess = createSelector(
  [selectContractLoading],
  (loading) => loading === "succeeded"
);

export const selectIsContractError = createSelector(
  [selectContractLoading, selectContractError],
  (loading, error) => loading === "failed" && error !== null
);

export const selectIsLogisticsProviderLoading = createSelector(
  [selectLogisticsProviderLoading],
  (loading) => loading
);

export const selectIsLogisticsProviderError = createSelector(
  [selectLogisticsProviderError],
  (error) => error !== null
);

export const selectIsRegisterLogisticsLoading = createSelector(
  [selectRegisterLogisticsLoading],
  (loading) => loading
);

export const selectIsRegisterLogisticsError = createSelector(
  [selectRegisterLogisticsError],
  (error) => error !== null
);
