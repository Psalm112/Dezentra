import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "./redux";
import {
  createTrade,
  confirmDelivery,
  registerLogisticsProvider,
  getTradeById,
  getTradesBySeller,
  getTradesByBuyer,
  getLogisticsProviders,
  buyTrade,
  clearTradeResponse,
  setTransactionPending,
  clearDeliveryConfirmError,
} from "../../store/slices/contractSlice";
import {
  selectContractLoading,
  selectContractError,
  selectTradeResponse,
  selectTransactionPending,
  selectDeliveryConfirmLoading,
  selectDeliveryConfirmError,
  selectIsContractPending,
  selectIsContractSuccess,
  selectIsContractError,
  selectCurrentTrade,
  selectSellerTrades,
  selectBuyerTrades,
  selectLogisticsProviders,
  selectLogisticsProviderLoading,
  selectLogisticsProviderError,
  selectRegisterLogisticsLoading,
  selectRegisterLogisticsError,
  selectRegisterLogisticsHash,
} from "../../store/selectors/contractSelectors";
import { useSnackbar } from "../../context/SnackbarContext";
import { CreateTradeParams } from "../types";

export const useContract = () => {
  const dispatch = useAppDispatch();
  const { showSnackbar } = useSnackbar();

  // Selectors
  const contractLoading = useAppSelector(selectContractLoading);
  const contractError = useAppSelector(selectContractError);
  const tradeResponse = useAppSelector(selectTradeResponse);
  const transactionPending = useAppSelector(selectTransactionPending);
  const deliveryConfirmLoading = useAppSelector(selectDeliveryConfirmLoading);
  const deliveryConfirmError = useAppSelector(selectDeliveryConfirmError);
  const isContractPending = useAppSelector(selectIsContractPending);
  const isContractSuccess = useAppSelector(selectIsContractSuccess);
  const isContractError = useAppSelector(selectIsContractError);
  const currentTrade = useAppSelector(selectCurrentTrade);
  const sellerTrades = useAppSelector(selectSellerTrades);
  const buyerTrades = useAppSelector(selectBuyerTrades);
  const logisticsProviders = useAppSelector(selectLogisticsProviders);
  const logisticsProviderLoading = useAppSelector(
    selectLogisticsProviderLoading
  );
  const logisticsProviderError = useAppSelector(selectLogisticsProviderError);
  const registerLogisticsLoading = useAppSelector(
    selectRegisterLogisticsLoading
  );
  const registerLogisticsError = useAppSelector(selectRegisterLogisticsError);
  const registerLogisticsHash = useAppSelector(selectRegisterLogisticsHash);

  // Actions
  const handleCreateTrade = useCallback(
    async (tradeData: CreateTradeParams, showNotifications = true) => {
      try {
        await dispatch(createTrade(tradeData)).unwrap();
        if (showNotifications) {
          showSnackbar("Trade created successfully", "success");
        }
        return true;
      } catch (err) {
        if (showNotifications) {
          showSnackbar((err as string) || "Failed to create trade", "error");
        }
        return false;
      }
    },
    [dispatch, showSnackbar]
  );

  const handleConfirmDelivery = useCallback(
    async (tradeId: string, showNotifications = true) => {
      try {
        const result = await dispatch(confirmDelivery(tradeId)).unwrap();
        if (showNotifications) {
          showSnackbar("Delivery confirmed successfully", "success");
        }
        return { success: true, message: result.message };
      } catch (err) {
        if (showNotifications) {
          showSnackbar(
            (err as string) || "Failed to confirm delivery",
            "error"
          );
        }
        return { success: false, message: err as string };
      }
    },
    [dispatch, showSnackbar]
  );

  const handleRegisterLogisticsProvider = useCallback(
    async (providerAddress: string, showNotifications = true) => {
      try {
        const result = await dispatch(
          registerLogisticsProvider(providerAddress)
        ).unwrap();
        if (showNotifications) {
          showSnackbar("Logistics provider registered successfully", "success");
        }
        return result.transactionHash;
      } catch (err) {
        if (showNotifications) {
          showSnackbar(
            (err as string) || "Failed to register logistics provider",
            "error"
          );
        }
        return null;
      }
    },
    [dispatch, showSnackbar]
  );

  const handleGetTradeById = useCallback(
    async (tradeId: string, showNotifications = false) => {
      try {
        await dispatch(getTradeById(tradeId)).unwrap();
        if (showNotifications) {
          showSnackbar("Trade details loaded successfully", "success");
        }
        return true;
      } catch (err) {
        if (showNotifications) {
          showSnackbar(
            (err as string) || "Failed to load trade details",
            "error"
          );
        }
        return false;
      }
    },
    [dispatch, showSnackbar]
  );

  const handleGetTradesBySeller = useCallback(
    async (showNotifications = false) => {
      try {
        await dispatch(getTradesBySeller()).unwrap();
        if (showNotifications) {
          showSnackbar("Seller trades loaded successfully", "success");
        }
        return true;
      } catch (err) {
        if (showNotifications) {
          showSnackbar(
            (err as string) || "Failed to load seller trades",
            "error"
          );
        }
        return false;
      }
    },
    [dispatch, showSnackbar]
  );

  const handleGetTradesByBuyer = useCallback(
    async (showNotifications = false) => {
      try {
        await dispatch(getTradesByBuyer()).unwrap();
        if (showNotifications) {
          showSnackbar("Buyer trades loaded successfully", "success");
        }
        return true;
      } catch (err) {
        if (showNotifications) {
          showSnackbar(
            (err as string) || "Failed to load buyer trades",
            "error"
          );
        }
        return false;
      }
    },
    [dispatch, showSnackbar]
  );

  const handleGetLogisticsProviders = useCallback(
    async (showNotifications = false) => {
      try {
        await dispatch(getLogisticsProviders()).unwrap();
        if (showNotifications) {
          showSnackbar("Logistics providers loaded successfully", "success");
        }
        return true;
      } catch (err) {
        if (showNotifications) {
          showSnackbar(
            (err as string) || "Failed to load logistics providers",
            "error"
          );
        }
        return false;
      }
    },
    [dispatch, showSnackbar]
  );

  const handleBuyTrade = useCallback(
    async (
      params: { tradeId: string; quantity: number; logisticsProvider: string },
      showNotifications = true
    ) => {
      try {
        const result = await dispatch(buyTrade(params)).unwrap();
        if (showNotifications) {
          showSnackbar("Trade purchase successful", "success");
        }

        // Return success with transaction hash if available
        return {
          success: true,
          transactionHash: result?.transactionHash || null,
          message: result?.message || "Transaction completed successfully",
        };
      } catch (err) {
        if (showNotifications) {
          showSnackbar((err as string) || "Failed to purchase trade", "error");
        }
        return {
          success: false,
          message: (err as string) || "Failed to purchase trade",
        };
      }
    },
    [dispatch, showSnackbar]
  );

  const handleClearTradeResponse = useCallback(() => {
    dispatch(clearTradeResponse());
  }, [dispatch]);

  const handleSetTransactionPending = useCallback(
    (isPending: boolean) => {
      dispatch(setTransactionPending(isPending));
    },
    [dispatch]
  );

  const handleClearDeliveryConfirmError = useCallback(() => {
    dispatch(clearDeliveryConfirmError());
  }, [dispatch]);

  return {
    // State
    contractLoading,
    contractError,
    tradeResponse,
    transactionPending,
    deliveryConfirmLoading,
    deliveryConfirmError,
    isContractPending,
    isContractSuccess,
    isContractError,
    currentTrade,
    sellerTrades,
    buyerTrades,
    logisticsProviders,
    logisticsProviderLoading,
    logisticsProviderError,
    registerLogisticsLoading,
    registerLogisticsError,
    registerLogisticsHash,

    // Actions
    createTrade: handleCreateTrade,
    confirmDelivery: handleConfirmDelivery,
    registerLogisticsProvider: handleRegisterLogisticsProvider,
    getTradeById: handleGetTradeById,
    getTradesBySeller: handleGetTradesBySeller,
    getTradesByBuyer: handleGetTradesByBuyer,
    getLogisticsProviders: handleGetLogisticsProviders,
    buyTrade: handleBuyTrade,
    clearTradeResponse: handleClearTradeResponse,
    setTransactionPending: handleSetTransactionPending,
    clearDeliveryConfirmError: handleClearDeliveryConfirmError,
  };
};
