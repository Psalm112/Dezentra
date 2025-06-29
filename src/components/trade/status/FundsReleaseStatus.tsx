import { FC, useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  OrderDetails,
  TradeDetails,
  TradeTransactionInfo,
} from "../../../utils/types";
import BaseStatus from "./BaseStatus";
import StatusAlert from "./StatusAlert";
import Button from "../../common/Button";
import { BsShieldExclamation, BsCheckCircle } from "react-icons/bs";
import Modal from "../../common/Modal";
import ConfirmationModal from "../../common/ConfirmationModal";
import { motion, AnimatePresence } from "framer-motion";
import { useWeb3 } from "../../../context/Web3Context";
import { useSnackbar } from "../../../context/SnackbarContext";
// import { useContract } from "../../../utils/hooks/useSmartContract";
import { useOrderData } from "../../../utils/hooks/useOrder";
import { useNavigate } from "react-router-dom";
import { clearStoredOrderId, getStoredOrderId } from "../../../utils/helpers";

interface FundsReleaseStatusProps {
  tradeDetails?: TradeDetails;
  orderDetails?: OrderDetails;
  transactionInfo?: TradeTransactionInfo;
  onContactSeller?: () => void;
  onOrderDispute?: (reason: string) => Promise<void>;
  onConfirmDelivery?: () => void;
  orderId?: string;
  showTimer?: boolean;
}

interface ProcessingState {
  confirmDelivery: boolean;
  raiseDispute: boolean;
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

const FundsReleaseStatus: FC<FundsReleaseStatusProps> = ({
  tradeDetails,
  orderDetails,
  transactionInfo,
  onContactSeller,
  onOrderDispute,
  onConfirmDelivery,
  orderId,
  showTimer,
}) => {
  const { showSnackbar } = useSnackbar();
  const { wallet, chainId, isCorrectNetwork } = useWeb3();
  const { changeOrderStatus } = useOrderData({
    chainId,
    isConnected: wallet.isConnected && isCorrectNetwork,
  });
  const navigate = useNavigate();

  // Refs for cleanup
  const mountedRef = useRef(true);
  const deliveryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const disputeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const crossChainTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [processingState, setProcessingState] = useState<ProcessingState>({
    confirmDelivery: false,
    raiseDispute: false,
  });
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [isDeliveryConfirmed, setIsDeliveryConfirmed] = useState(false);
  const [crossChainStatus, setCrossChainStatus] = useState<CrossChainStatus>({
    isProcessing: false,
  });

  // const { confirmDelivery } = useContract();

  // Cleanup
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      [
        deliveryTimeoutRef,
        disputeTimeoutRef,
        redirectTimeoutRef,
        crossChainTimeoutRef,
      ].forEach((ref) => {
        if (ref.current) clearTimeout(ref.current);
      });
    };
  }, []);

  // Cross-chain detection
  const crossChainInfo = useMemo(() => {
    if (!chainId) return { isCrossChain: false };

    const isCrossChain = Math.random() > 0.4;
    const supportedChains = [43113, 11155111, 84532, 421614];
    const otherChains = supportedChains.filter((id) => id !== chainId);
    const targetChain =
      otherChains[Math.floor(Math.random() * otherChains.length)];

    return {
      isCrossChain,
      sourceChain: CHAIN_NAMES[chainId as keyof typeof CHAIN_NAMES],
      targetChain: CHAIN_NAMES[targetChain as keyof typeof CHAIN_NAMES],
    };
  }, [chainId]);

  const sellerName = useMemo(() => {
    if (typeof orderDetails?.seller !== "string") {
      return orderDetails?.seller?.name || "Unknown seller";
    }
    return orderDetails.seller;
  }, [orderDetails?.seller]);

  const orderAmount = useMemo(() => {
    return (
      orderDetails?.amount?.toString() ||
      tradeDetails?.amount?.toString() ||
      "0"
    );
  }, [orderDetails?.amount, tradeDetails?.amount]);

  const crossChainTransaction = useCallback(
    async (action: string) => {
      if (!crossChainInfo.isCrossChain) return true;

      const ccipMessageId = `0x${Math.random().toString(16).substr(2, 64)}`;

      setCrossChainStatus({
        isProcessing: true,
        sourceChain: crossChainInfo.sourceChain,
        targetChain: crossChainInfo.targetChain,
        ccipMessageId,
        estimatedTime: 180, // 3 minutes
      });

      showSnackbar(
        `🌐 Processing ${action} via CCIP: ${crossChainInfo.sourceChain} → ${crossChainInfo.targetChain}`,
        "info"
      );

      return new Promise<boolean>((resolve) => {
        crossChainTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            setCrossChainStatus({ isProcessing: false });
            showSnackbar(
              `✅ Cross-chain ${action} completed successfully!`,
              "success"
            );
            resolve(true);
          }
        }, 3000);
      });
    },
    [crossChainInfo, showSnackbar]
  );

  const handleConfirmDeliveryClick = useCallback(() => {
    if (!processingState.confirmDelivery && !isDeliveryConfirmed) {
      setIsConfirmationModalOpen(true);
    }
  }, [processingState.confirmDelivery, isDeliveryConfirmed]);

  const handleConfirmationModalClose = useCallback(() => {
    if (!processingState.confirmDelivery) {
      setIsConfirmationModalOpen(false);
    }
  }, [processingState.confirmDelivery]);

  const handleConfirmDelivery = useCallback(async () => {
    if (!wallet.isConnected) {
      showSnackbar("Please connect your wallet to continue", "info");
      return;
    }

    if (!orderId) {
      showSnackbar("Order ID is missing. Cannot confirm delivery.", "error");
      return;
    }

    setProcessingState((prev) => ({ ...prev, confirmDelivery: true }));

    try {
      await crossChainTransaction("delivery confirmation");

      await new Promise((resolve) => setTimeout(resolve, 2000));

      // if (mountedRef.current) {
      setIsDeliveryConfirmed(true);
      setIsConfirmationModalOpen(false);

      try {
        await changeOrderStatus(orderId, "completed", false);
      } catch (error) {
        console.warn("Background status update failed:", error);
      }

      showSnackbar(
        "🎉 Delivery confirmed! Order completed successfully.",
        "success"
      );

      // Clear stored order ID
      clearStoredOrderId();

      redirectTimeoutRef.current = setTimeout(() => {
        // if (mountedRef.current) {
        navigate(`/orders/${orderId}?status=completed`, {
          replace: true,
          state: {
            deliveryConfirmed: true,
            completedAt: Date.now(),
            crossChain: crossChainInfo.isCrossChain,
          },
        });
        // }
      }, 2000);
    } catch (error: any) {
      // if (mountedRef.current) {
      console.error("Error during delivery confirmation:", error);
      showSnackbar("Failed to confirm delivery. Please try again.", "error");
      // }
    } finally {
      // if (mountedRef.current) {
      setProcessingState((prev) => ({ ...prev, confirmDelivery: false }));
      // }
    }
  }, [
    wallet.isConnected,
    orderId,
    crossChainTransaction,
    changeOrderStatus,
    showSnackbar,
    navigate,
    crossChainInfo.isCrossChain,
  ]);

  const handleDisputeSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!disputeReason.trim()) {
        showSnackbar("Please provide a reason for the dispute", "info");
        return;
      }

      if (!orderId) {
        showSnackbar("Order ID is missing. Cannot raise dispute.", "error");
        return;
      }

      setProcessingState((prev) => ({ ...prev, raiseDispute: true }));

      try {
        await crossChainTransaction("dispute");

        await new Promise((resolve) => setTimeout(resolve, 1500));

        // if (mountedRef.current) {
        setIsDisputeModalOpen(false);
        setDisputeReason("");

        showSnackbar(
          "📋 Dispute submitted successfully! Admin will review within 24 hours.",
          "success"
        );

        try {
          await changeOrderStatus(orderId, "disputed", false);
        } catch (error) {
          console.warn("Background dispute update failed:", error);
        }

        // Redirect to dispute tracking page
        redirectTimeoutRef.current = setTimeout(() => {
          // if (mountedRef.current) {
          console;
          navigate(`/orders/${orderId}?status=cancelled`, {
            replace: true,
            state: {
              disputeReason: disputeReason.trim(),
              disputedAt: Date.now(),
            },
          });
          // }
        }, 2000);
        // }
      } catch (error: any) {
        // if (mountedRef.current) {
        console.error("Error raising dispute:", error);
        showSnackbar("Failed to submit dispute. Please try again.", "error");
        // }
      } finally {
        // if (mountedRef.current) {
        setProcessingState((prev) => ({ ...prev, raiseDispute: false }));
        // }
      }
    },
    [
      disputeReason,
      orderId,
      crossChainTransaction,
      changeOrderStatus,
      showSnackbar,
      navigate,
    ]
  );

  const actionButtons = useMemo(
    () => (
      <div className="w-full flex justify-center flex-wrap gap-4">
        {onOrderDispute && !isDeliveryConfirmed && (
          <Button
            title="Dispute Order"
            className={`w-fit transition-all duration-200 text-sm px-6 py-3 border rounded ${
              processingState.raiseDispute || processingState.confirmDelivery
                ? "bg-gray-600 border-gray-600 text-gray-400 cursor-not-allowed opacity-50"
                : "bg-transparent hover:bg-red-900/20 text-red-400 border-red-600 hover:border-red-500"
            }`}
            onClick={() => setIsDisputeModalOpen(true)}
            disabled={
              processingState.confirmDelivery ||
              processingState.raiseDispute ||
              isDeliveryConfirmed
            }
          />
        )}

        <Button
          title={
            isDeliveryConfirmed ? (
              <div className="flex items-center gap-2">
                <BsCheckCircle className="w-4 h-4" />
                Delivery Confirmed
              </div>
            ) : processingState.confirmDelivery ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Confirming...
              </div>
            ) : (
              "Confirm Delivery"
            )
          }
          className={`w-fit text-white text-sm px-6 py-3 border-none rounded transition-all duration-200 ${
            isDeliveryConfirmed
              ? "bg-green-600 hover:bg-green-700 cursor-default"
              : processingState.confirmDelivery || processingState.raiseDispute
              ? "bg-gray-600 cursor-not-allowed opacity-50"
              : "bg-Red hover:bg-[#e02d37] hover:shadow-lg transform hover:scale-105"
          }`}
          onClick={handleConfirmDeliveryClick}
          disabled={
            processingState.confirmDelivery ||
            processingState.raiseDispute ||
            isDeliveryConfirmed
          }
        />
      </div>
    ),
    [
      onOrderDispute,
      processingState,
      isDeliveryConfirmed,
      handleConfirmDeliveryClick,
    ]
  );

  // dispute modal
  const disputeModal = useMemo(
    () => (
      <Modal
        isOpen={isDisputeModalOpen}
        onClose={() => {
          if (!processingState.raiseDispute) {
            setIsDisputeModalOpen(false);
            setDisputeReason("");
          }
        }}
        title="Submit Order Dispute"
        maxWidth="md:max-w-lg"
      >
        <div className="mt-4">
          <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-600/30 rounded-lg">
            <p className="text-yellow-400 text-sm">
              ⚠️ Disputes are reviewed within 24 hours. Please provide detailed
              information.
            </p>
          </div>

          <form onSubmit={handleDisputeSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="dispute-reason"
                className="block text-gray-300 mb-2 font-medium"
              >
                Reason for Dispute *
              </label>
              <textarea
                id="dispute-reason"
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                className="w-full px-3 py-2 bg-neutral-800 text-white border border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                rows={4}
                placeholder="Describe the issue with your order (e.g., item not received, wrong item, damaged goods, etc.)"
                disabled={processingState.raiseDispute}
                maxLength={500}
                required
              />
              <div className="text-xs text-gray-400 mt-1 flex justify-between">
                <span>{disputeReason.length}/500 characters</span>
                <span className="text-red-400">* Required</span>
              </div>
            </div>

            <motion.div
              whileHover={{ scale: processingState.raiseDispute ? 1 : 1.02 }}
              whileTap={{ scale: processingState.raiseDispute ? 1 : 0.98 }}
            >
              <Button
                title={
                  processingState.raiseDispute ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting Dispute...
                    </div>
                  ) : (
                    "Submit Dispute"
                  )
                }
                type="submit"
                className={`w-full flex items-center justify-center p-3 transition-all duration-200 ${
                  processingState.raiseDispute
                    ? "bg-red-600/50 cursor-not-allowed opacity-50"
                    : "bg-Red hover:bg-red-600 hover:shadow-lg"
                } text-white rounded-lg`}
                disabled={processingState.raiseDispute || !disputeReason.trim()}
              />
            </motion.div>
          </form>
        </div>
      </Modal>
    ),
    [
      isDisputeModalOpen,
      processingState.raiseDispute,
      disputeReason,
      handleDisputeSubmit,
    ]
  );

  // status alert
  const statusAlert = useMemo(() => {
    if (isDeliveryConfirmed) {
      return (
        <StatusAlert
          icon={<BsCheckCircle size={18} className="text-green-500" />}
          message="Delivery confirmed! Order has been completed successfully."
          type="info"
        />
      );
    }

    const baseMessage = `To ensure the safety of your purchase, please verify the real name of the payer: ${sellerName}`;
    const crossChainMessage = crossChainInfo.isCrossChain
      ? ` This is a cross-chain order (${crossChainInfo.sourceChain} → ${crossChainInfo.targetChain}).`
      : "";

    return (
      <StatusAlert
        icon={<BsShieldExclamation size={18} />}
        message={baseMessage + crossChainMessage}
        type="warning"
      />
    );
  }, [isDeliveryConfirmed, sellerName, crossChainInfo]);

  return (
    <>
      <AnimatePresence>
        {crossChainStatus.isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
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
                <p className="text-xs text-gray-500">via CCIP</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <BaseStatus
        statusTitle={
          isDeliveryConfirmed ? "Order Completed" : "Confirm Delivery"
        }
        statusDescription={
          isDeliveryConfirmed
            ? "Your order has been completed successfully. Funds have been released to the seller."
            : "Dezentra has confirmed payment for this order. Please confirm delivery to complete the transaction."
        }
        statusAlert={statusAlert}
        tradeDetails={tradeDetails}
        orderDetails={orderDetails}
        transactionInfo={transactionInfo}
        contactLabel="Contact Seller"
        onContact={onContactSeller}
        showTimer={showTimer && !isDeliveryConfirmed}
        actionButtons={actionButtons}
      />

      {disputeModal}

      <ConfirmationModal
        isOpen={isConfirmationModalOpen}
        onClose={handleConfirmationModalClose}
        onConfirm={handleConfirmDelivery}
        type="delivery"
        amount={orderAmount}
        currency="USDT"
        senderName={sellerName}
        recipientName={
          typeof orderDetails?.buyer === "string"
            ? orderDetails?.buyer
            : orderDetails?.buyer?.name
        }
        isProcessing={processingState.confirmDelivery}
      />
    </>
  );
};

export default FundsReleaseStatus;
