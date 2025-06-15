// src/utils/hooks/useOrder.ts
import { useCallback, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "./redux";
import {
  createOrder,
  fetchUserOrders,
  fetchSellerOrders,
  fetchOrderById,
  updateOrderStatus,
  raiseOrderDispute,
  clearOrderState,
} from "../../store/slices/orderSlice";
import {
  selectAllOrders,
  selectSellerOrders,
  selectCurrentOrder,
  selectOrderLoading,
  selectOrderError,
  // selectOrdersByStatus,
} from "../../store/selectors/orderSelectors";
import { useSnackbar } from "../../context/SnackbarContext";
import { useEffect } from "react";
import { api } from "../services/apiService";
import { OrderStatus, Order } from "../types";
import { useCurrencyConverter } from "./useCurrencyConverter";
import { useCurrency } from "../../context/CurrencyContext";

export const useOrderData = () => {
  const { secondaryCurrency } = useCurrency();
  const dispatch = useAppDispatch();
  const { showSnackbar } = useSnackbar();
  const {
    loading: exchangeRatesLoading,
    convertPrice,
    formatPrice,
  } = useCurrencyConverter();

  const orders = useAppSelector(selectAllOrders);
  const sellerOrders = useAppSelector(selectSellerOrders);
  const currentOrder = useAppSelector(selectCurrentOrder);
  const loading = useAppSelector(selectOrderLoading);
  const error = useAppSelector(selectOrderError);

  const formatOrderWithCurrencies = useCallback(
    (order: Order) => {
      if (!order || !order._id) return null;

      const usdtPrice = order.amount;
      const celoPrice = convertPrice(usdtPrice, "USDT", "CELO");
      const fiatPrice = convertPrice(usdtPrice, "USDT", "FIAT");
      const totalUsdtAmount = usdtPrice * (order.quantity || 1);
      const totalCeloAmount = celoPrice * (order.quantity || 1);
      const totalFiatAmount = fiatPrice * (order.quantity || 1);

      return {
        ...order,
        formattedDate: new Date(order.createdAt).toLocaleDateString(),
        formattedAmount: usdtPrice.toFixed(2),

        usdtPrice,
        celoPrice,
        fiatPrice,

        formattedUsdtPrice: formatPrice(usdtPrice, "USDT"),
        formattedCeloPrice: formatPrice(celoPrice, "CELO"),
        formattedFiatPrice: formatPrice(fiatPrice, "FIAT"),
        formattedUsdtAmount: formatPrice(totalUsdtAmount, "USDT"),
        formattedCeloAmount: formatPrice(totalCeloAmount, "CELO"),
        formattedFiatAmount: formatPrice(totalFiatAmount, "FIAT"),
      };
    },
    [convertPrice, formatPrice]
  );

  const formattedOrders = useMemo(() => {
    return orders
      .map(formatOrderWithCurrencies)
      .filter((order): order is NonNullable<typeof order> => order !== null);
  }, [orders, formatOrderWithCurrencies]);

  const formattedSellerOrders = useMemo(() => {
    return sellerOrders.map(formatOrderWithCurrencies);
  }, [sellerOrders, formatOrderWithCurrencies]);

  const formattedCurrentOrder = useMemo(() => {
    if (!currentOrder) return null;
    return formatOrderWithCurrencies(currentOrder);
  }, [currentOrder, formatOrderWithCurrencies]);

  const disputeOrders = useMemo(() => {
    return formattedOrders.filter(
      (order) => order.status === "disputed" && order.product?._id
    );
  }, [formattedOrders]);

  const nonDisputeOrders = useMemo(() => {
    return formattedOrders.filter(
      (order) => order.status !== "disputed" && order.product?._id
    );
  }, [formattedOrders]);

  const activeTrades = useMemo(() => {
    return formattedOrders.filter(
      (order) => order.status !== "disputed" && order.status !== "completed"
    );
  }, [formattedOrders]);

  const completedTrades = useMemo(() => {
    return formattedOrders.filter((order) => order.status === "completed");
  }, [formattedOrders]);

  const orderStats = useMemo(() => {
    const buyerTotal = orders.reduce((sum, order) => sum + order.amount, 0);
    const sellerTotal = sellerOrders.reduce(
      (sum, order) => sum + order.amount,
      0
    );

    const usdtSpent = buyerTotal;
    const usdtEarned = sellerTotal;

    const celoSpent = convertPrice(usdtSpent, "USDT", "CELO");
    const celoEarned = convertPrice(usdtEarned, "USDT", "CELO");

    const fiatSpent = convertPrice(usdtSpent, "USDT", "FIAT");
    const fiatEarned = convertPrice(usdtEarned, "USDT", "FIAT");

    return {
      totalBuyer: orders.length,
      totalSeller: sellerOrders.length,
      amountSpent: buyerTotal,
      amountEarned: sellerTotal,
      formattedAmountSpent: usdtSpent.toFixed(2),
      formattedAmountEarned: usdtEarned.toFixed(2),

      usdtSpent,
      usdtEarned,
      celoSpent,
      celoEarned,
      fiatSpent,
      fiatEarned,

      formattedUsdtAmountSpent: formatPrice(usdtSpent, "USDT"),
      formattedUsdtAmountEarned: formatPrice(usdtEarned, "USDT"),
      formattedCeloAmountSpent: formatPrice(celoSpent, "CELO"),
      formattedCeloAmountEarned: formatPrice(celoEarned, "CELO"),
      formattedFiatAmountSpent: formatPrice(fiatSpent, "FIAT"),
      formattedFiatAmountEarned: formatPrice(fiatEarned, "FIAT"),

      pendingBuyerOrders: orders.filter((o) => o.status === "pending").length,
      pendingSellerOrders: sellerOrders.filter((o) => o.status === "pending")
        .length,
      completedBuyerOrders: orders.filter((o) => o.status === "completed")
        .length,
      completedSellerOrders: sellerOrders.filter(
        (o) => o.status === "completed"
      ).length,
      disputedBuyerOrders: orders.filter((o) => o.status === "disputed").length,
      disputedSellerOrders: sellerOrders.filter((o) => o.status === "disputed")
        .length,
    };
  }, [orders, sellerOrders, convertPrice, formatPrice]);

  const placeOrder = useCallback(
    async (
      orderData: {
        product: string;
        quantity: number;
        logisticsProviderWalletAddress: string;
      },
      showNotification = true
    ) => {
      try {
        const result = await dispatch(createOrder(orderData)).unwrap();
        if (showNotification) {
          showSnackbar("Order placed successfully", "success");
        }
        return result;
      } catch (err) {
        if (showNotification) {
          showSnackbar((err as string) || "Failed to place order", "error");
        }
        return null;
      }
    },
    [dispatch, showSnackbar]
  );

  const fetchBuyerOrders = useCallback(
    async (showNotification = false, forceRefresh = false) => {
      try {
        const result = await dispatch(fetchUserOrders(forceRefresh)).unwrap();
        if (showNotification) {
          showSnackbar("Orders loaded successfully", "success");
        }
        return result;
      } catch (err) {
        if (showNotification) {
          showSnackbar((err as string) || "Failed to load orders", "error");
        }
        return [];
      }
    },
    [dispatch, showSnackbar]
  );

  const fetchMerchantOrders = useCallback(
    async (showNotification = false, forceRefresh = false) => {
      try {
        const result = await dispatch(fetchSellerOrders(forceRefresh)).unwrap();
        if (showNotification) {
          showSnackbar("Seller orders loaded successfully", "success");
        }
        return result;
      } catch (err) {
        if (showNotification) {
          showSnackbar(
            (err as string) || "Failed to load seller orders",
            "error"
          );
        }
        return [];
      }
    },
    [dispatch, showSnackbar]
  );

  const getOrderById = useCallback(
    async (orderId: string, showNotification = false) => {
      try {
        const result = await dispatch(fetchOrderById(orderId)).unwrap();
        if (showNotification) {
          showSnackbar("Order details loaded successfully", "success");
        }
        return result;
      } catch (err) {
        if (showNotification) {
          showSnackbar(
            (err as string) || "Failed to load order details",
            "error"
          );
        }
        return null;
      }
    },
    [dispatch, showSnackbar]
  );

  const changeOrderStatus = useCallback(
    async (
      orderId: string,
      details: {
        purchaseId?: string;
        status?: OrderStatus;
        [key: string]: string | OrderStatus | undefined;
      },
      showNotification = true
    ) => {
      try {
        const result = await dispatch(
          updateOrderStatus({ orderId, details })
        ).unwrap();
        if (showNotification) {
          showSnackbar("Order status updated successfully", "success");
        }
        return result;
      } catch (err) {
        if (showNotification) {
          showSnackbar(
            (err as string) || "Failed to update order status",
            "error"
          );
        }
        return null;
      }
    },
    [dispatch, showSnackbar]
  );

  const raiseDispute = useCallback(
    async (orderId: string, reason: string, showNotification = true) => {
      try {
        const result = await dispatch(
          raiseOrderDispute({ orderId, reason })
        ).unwrap();
        if (showNotification) {
          showSnackbar("Dispute raised successfully", "success");
        }
        return result;
      } catch (err) {
        if (showNotification) {
          showSnackbar((err as string) || "Failed to raise dispute", "error");
        }
        return null;
      }
    },
    [dispatch, showSnackbar]
  );

  const getOrdersByStatus = useCallback(
    (status: string) => {
      return orders
        .filter((order) => order.status === status)
        .map(formatOrderWithCurrencies);
    },
    [orders, formatOrderWithCurrencies]
  );

  const clearOrder = useCallback(() => {
    dispatch(clearOrderState());
  }, [dispatch]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      api.cancelRequest("/orders");
    };
  }, []);

  return {
    orders: formattedOrders,
    sellerOrders: formattedSellerOrders,
    currentOrder: formattedCurrentOrder,
    disputeOrders,
    nonDisputeOrders,
    activeTrades,
    completedTrades,

    orderStats,

    loading: loading || exchangeRatesLoading,
    error,

    placeOrder,
    fetchBuyerOrders,
    fetchMerchantOrders,
    getOrderById,
    changeOrderStatus,
    raiseDispute,
    getOrdersByStatus,
    clearOrder,

    secondaryCurrency,
  };
};
