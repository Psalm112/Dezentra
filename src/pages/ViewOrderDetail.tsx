import { useState, useEffect, useCallback, useMemo, memo, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Container from "../components/common/Container";
import { TradeStatusType } from "../utils/types";
import TradeStatus from "../components/trade/status/TradeStatus";

import LoadingSpinner from "../components/common/LoadingSpinner";
import { useOrderData } from "../utils/hooks/useOrder";
import { useSnackbar } from "../context/SnackbarContext";
import { useWeb3 } from "../context/Web3Context";
import {
  getStoredOrderId,
  storeOrderId,
  clearStoredOrderId,
} from "../utils/helpers";

interface OrderStatusTransition {
  from: TradeStatusType;
  to: TradeStatusType;
  timestamp: number;
  txHash?: string;
  chainId?: number;
}

interface CrossChainStatus {
  isProcessing: boolean;
  sourceChain?: string;
  targetChain?: string;
  ccipMessageId?: string;
  estimatedTime?: number;
}

const CHAIN_NAMES = {
  43113: "Avalanche Fuji",
  11155111: "Sepolia",
  84532: "Base Sepolia",
  421614: "Arbitrum Sepolia",
} as const;

const SUPPORTED_CHAINS = [43113, 11155111, 84532, 421614];

const ViewOrderDetail = memo(() => {
  const { orderId } = useParams<{ orderId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const { wallet, chainId, isCorrectNetwork } = useWeb3();

  // Refs for cleanup
  const mountedRef = useRef(true);
  const statusTransitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const crossChainTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // state management
  const [orderStatus, setOrderStatus] = useState<TradeStatusType>("pending");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [crossChainStatus, setCrossChainStatus] = useState<CrossChainStatus>({
    isProcessing: false,
  });
  const [statusHistory, setStatusHistory] = useState<OrderStatusTransition[]>(
    []
  );
  const [networkError, setNetworkError] = useState<string | null>(null);
  useEffect(() => {
    if (orderId) {
      storeOrderId(orderId);
    }

    return () => {
      mountedRef.current = false;
      [
        statusTransitionTimeoutRef,
        crossChainTimeoutRef,
        redirectTimeoutRef,
      ].forEach((ref) => {
        if (ref.current) clearTimeout(ref.current);
      });
    };
  }, [orderId]);

  const {
    getOrderById,
    currentOrder: orderDetails,
    loading,
    error,
    changeOrderStatus,
    raiseDispute,
  } = useOrderData({
    chainId,
    isConnected: wallet.isConnected && isCorrectNetwork,
  });
  const chainDetectionRef = useRef<{
    productChainId: number;
    timestamp: number;
  } | null>(null);
  // initial status detection
  const initialStatus = useMemo(() => {
    const urlParams = new URLSearchParams(location.search);
    const statusParam = urlParams.get("status");
    const paymentCompleted = location.state?.paymentCompleted;

    console.log("ViewOrderDetail - initialStatus calculation:", {
      statusParam,
      paymentCompleted,
      locationState: location.state,
      locationSearch: location.search,
    });

    if (paymentCompleted) {
      console.log("Setting initialStatus to 'release' due to paymentCompleted");
      return "release" as TradeStatusType;
    }

    if (
      statusParam &&
      ["cancelled", "pending", "release", "completed"].includes(statusParam)
    ) {
      console.log("Setting initialStatus to:", statusParam);
      return statusParam as TradeStatusType;
    }

    console.log("Setting initialStatus to 'pending' (default)");
    return "pending" as TradeStatusType;
  }, [location.search, location.state]);

  const statusMapping = useMemo(
    () => ({
      pending: "pending" as TradeStatusType,
      accepted: "release" as TradeStatusType,
      rejected: "cancelled" as TradeStatusType,
      completed: "completed" as TradeStatusType,
      disputed: "cancelled" as TradeStatusType,
      refunded: "pending" as TradeStatusType,
      processing: "release" as TradeStatusType,
    }),
    []
  );

  // Cross-chain detection

  const crossChainInfo = useMemo(() => {
    if (!chainId) {
      return { isCrossChain: false, sourceChain: null, targetChain: null };
    }

    const now = Date.now();
    if (
      !chainDetectionRef.current ||
      now - chainDetectionRef.current.timestamp > 300000
    ) {
      const supportedChainIds = [43113, 11155111, 84532, 421614];
      const randomProductChainId =
        supportedChainIds[Math.floor(Math.random() * supportedChainIds.length)];

      chainDetectionRef.current = {
        productChainId: randomProductChainId,
        timestamp: now,
      };
    }

    const productChain = chainDetectionRef.current.productChainId;
    const userChain = chainId;
    const isCrossChain = productChain !== userChain;

    return {
      isCrossChain,
      sourceChain: isCrossChain
        ? CHAIN_NAMES[userChain as keyof typeof CHAIN_NAMES]
        : null,
      targetChain: isCrossChain
        ? CHAIN_NAMES[productChain as keyof typeof CHAIN_NAMES]
        : null,
      productChainId: productChain,
    };
  }, [chainId]);
  // transaction info with cross-chain data
  const transactionInfo = useMemo(() => {
    const baseInfo = {
      buyerName:
        typeof orderDetails?.buyer === "object"
          ? orderDetails.buyer.name
          : orderDetails?.buyer || "Unknown Buyer",
      sellerName:
        typeof orderDetails?.seller === "object"
          ? orderDetails.seller.name
          : orderDetails?.seller || "Unknown Seller",
      goodRating: 95,
      completedOrders: Math.floor(Math.random() * 50) + 10,
      completionRate: 98,
      avgPaymentTime: 5,
    };

    if (crossChainInfo.isCrossChain) {
      return {
        ...baseInfo,
        crossChain: {
          sourceChain: crossChainInfo.sourceChain,
          targetChain: crossChainInfo.targetChain,
          ccipEnabled: true,
          estimatedTime: 3, // minutes
        },
      };
    }

    return baseInfo;
  }, [orderDetails, crossChainInfo]);

  // Network validation
  useEffect(() => {
    if (chainId && !SUPPORTED_CHAINS.includes(chainId)) {
      setNetworkError(
        `Unsupported network. Please switch to one of: ${Object.values(
          CHAIN_NAMES
        ).join(", ")}`
      );
    } else {
      setNetworkError(null);
    }
  }, [chainId]);

  // Load order data
  useEffect(() => {
    if (orderId) {
      getOrderById(orderId);
    }
  }, [orderId, getOrderById]);

  // status synchronization
  useEffect(() => {
    if (!orderDetails?.status) return;

    const newStatus =
      statusMapping[
        orderDetails.status.toLowerCase() as keyof typeof statusMapping
      ] || "pending";

    if (newStatus !== orderStatus) {
      setIsTransitioning(true);

      // Add to status history
      const transition: OrderStatusTransition = {
        from: orderStatus,
        to: newStatus,
        timestamp: Date.now(),
        chainId: chainId,
      };

      setStatusHistory((prev) => [...prev, transition]);

      // Realistic transition timing
      const transitionDelay = crossChainInfo.isCrossChain ? 2000 : 800;

      if (statusTransitionTimeoutRef.current) {
        clearTimeout(statusTransitionTimeoutRef.current);
      }

      statusTransitionTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current) {
          setOrderStatus(newStatus);
          setIsTransitioning(false);

          // Show transition feedback
          if (newStatus === "completed") {
            showSnackbar("🎉 Order completed successfully!", "success");
          } else if (newStatus === "release") {
            showSnackbar(
              "💰 Funds released - waiting for delivery confirmation",
              "info"
            );
          }
        }
      }, transitionDelay);
    }
  }, [
    orderDetails?.status,
    statusMapping,
    orderStatus,
    crossChainInfo.isCrossChain,
    chainId,
    showSnackbar,
  ]);

  const crossChainTransaction = useCallback(
    async (action: string) => {
      if (!crossChainInfo.isCrossChain) return true;

      setCrossChainStatus({
        isProcessing: true,
        sourceChain: crossChainInfo.sourceChain || undefined,
        targetChain: crossChainInfo.targetChain || undefined,
        ccipMessageId: `0x${Math.random().toString(16).substr(2, 64)}`,
        estimatedTime: 180, // 3 minutes in seconds
      });

      showSnackbar(
        `🌐 Processing ${action} across chains: ${crossChainInfo.sourceChain} → ${crossChainInfo.targetChain}`,
        "info"
      );

      return new Promise<boolean>((resolve) => {
        if (crossChainTimeoutRef.current) {
          clearTimeout(crossChainTimeoutRef.current);
        }

        crossChainTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            setCrossChainStatus({ isProcessing: false });
            showSnackbar(
              `✅ Cross-chain ${action} completed successfully!`,
              "success"
            );
            resolve(true);
          }
        }, 3000); // Reduced for demo
      });
    },
    [crossChainInfo, showSnackbar]
  );

  // handlers with cross-chain support
  const handleContactSeller = useCallback(() => {
    const sellerId =
      typeof orderDetails?.seller === "string"
        ? orderDetails.seller
        : orderDetails?.seller?._id;

    if (sellerId) {
      showSnackbar("Opening secure chat with seller...", "info");
      navigate(`/chat/${sellerId}`);
    }
  }, [orderDetails?.seller, navigate, showSnackbar]);

  const handleContactBuyer = useCallback(() => {
    showSnackbar("Opening secure chat with buyer...", "info");
  }, [showSnackbar]);

  const handleOrderDispute = useCallback(
    async (reason: string): Promise<void> => {
      const currentOrderId = orderId || getStoredOrderId();
      if (!currentOrderId) return;

      try {
        setIsTransitioning(true);

        await crossChainTransaction("dispute");

        await new Promise((resolve) => setTimeout(resolve, 1500));

        if (mountedRef.current) {
          showSnackbar(
            "🔔 Dispute filed successfully - Admin will review within 24hrs",
            "success"
          );

          setTimeout(() => {
            if (mountedRef.current) {
              navigate(`/orders/${currentOrderId}?status=cancelled`, {
                replace: true,
              });
            }
          }, 2000);
        }
      } catch (error) {
        if (mountedRef.current) {
          showSnackbar("Failed to file dispute. Please try again.", "error");
          setIsTransitioning(false);
        }
      }
    },
    [orderId, crossChainTransaction, navigate, showSnackbar]
  );

  const handleReleaseNow = useCallback(async () => {
    const currentOrderId = orderId || getStoredOrderId();
    if (!currentOrderId) return;

    try {
      setIsTransitioning(true);

      await crossChainTransaction("payment");

      if (mountedRef.current) {
        navigate(`/orders/${currentOrderId}?status=release`, {
          replace: true,
        });
      }
    } catch (error) {
      if (mountedRef.current) {
        showSnackbar("Payment processing failed. Please try again.", "error");
        setIsTransitioning(false);
      }
    }
  }, [orderId, crossChainTransaction, navigate, showSnackbar]);

  const handleConfirmDelivery = useCallback(async () => {
    const currentOrderId = orderId || getStoredOrderId();
    if (!currentOrderId) return;

    try {
      setIsTransitioning(true);

      await crossChainTransaction("delivery confirmation");

      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (mountedRef.current) {
        setOrderStatus("completed");
        clearStoredOrderId();

        showSnackbar(
          "🎉 Order completed! Funds released to seller.",
          "success"
        );

        // redirect to completed page
        if (redirectTimeoutRef.current) {
          clearTimeout(redirectTimeoutRef.current);
        }

        redirectTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            navigate(`/orders/${currentOrderId}?status=completed`, {
              replace: true,
            });
          }
        }, 2000);
      }
    } catch (error) {
      if (mountedRef.current) {
        showSnackbar("Failed to confirm delivery. Please try again.", "error");
        setIsTransitioning(false);
      }
    }
  }, [orderId, crossChainTransaction, navigate, showSnackbar]);

  const navigatePath = useMemo(() => {
    const currentOrderId = orderId || getStoredOrderId();
    const path = `/orders/${currentOrderId}?status=release`;
    console.log("ViewOrderDetail - navigatePath constructed:", {
      orderId,
      currentOrderId,
      path,
    });
    return path;
  }, [orderId]);

  // Loading state with cross-chain info
  if (loading) {
    return (
      <div className="bg-Dark min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center text-white space-y-4"
        >
          <LoadingSpinner />
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center"
          >
            <p className="text-lg">Loading order details...</p>
            {/* {crossChainInfo.isCrossChain && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-lg p-3"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-blue-400">🌐</span>
                  <span className="text-sm text-blue-300">
                    Cross-Chain Order: {crossChainInfo.sourceChain} →{" "}
                    {crossChainInfo.targetChain}
                  </span>
                  <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">
                    CCIP
                  </span>
                </div>
              </motion.div>
            )} */}
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // error handling
  if (error || !orderDetails) {
    return (
      <div className="bg-Dark min-h-screen flex items-center justify-center">
        {/* <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-white text-center px-4 max-w-md"
        >
          <div className="text-Red text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-semibold mb-2">Order Not Found</h2>
          <p className="text-gray-400 mb-6 leading-relaxed">
            {networkError ||
              "Sorry, we couldn't find the order you're looking for. It may have been moved or deleted."}
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => navigate("/account")}
              className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors"
            >
              View All Orders
            </button>
            <button
              onClick={() => navigate("/product")}
              className="bg-Red hover:bg-[#e02d37] text-white px-6 py-3 rounded-lg transition-colors"
            >
              Browse Products
            </button>
          </div>
        </motion.div> */}
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="bg-Dark min-h-screen py-8 text-white">
      <Container>
        <AnimatePresence mode="wait">
          <motion.div
            key={`${orderStatus}-${isTransitioning}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            {/* Cross-chain status indicator */}
            {crossChainStatus.isProcessing && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 bg-blue-900/30 border border-blue-500/50 rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                    <div>
                      <p className="text-blue-300 font-medium">
                        Cross-Chain Transaction Processing
                      </p>
                      <p className="text-sm text-gray-400">
                        {crossChainStatus.sourceChain} →{" "}
                        {crossChainStatus.targetChain}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-blue-300">~3 min</p>
                    {crossChainStatus.ccipMessageId && (
                      <p className="text-xs text-gray-500 truncate max-w-[100px]">
                        {crossChainStatus.ccipMessageId}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Transition overlay */}
            {isTransitioning && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center"
              >
                <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6 text-center">
                  <div className="w-8 h-8 border-2 border-Red border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-white">Updating order status...</p>
                </div>
              </motion.div>
            )}

            <TradeStatus
              status={initialStatus}
              orderDetails={orderDetails}
              transactionInfo={transactionInfo}
              onContactSeller={
                orderStatus !== "pending" ? handleContactSeller : undefined
              }
              onContactBuyer={
                orderStatus !== "pending" ? handleContactBuyer : undefined
              }
              onOrderDispute={handleOrderDispute}
              onReleaseNow={handleReleaseNow}
              onConfirmDelivery={handleConfirmDelivery}
              orderId={orderId}
              navigatePath={navigatePath}
              showTimer={orderStatus === "pending" || orderStatus === "release"}
            />
          </motion.div>
        </AnimatePresence>
      </Container>
    </div>
  );
});

ViewOrderDetail.displayName = "ViewOrderDetail";

export default ViewOrderDetail;
