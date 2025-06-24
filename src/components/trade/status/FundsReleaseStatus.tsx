import { FC, useState, useEffect, useMemo, useCallback } from "react";
import {
  OrderDetails,
  TradeDetails,
  TradeTransactionInfo,
} from "../../../utils/types";
import BaseStatus from "./BaseStatus";
import StatusAlert from "./StatusAlert";
import Button from "../../common/Button";
import { BsShieldExclamation } from "react-icons/bs";
import Modal from "../../common/Modal";
import ConfirmationModal from "../../common/ConfirmationModal";
import { motion } from "framer-motion";
import { useWeb3 } from "../../../context/Web3Context";
import { useSnackbar } from "../../../context/SnackbarContext";
import { useContract } from "../../../utils/hooks/useSmartContract";
import { useOrderData } from "../../../utils/hooks/useOrder";

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
  const { changeOrderStatus } = useOrderData();
  const [processingState, setProcessingState] = useState<ProcessingState>({
    confirmDelivery: false,
    raiseDispute: false,
  });
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const { confirmDelivery } = useContract();
  const { wallet } = useWeb3();

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

  const handleConfirmDeliveryClick = useCallback(() => {
    setIsConfirmationModalOpen(true);
  }, []);

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
      if (orderDetails?.purchaseId) {
        const result = await confirmDelivery(orderDetails?.purchaseId);
        if (!result.success) {
          throw new Error(result.message || "Failed to confirm delivery");
        }
        await changeOrderStatus(
          orderId,
          {
            status: "completed",
          },
          false
        );

        showSnackbar(
          "Delivery confirmed successfully! Order has been completed.",
          "success"
        );

        setIsConfirmationModalOpen(false);
      }
      showSnackbar(
        "Unabele to confirm delivery at the moment, please try again.",
        "error"
      );
    } catch (error: any) {
      console.error("Error during delivery confirmation:", error);
      showSnackbar(
        error.message || "Failed to confirm delivery. Please try again.",
        "error"
      );
    } finally {
      setProcessingState((prev) => ({ ...prev, confirmDelivery: false }));
    }
  }, [
    wallet.isConnected,
    orderId,
    confirmDelivery,
    changeOrderStatus,
    onConfirmDelivery,
    showSnackbar,
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
        if (onOrderDispute) {
          await onOrderDispute(disputeReason.trim());
        }
        setIsDisputeModalOpen(false);
        setDisputeReason("");

        showSnackbar(
          "Dispute raised successfully! Admin will review your case.",
          "success"
        );
      } catch (error: any) {
        console.error("Error raising dispute:", error);
        showSnackbar(
          error.message || "Failed to raise dispute. Please try again.",
          "error"
        );
      } finally {
        setProcessingState((prev) => ({ ...prev, raiseDispute: false }));
      }
    },
    [disputeReason, orderId, onOrderDispute, showSnackbar]
  );

  const actionButtons = useMemo(
    () => (
      <div className="w-full flex justify-evenly flex-row flex-wrap gap-4">
        {onOrderDispute && (
          <Button
            title="Order Dispute?"
            className="w-fit bg-transparent hover:bg-gray-700 text-white text-sm px-6 py-3 border border-gray-600 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setIsDisputeModalOpen(true)}
            disabled={
              processingState.confirmDelivery || processingState.raiseDispute
            }
          />
        )}

        <Button
          title="Confirm Delivery"
          className={`w-fit text-white text-sm px-6 py-3 border-none rounded transition-colors ${
            processingState.confirmDelivery || processingState.raiseDispute
              ? "bg-gray-600 cursor-not-allowed opacity-50"
              : "bg-Red hover:bg-[#e02d37]"
          }`}
          onClick={handleConfirmDeliveryClick}
          disabled={
            processingState.confirmDelivery || processingState.raiseDispute
          }
        />
      </div>
    ),
    [onOrderDispute, processingState, handleConfirmDeliveryClick]
  );

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
        title="Reason for Dispute"
        maxWidth="md:max-w-lg"
      >
        <form onSubmit={handleDisputeSubmit} className="space-y-4 mt-4">
          <div>
            <textarea
              id="dispute-reason"
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-800 text-white border border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              rows={4}
              placeholder="Share the reason for the dispute or issue"
              disabled={processingState.raiseDispute}
              maxLength={500}
              required
            />
            <div className="text-xs text-gray-400 mt-1">
              {disputeReason.length}/500 characters
            </div>
          </div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              title={
                processingState.raiseDispute ? (
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Submitting...
                  </div>
                ) : (
                  "Submit Dispute"
                )
              }
              type="submit"
              className={`max-w-md mx-auto flex items-center justify-center p-3 w-full transition-colors ${
                processingState.raiseDispute
                  ? "bg-red-600/50 cursor-not-allowed opacity-50"
                  : "bg-Red hover:bg-red-600"
              } text-white`}
              disabled={processingState.raiseDispute || !disputeReason.trim()}
            />
          </motion.div>
        </form>
      </Modal>
    ),
    [
      isDisputeModalOpen,
      processingState.raiseDispute,
      disputeReason,
      handleDisputeSubmit,
    ]
  );

  return (
    <>
      <BaseStatus
        statusTitle="Confirm Delivery"
        statusDescription="Dezenmart has confirmed payment for this order."
        statusAlert={
          <StatusAlert
            icon={<BsShieldExclamation size={18} />}
            message={`To ensure the safety of your purchase, please verify the real name of the payer: ${sellerName}`}
            type="warning"
          />
        }
        tradeDetails={tradeDetails}
        orderDetails={orderDetails}
        transactionInfo={transactionInfo}
        contactLabel="Contact Seller"
        onContact={onContactSeller}
        showTimer={showTimer}
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
