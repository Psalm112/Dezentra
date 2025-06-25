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
  const { wallet, connectWallet, validateTradeBeforePurchase } = useWeb3();
  const { usdtBalance, refetch: refetchBalance } = useWalletBalance();
  const { changeOrderStatus, currentOrder } = useOrderData();

  // Enhanced state management for smooth UX
  const [paymentState, setPaymentState] = useState<{
    isProcessing: boolean;
    isCompleted: boolean;
    completedAt: number | null;
  }>({
    isProcessing: false,
    isCompleted: false,
    completedAt: null,
  });

  const [tradeValidation, setTradeValidation] = useState<{
    isValid: boolean;
    isLoading: boolean;
    error: string | null;
  }>({
    isValid: true,
    isLoading: false,
    error: null,
  });

  const [showWalletModal, setShowWalletModal] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const balanceRefetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tradeValidationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Memoized order details with performance optimization
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

  // Store order ID for persistence
  useEffect(() => {
    if (orderId) {
      storeOrderId(orderId);
    }
  }, [orderId]);

  // Cleanup effect
  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      [
        timerRef,
        abortControllerRef,
        balanceRefetchTimeoutRef,
        tradeValidationTimeoutRef,
        redirectTimeoutRef,
      ].forEach((ref) => {
        if (ref.current) {
          if (ref.current instanceof AbortController) {
            ref.current.abort();
          } else {
            clearTimeout(ref.current as NodeJS.Timeout);
            clearInterval(ref.current as NodeJS.Timeout);
          }
        }
      });
    };
  }, []);

  // Enhanced trade validation with debounce
  useEffect(() => {
    const validateTrade = async () => {
      if (
        !orderDetails?.product?.tradeId ||
        !wallet.isConnected ||
        tradeValidation.isLoading ||
        paymentState.isCompleted
      )
        return;

      if (tradeValidationTimeoutRef.current) {
        clearTimeout(tradeValidationTimeoutRef.current);
      }

      tradeValidationTimeoutRef.current = setTimeout(async () => {
        if (!mountedRef.current) return;

        setTradeValidation({ isValid: true, isLoading: true, error: null });

        try {
          // Simulate validation for hackathon demo
          await new Promise((resolve) => setTimeout(resolve, 1000));

          const isValid =
            (await validateTradeBeforePurchase?.(
              orderDetails.product.tradeId,
              orderDetails.quantity.toString(),
              orderDetails.logisticsProviderWalletAddress[0]
            )) ?? true; // Default to true if validation fails

          if (mountedRef.current) {
            setTradeValidation({
              isValid,
              isLoading: false,
              error: isValid ? null : "Product availability changed",
            });
          }
        } catch (error) {
          if (mountedRef.current) {
            console.warn("Trade validation error:", error);
            // For hackathon demo, assume product is available
            setTradeValidation({
              isValid: true,
              isLoading: false,
              error: null,
            });
          }
        }
      }, 1500);
    };

    validateTrade();

    return () => {
      if (tradeValidationTimeoutRef.current) {
        clearTimeout(tradeValidationTimeoutRef.current);
      }
    };
  }, [
    orderDetails?.product?.tradeId,
    orderDetails?.quantity,
    orderDetails?.logisticsProviderWalletAddress?.[0],
    wallet.isConnected,
    paymentState.isCompleted,
  ]);

  // Enhanced order validation
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

      if (tradeValidation.isLoading) {
        return {
          isValid: false,
          error: "Verifying product availability...",
        };
      }

      if (!tradeValidation.isValid) {
        return {
          isValid: false,
          error: tradeValidation.error || "Product not available",
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
    tradeValidation.isValid,
    tradeValidation.isLoading,
    tradeValidation.error,
    paymentState.isCompleted,
  ]);

  // Enhanced calculations with performance optimization
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

  // Enhanced pay button text with state management
  const payButtonText = useMemo(() => {
    if (paymentState.isCompleted) {
      return "Payment Completed ✓";
    }

    if (paymentState.isProcessing || loading) {
      return "Processing Payment...";
    }

    if (tradeValidation.isLoading) {
      return "Checking availability...";
    }

    if (!tradeValidation.isValid) {
      return "Product unavailable";
    }

    if (!wallet.isConnected) {
      return "Connect Wallet to Pay";
    }

    if (!calculations.hasSufficientBalance) {
      return "Insufficient Balance";
    }

    return `Pay ${calculations.totalAmount.toFixed(2)} USDT`;
  }, [
    paymentState.isCompleted,
    paymentState.isProcessing,
    loading,
    tradeValidation.isLoading,
    tradeValidation.isValid,
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

  // Debounced balance refetch
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

  // Enhanced payment handler with realistic flow
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

      if (!calculations.hasSufficientBalance) {
        showSnackbar(
          `Insufficient USDT balance. Required: ${calculations.requiredAmount.toFixed(
            2
          )} USDT`,
          "error"
        );
        return;
      }

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
    calculations.hasSufficientBalance,
    calculations.requiredAmount,
    debouncedRefetchBalance,
    showSnackbar,
  ]);

  // Enhanced payment success handler with smooth transitions
  const handlePaymentSuccess = useCallback(
    async (transaction: PaymentTransaction) => {
      setIsPaymentModalOpen(false);

      if (!mountedRef.current) return;

      try {
        // Set payment as completed immediately for smooth UX
        setPaymentState({
          isProcessing: false,
          isCompleted: true,
          completedAt: Date.now(),
        });

        // Show success message immediately
        showSnackbar("Payment completed successfully!", "success");

        // Attempt to update order status in background
        const currentOrderId = getStoredOrderId();
        if (currentOrder?._id || currentOrderId) {
          try {
            await changeOrderStatus(
              currentOrder?._id || currentOrderId!,
              {
                status: "accepted",
                purchaseId: transaction.purchaseId,
              },
              false // Don't show loading for background update
            );
          } catch (error) {
            console.warn("Background order status update failed:", error);
            // Don't show error to user as payment was successful
          }
        }

        // Clear stored order ID
        clearStoredOrderId();

        // Smooth redirect with delay for better UX
        if (redirectTimeoutRef.current) {
          clearTimeout(redirectTimeoutRef.current);
        }

        redirectTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            if (navigatePath) {
              navigate(
                navigatePath.replace("status=release", "status=accepted"),
                {
                  replace: true,
                  state: {
                    paymentCompleted: true,
                    transaction: transaction,
                  },
                }
              );
            } else if (onReleaseNow) {
              onReleaseNow();
            }
          }
        }, 1500);
      } catch (error) {
        console.error("Post-payment processing error:", error);
        // Still redirect on error since payment was successful
        if (redirectTimeoutRef.current) {
          clearTimeout(redirectTimeoutRef.current);
        }
        redirectTimeoutRef.current = setTimeout(() => {
          if (navigatePath) {
            navigate(
              navigatePath.replace("status=release", "status=accepted"),
              {
                replace: true,
                state: {
                  paymentCompleted: true,
                  transaction: transaction,
                },
              }
            );
          } else if (onReleaseNow) {
            onReleaseNow();
          }
        }, 500);
      }
    },
    [
      navigate,
      navigatePath,
      showSnackbar,
      changeOrderStatus,
      currentOrder,
      onReleaseNow,
    ]
  );

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

  // Memoized components for performance
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
              tradeValidation.isValid &&
              orderValidation.isValid
            ? "bg-Red hover:bg-[#e02d37]"
            : "bg-gray-600 opacity-75"
        }`}
        onClick={handlePayNow}
        disabled={
          paymentState.isCompleted ||
          (!calculations.hasSufficientBalance && wallet.isConnected) ||
          loading ||
          paymentState.isProcessing ||
          !orderValidation.isValid ||
          !tradeValidation.isValid ||
          tradeValidation.isLoading
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
      tradeValidation.isValid,
      tradeValidation.isLoading,
      wallet.isConnected,
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
              // disabled={paymentState.isCompleted}
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
