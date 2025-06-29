import { FC, useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  OrderDetails,
  TradeDetails,
  TradeTransactionInfo,
} from "../../../utils/types";
import BaseStatus from "./BaseStatus";
import StatusAlert from "./StatusAlert";
import Button from "../../common/Button";
import { BsShieldExclamation } from "react-icons/bs";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Modal from "../../common/Modal";
import { FiEdit2 } from "react-icons/fi";
import LogisticsSelector from "../../product/singleProduct/LogisticsSelector";
import { useSnackbar } from "../../../context/SnackbarContext";
import { useWeb3 } from "../../../context/Web3Context";
import { useWalletBalance } from "../../../utils/hooks/useWalletBalance";
import { useOrderData } from "../../../utils/hooks/useOrder";
import { ESCROW_ADDRESSES } from "../../../utils/config/web3.config";
import PaymentModal from "../../web3/PaymentModal";
import WalletConnectionModal from "../../web3/WalletConnectionModal";
import {
  clearStoredOrderId,
  getStoredOrderId,
  storeOrderId,
} from "../../../utils/helpers";
import { PaymentTransaction } from "../../../utils/types/web3.types";

interface PendingPaymentStatusProps {
  tradeDetails?: TradeDetails;
  orderDetails?: OrderDetails;
  transactionInfo?: TradeTransactionInfo;
  onContactSeller?: () => void;
  onOrderDispute?: (reason: string) => Promise<void>;
  onReleaseNow?: () => void;
  navigatePath?: string;
  orderId?: string;
  showTimer?: boolean;
  onUpdateOrder?: (orderId: string, updates: any) => Promise<void>;
}

interface TimeRemaining {
  minutes: number;
  seconds: number;
}

interface UpdateOrderPayload {
  quantity: number;
  logisticsProviderWalletAddress?: string;
}

// Navigation constants
const NAVIGATION_DELAY = 1500;
const FALLBACK_NAVIGATION_DELAY = 2000;
const ORDER_STATUS_UPDATE_TIMEOUT = 5000;

const PendingPaymentStatus: FC<PendingPaymentStatusProps> = ({
  tradeDetails,
  orderDetails: details,
  transactionInfo: txInfo,
  onReleaseNow,
  navigatePath,
  orderId,
  showTimer = false,
  onUpdateOrder,
}) => {
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const { wallet, connectWallet, chainId, isCorrectNetwork } = useWeb3();
  const { usdtBalance, refetch: refetchBalance } = useWalletBalance();
  const { changeOrderStatus, currentOrder } = useOrderData({
    chainId,
    isConnected: wallet.isConnected && isCorrectNetwork,
  });

  const [paymentState, setPaymentState] = useState<{
    isProcessing: boolean;
    isCompleted: boolean;
    completedAt: number | null;
    navigationTriggered: boolean;
  }>({
    isProcessing: false,
    isCompleted: false,
    completedAt: null,
    navigationTriggered: false,
  });

  const [showWalletModal, setShowWalletModal] = useState(false);

  // Refs for cleanup management
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const balanceRefetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const orderStatusTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>(() => ({
    minutes: 9,
    seconds: 59,
  }));
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedLogisticsProvider, setSelectedLogisticsProvider] =
    useState<any>(null);

  const orderDetails = useMemo(() => {
    if (!details) return details;
    return {
      ...details,
      logisticsProviderWalletAddress:
        details.logisticsProviderWalletAddress || [],
    };
  }, [
    details?._id,
    details?.status,
    details?.quantity,
    details?.product?.price,
    details?.logisticsProviderWalletAddress,
  ]);

  const transactionInfo = useMemo(
    () => txInfo,
    [txInfo?.buyerName, txInfo?.sellerName]
  );

  useEffect(() => {
    if (orderId) {
      storeOrderId(orderId);
    }
  }, [orderId]);

  // // Debug: Log navigatePath changes
  // useEffect(() => {
  //   console.log("PendingPaymentStatus - navigatePath changed:", navigatePath);
  // }, [navigatePath]);

  // cleanup effect
  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      // Clear all timeouts and intervals
      const timeouts = [
        timerRef.current,
        balanceRefetchTimeoutRef.current,
        navigationTimeoutRef.current,
        orderStatusTimeoutRef.current,
      ];

      timeouts.forEach((timeout) => {
        if (timeout) {
          clearTimeout(timeout);
        }
      });

      // Abort any pending requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Order validation
  const orderValidation = useMemo(() => {
    try {
      if (paymentState.isCompleted) {
        return { isValid: true, error: null };
      }

      if (!orderDetails?.product?.price || !orderDetails.quantity) {
        return {
          isValid: false,
          error: "Order information incomplete",
        };
      }

      if (quantity <= 0 || quantity > 999) {
        return {
          isValid: false,
          error: "Invalid quantity (1-999)",
        };
      }

      return { isValid: true, error: null };
    } catch (error) {
      console.error("Order validation error:", error);
      return {
        isValid: false,
        error: "Order validation failed",
      };
    }
  }, [
    orderDetails?.product?.price,
    orderDetails?.quantity,
    quantity,
    paymentState.isCompleted,
  ]);

  // Calculations
  const calculations = useMemo(() => {
    if (!orderValidation.isValid || !orderDetails?.product?.price) {
      return {
        totalAmount: 0,
        requiredAmount: 0,
        hasChanges: false,
        userBalance: 0,
        hasSufficientBalance: false,
      };
    }

    try {
      const totalAmount = Number(
        (orderDetails.product.price * quantity).toFixed(6)
      );
      const requiredAmount = Number((totalAmount * 1.02).toFixed(6));

      const hasQuantityChanged = quantity !== orderDetails.quantity;
      const currentLogistics = orderDetails.logisticsProviderWalletAddress?.[0];
      const selectedLogistics = selectedLogisticsProvider?.walletAddress;
      const hasLogisticsChanged =
        selectedLogistics && selectedLogistics !== currentLogistics;

      const userBalance = (() => {
        const balanceStr = String(usdtBalance || 0).replace(/[,\s]/g, "");
        const parsed = Number(balanceStr);
        return Number.isFinite(parsed) ? parsed : 0;
      })();
      return {
        totalAmount,
        requiredAmount,
        hasChanges: hasQuantityChanged || Boolean(hasLogisticsChanged),
        userBalance,
        hasSufficientBalance: userBalance >= requiredAmount,
      };
    } catch (error) {
      console.error("Calculation error:", error);
      return {
        totalAmount: 0,
        requiredAmount: 0,
        hasChanges: false,
        userBalance: 0,
        hasSufficientBalance: false,
      };
    }
  }, [
    orderValidation.isValid,
    orderDetails?.product?.price,
    orderDetails?.quantity,
    orderDetails?.logisticsProviderWalletAddress?.[0],
    quantity,
    selectedLogisticsProvider?.walletAddress,
    usdtBalance,
  ]);

  const escrowAddress = useMemo(() => {
    try {
      return ESCROW_ADDRESSES[43113] || ESCROW_ADDRESSES[84532] || null;
    } catch {
      return null;
    }
  }, []);

  const payButtonText = useMemo(() => {
    if (paymentState.isCompleted) {
      return "Payment Completed ✓";
    }

    if (paymentState.isProcessing || loading) {
      return "Processing Payment...";
    }

    if (!wallet.isConnected) {
      return "Connect Wallet to Pay";
    }
    if (!calculations.hasSufficientBalance) return "Insufficient Balance";
    return `Pay ${calculations.totalAmount.toFixed(2)} USDT`;
  }, [
    paymentState.isCompleted,
    paymentState.isProcessing,
    loading,
    wallet.isConnected,
    calculations.totalAmount,
    calculations.hasSufficientBalance,
  ]);

  // Set initial quantity
  useEffect(() => {
    if (
      orderDetails?.quantity &&
      quantity === 1 &&
      orderDetails.quantity !== 1 &&
      !paymentState.isCompleted
    ) {
      setQuantity(orderDetails.quantity);
    }
  }, [orderDetails?.quantity, paymentState.isCompleted]);

  // Timer effect
  useEffect(() => {
    if (!showTimer || paymentState.isCompleted) return;

    const timer = setInterval(() => {
      if (!mountedRef.current) return;

      setTimeRemaining((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        }
        if (prev.minutes > 0) {
          return { minutes: prev.minutes - 1, seconds: 59 };
        }
        return { minutes: 0, seconds: 0 };
      });
    }, 1000);

    timerRef.current = timer;
    return () => clearInterval(timer);
  }, [showTimer, paymentState.isCompleted]);

  // Balance refetch with debouncing
  const debouncedRefetchBalance = useCallback(() => {
    if (balanceRefetchTimeoutRef.current) {
      clearTimeout(balanceRefetchTimeoutRef.current);
    }
    balanceRefetchTimeoutRef.current = setTimeout(async () => {
      if (mountedRef.current && !isLoadingBalance) {
        setIsLoadingBalance(true);
        try {
          await refetchBalance();
        } finally {
          if (mountedRef.current) {
            setIsLoadingBalance(false);
          }
        }
      }
    }, 1000);
  }, [refetchBalance, isLoadingBalance]);

  // payment success handler
  const handlePaymentSuccess = useCallback(
    async (transaction: PaymentTransaction) => {
      // if (!mountedRef.current) return;

      console.log(
        "Payment success handler called with navigatePath:",
        navigatePath
      );

      // Close payment modal immediately
      setIsPaymentModalOpen(false);

      try {
        // Update payment state
        setPaymentState({
          isProcessing: false,
          isCompleted: true,
          completedAt: Date.now(),
          navigationTriggered: false,
        });

        showSnackbar("Payment completed successfully!", "success");

        // Update order status in background with timeout
        const currentOrderId = getStoredOrderId();
        console.log("Current order ID:", currentOrderId);

        if (currentOrder?._id || currentOrderId) {
          const orderStatusPromise = changeOrderStatus(
            currentOrder?._id || currentOrderId!,
            "accepted",
            false
          );

          if (orderStatusTimeoutRef.current) {
            clearTimeout(orderStatusTimeoutRef.current);
          }

          orderStatusTimeoutRef.current = setTimeout(() => {
            console.warn("Order status update timeout");
          }, ORDER_STATUS_UPDATE_TIMEOUT);

          try {
            await Promise.race([
              orderStatusPromise,
              new Promise((_, reject) =>
                setTimeout(
                  () => reject(new Error("Order status update timeout")),
                  ORDER_STATUS_UPDATE_TIMEOUT
                )
              ),
            ]);

            if (orderStatusTimeoutRef.current) {
              clearTimeout(orderStatusTimeoutRef.current);
            }
          } catch (error) {
            console.warn("Background order status update failed:", error);
          }
        }

        // Clear any existing navigation timeout
        if (navigationTimeoutRef.current) {
          clearTimeout(navigationTimeoutRef.current);
        }

        // Perform navigation after a short delay to ensure UI updates
        navigationTimeoutRef.current = setTimeout(() => {
          console.log(
            "Navigation timeout triggered, mountedRef:",
            mountedRef.current,
            "navigatePath:",
            navigatePath
          );
          if (navigatePath) {
            console.log("Navigating to:", navigatePath);
            try {
              navigate(navigatePath, {
                replace: true,
                state: {
                  paymentCompleted: true,
                  transaction: transaction,
                  timestamp: Date.now(),
                },
              });
            } catch (navError) {
              console.error("Navigation failed:", navError);
              // Fallback: try direct navigation
              window.location.href = navigatePath;
            }
          } else {
            console.warn(
              "Navigation skipped - component unmounted or no navigatePath"
            );
            // If no navigatePath, try to construct one
            if (mountedRef.current && orderId) {
              const fallbackPath = `/orders/${orderId}?status=release`;
              console.log("Using fallback path:", fallbackPath);
              try {
                navigate(fallbackPath, {
                  replace: true,
                  state: {
                    paymentCompleted: true,
                    transaction: transaction,
                    timestamp: Date.now(),
                  },
                });
              } catch (navError) {
                console.error("Fallback navigation failed:", navError);
                window.location.href = fallbackPath;
              }
            }
          }
        }, NAVIGATION_DELAY);

        // Clear stored order ID after navigation is set up
        setTimeout(() => {
          clearStoredOrderId();
        }, NAVIGATION_DELAY + 500);
      } catch (error) {
        console.error("Post-payment processing error:", error);

        // Fallback navigation on error
        setTimeout(() => {
          if (mountedRef.current && navigatePath) {
            console.log("Fallback navigation to:", navigatePath);
            try {
              navigate(navigatePath, { replace: true });
            } catch (navError) {
              console.error("Fallback navigation failed:", navError);
              window.location.href = navigatePath;
            }
          }
        }, FALLBACK_NAVIGATION_DELAY);
      }
    },
    [
      showSnackbar,
      changeOrderStatus,
      currentOrder,
      navigatePath,
      navigate,
      orderId,
    ]
  );

  // Payment handler
  const handlePayNow = useCallback(async () => {
    if (
      !orderValidation.isValid ||
      loading ||
      paymentState.isProcessing ||
      paymentState.isCompleted
    ) {
      return;
    }

    setLoading(true);
    setPaymentState((prev) => ({ ...prev, isProcessing: true }));

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      if (!wallet.isConnected) {
        setShowWalletModal(true);
        await new Promise((resolve) => setTimeout(resolve, 500));
        debouncedRefetchBalance();
        return;
      }

      if (controller.signal.aborted) return;

      setIsPaymentModalOpen(true);
    } catch (error) {
      if (!controller.signal.aborted && mountedRef.current) {
        console.error("Payment initialization failed:", error);
        showSnackbar(
          error instanceof Error
            ? error.message
            : "Failed to initialize payment",
          "error"
        );
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setPaymentState((prev) => ({ ...prev, isProcessing: false }));
      }
    }
  }, [
    orderValidation.isValid,
    loading,
    paymentState.isProcessing,
    paymentState.isCompleted,
    wallet.isConnected,
    debouncedRefetchBalance,
    showSnackbar,
  ]);

  // Update order handler
  const handleUpdateOrder = useCallback(async () => {
    if (
      !orderId ||
      !onUpdateOrder ||
      loading ||
      !calculations.hasChanges ||
      paymentState.isCompleted
    ) {
      if (!calculations.hasChanges) {
        showSnackbar("No changes to save", "info");
      }
      return;
    }

    setLoading(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const updates: UpdateOrderPayload = {
        quantity,
        ...(selectedLogisticsProvider?.walletAddress && {
          logisticsProviderWalletAddress:
            selectedLogisticsProvider.walletAddress,
        }),
      };

      if (controller.signal.aborted) return;

      await onUpdateOrder(orderId, updates);

      if (mountedRef.current) {
        toast.success("Order updated successfully!");
        setIsEditModalOpen(false);
      }
    } catch (error: any) {
      if (!controller.signal.aborted && mountedRef.current) {
        console.error("Order update failed:", error);
        toast.error(
          error?.message || "Failed to update order. Please try again."
        );
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [
    orderId,
    onUpdateOrder,
    loading,
    calculations.hasChanges,
    quantity,
    selectedLogisticsProvider,
    showSnackbar,
    paymentState.isCompleted,
  ]);

  // Modal handlers
  const handleEditModalClose = useCallback(() => {
    if (!loading && !paymentState.isCompleted) {
      setIsEditModalOpen(false);
    }
  }, [loading, paymentState.isCompleted]);

  const handlePaymentModalClose = useCallback(() => {
    if (!loading && !paymentState.isProcessing) {
      setIsPaymentModalOpen(false);
    }
  }, [loading, paymentState.isProcessing]);

  const handleEditModalOpen = useCallback(() => {
    if (!loading && !paymentState.isCompleted) {
      setIsEditModalOpen(true);
    }
  }, [loading, paymentState.isCompleted]);

  // Input handlers
  const handleQuantityChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (paymentState.isCompleted) return;
      const value = Math.max(
        1,
        Math.min(999, parseInt(e.target.value, 10) || 1)
      );
      setQuantity(value);
    },
    [paymentState.isCompleted]
  );

  const handleLogisticsSelect = useCallback(
    (provider: any) => {
      if (!paymentState.isCompleted) {
        setSelectedLogisticsProvider(provider);
      }
    },
    [paymentState.isCompleted]
  );

  const Payment = useMemo(
    () =>
      orderDetails && escrowAddress ? (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={handlePaymentModalClose}
          orderDetails={orderDetails}
          onPaymentSuccess={handlePaymentSuccess}
        />
      ) : null,
    [
      isPaymentModalOpen,
      orderDetails?._id,
      escrowAddress,
      handlePaymentModalClose,
      handlePaymentSuccess,
      navigatePath,
    ]
  );

  const editButton = useMemo(
    () => (
      <Button
        title={
          <div className="flex items-center gap-2">
            <FiEdit2 className="w-4 h-4" />
            {paymentState.isCompleted ? "Order Paid" : "Edit Order"}
          </div>
        }
        className={`${
          paymentState.isCompleted
            ? "bg-green-600/20 border-green-500/50 text-green-400 cursor-not-allowed"
            : "bg-transparent hover:bg-gray-700 text-white border-gray-600 hover:border-gray-500"
        } text-sm px-6 py-3 border rounded transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
        onClick={handleEditModalOpen}
        disabled={loading || paymentState.isCompleted}
      />
    ),
    [handleEditModalOpen, loading, paymentState.isCompleted]
  );

  const payButton = useMemo(
    () => (
      <Button
        title={payButtonText}
        className={`text-white text-sm px-6 py-3 rounded transition-all duration-200 disabled:cursor-not-allowed ${
          paymentState.isCompleted
            ? "bg-green-600 hover:bg-green-700"
            : calculations.hasSufficientBalance &&
              !loading &&
              !paymentState.isProcessing &&
              orderValidation.isValid
            ? "bg-Red hover:bg-[#e02d37]"
            : "bg-gray-600 opacity-75"
        }`}
        onClick={handlePayNow}
        disabled={
          !calculations.hasSufficientBalance ||
          paymentState.isCompleted ||
          loading ||
          paymentState.isProcessing ||
          !orderValidation.isValid
        }
      />
    ),
    [
      payButtonText,
      paymentState.isCompleted,
      paymentState.isProcessing,
      calculations.hasSufficientBalance,
      loading,
      orderValidation.isValid,
      handlePayNow,
    ]
  );

  const statusAlert = useMemo(
    () => (
      <StatusAlert
        icon={
          <BsShieldExclamation
            size={20}
            className={
              paymentState.isCompleted ? "text-green-500" : "text-yellow-600"
            }
          />
        }
        message={
          paymentState.isCompleted
            ? "Payment completed successfully! Your order is being processed."
            : "Please verify all order details before proceeding with payment."
        }
        type={paymentState.isCompleted ? "info" : "warning"}
      />
    ),
    [paymentState.isCompleted]
  );

  // Debug function to test navigation manually
  const testNavigation = useCallback(() => {
    console.log("Testing navigation manually to:", navigatePath);
    if (navigatePath) {
      try {
        navigate(navigatePath, {
          replace: true,
          state: {
            paymentCompleted: true,
            transaction: null,
            timestamp: Date.now(),
          },
        });
      } catch (error) {
        console.error("Manual navigation test failed:", error);
        window.location.href = navigatePath;
      }
    } else {
      console.warn("No navigatePath available for testing");
    }
  }, [navigatePath, navigate]);

  // Early return for invalid states
  if (!orderValidation.isValid && !paymentState.isCompleted) {
    return (
      <div className="text-center py-8">
        <p className="text-red-400">{orderValidation.error}</p>
        <Button
          title="Refresh"
          onClick={() => window.location.reload()}
          className="mt-4 bg-Red hover:bg-[#e02d37] text-white px-4 py-2 rounded"
        />
      </div>
    );
  }

  return (
    <>
      <BaseStatus
        statusTitle={
          paymentState.isCompleted ? "Payment Completed" : "Order Summary"
        }
        statusDescription={
          paymentState.isCompleted
            ? "Your payment has been processed successfully. You will be redirected to track your order."
            : "Review your order details before payment. You can modify quantity and logistics provider if needed."
        }
        statusAlert={statusAlert}
        orderDetails={orderDetails}
        tradeDetails={tradeDetails}
        transactionInfo={transactionInfo}
        showTimer={showTimer && !paymentState.isCompleted}
        timeRemaining={timeRemaining}
        actionButtons={
          <div className="w-full flex items-center justify-center flex-wrap gap-4">
            {editButton}
            {payButton}
            {/* Debug button - only show in development */}
            {process.env.NODE_ENV === "development" && (
              <Button
                title="Test Navigation"
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-3 rounded transition-colors duration-200"
                onClick={testNavigation}
              />
            )}
          </div>
        }
      />

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={handleEditModalClose}
        title="Update Order Details"
        maxWidth="md:max-w-lg"
      >
        <div className="space-y-4 mt-4">
          <div>
            <label htmlFor="quantity" className="block text-gray-300 mb-2">
              Quantity
            </label>
            <input
              type="number"
              id="quantity"
              min={1}
              max={999}
              value={quantity}
              onChange={handleQuantityChange}
              disabled={loading || paymentState.isCompleted}
              className="w-full px-3 py-2 bg-neutral-800 text-white border border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors duration-200 disabled:opacity-50"
            />
          </div>

          {orderDetails?.product && (
            <LogisticsSelector
              logisticsCost={orderDetails.product.logisticsCost ?? []}
              logisticsProviders={orderDetails.product.logisticsProviders ?? []}
              onSelect={handleLogisticsSelect}
              selectedProviderWalletAddress={
                orderDetails.logisticsProviderWalletAddress[0]
              }
            />
          )}

          <div className="flex justify-end gap-3 mt-6">
            <Button
              title="Cancel"
              className="bg-transparent hover:bg-gray-700 text-white text-sm px-4 py-2 border border-gray-600 rounded transition-colors duration-200"
              onClick={handleEditModalClose}
              disabled={loading}
            />
            <Button
              title={loading ? "Updating..." : "Save Changes"}
              className="bg-Red hover:bg-[#e02d37] text-white text-sm px-4 py-2 rounded transition-colors duration-200 disabled:opacity-50"
              onClick={handleUpdateOrder}
              disabled={
                loading || !calculations.hasChanges || paymentState.isCompleted
              }
            />
          </div>
        </div>
      </Modal>

      {Payment}

      <WalletConnectionModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
      />
    </>
  );
};

export default PendingPaymentStatus;
