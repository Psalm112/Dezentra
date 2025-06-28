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

interface UseOrderDataProps {
  chainId?: number;
  isConnected?: boolean;
}

export const useOrderData = ({
  chainId,
  isConnected = false,
}: UseOrderDataProps = {}) => {
  const { secondaryCurrency } = useCurrency();
  const dispatch = useAppDispatch();
  const { showSnackbar } = useSnackbar();
  const {
    loading: exchangeRatesLoading,
    convertPrice,
    formatPrice,
  } = useCurrencyConverter({ chainId, isConnected });

  const orders = useAppSelector(selectAllOrders);
  const sellerOrders = useAppSelector(selectSellerOrders);
  const currentOrder = useAppSelector(selectCurrentOrder);
  const loading = useAppSelector(selectOrderLoading);
  const error = useAppSelector(selectOrderError);

  const formatOrderWithCurrencies = useCallback(
    (order: Order) => {
      if (!order || !order._id) return null;

      const usdtPrice = order.amount;
      const celoPrice = convertPrice(usdtPrice, "USDT", "NATIVE");
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
        formattedCeloPrice: formatPrice(celoPrice, "NATIVE"),
        formattedFiatPrice: formatPrice(fiatPrice, "FIAT"),
        formattedUsdtAmount: formatPrice(totalUsdtAmount, "USDT"),
        formattedCeloAmount: formatPrice(totalCeloAmount, "NATIVE"),
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
    return sellerOrders
      .map(formatOrderWithCurrencies)
      .filter((order): order is NonNullable<typeof order> => order !== null);
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

    const celoSpent = convertPrice(usdtSpent, "USDT", "NATIVE");
    const celoEarned = convertPrice(usdtEarned, "USDT", "NATIVE");

    const fiatSpent = convertPrice(usdtSpent, "USDT", "FIAT");
    const fiatEarned = convertPrice(usdtEarned, "USDT", "FIAT");

    const pendingBuyerCount = orders.filter(
      (o) => o.status === "pending"
    ).length;
    const pendingSellerCount = sellerOrders.filter(
      (o) => o.status === "pending"
    ).length;
    const completedBuyerCount = orders.filter(
      (o) => o.status === "completed"
    ).length;
    const completedSellerCount = sellerOrders.filter(
      (o) => o.status === "completed"
    ).length;
    const disputedBuyerCount = orders.filter(
      (o) => o.status === "disputed"
    ).length;
    const disputedSellerCount = sellerOrders.filter(
      (o) => o.status === "disputed"
    ).length;

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
      formattedCeloAmountSpent: formatPrice(celoSpent, "NATIVE"),
      formattedCeloAmountEarned: formatPrice(celoEarned, "NATIVE"),
      formattedFiatAmountSpent: formatPrice(fiatSpent, "FIAT"),
      formattedFiatAmountEarned: formatPrice(fiatEarned, "FIAT"),

      pendingBuyerOrders: pendingBuyerCount,
      pendingSellerOrders: pendingSellerCount,
      completedBuyerOrders: completedBuyerCount,
      completedSellerOrders: completedSellerCount,
      disputedBuyerOrders: disputedBuyerCount,
      disputedSellerOrders: disputedSellerCount,
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
        return null;
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
        return null;
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
    async (orderId: string, status: OrderStatus, showNotification = true) => {
      try {
        const result = await dispatch(
          updateOrderStatus({ orderId, details: { status } })
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

  const clearOrders = useCallback(() => {
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
    loading,
    error,
    exchangeRatesLoading,
    placeOrder,
    fetchBuyerOrders,
    fetchMerchantOrders,
    getOrderById,
    changeOrderStatus,
    raiseDispute,
    clearOrders,
    secondaryCurrency,
  };
};
