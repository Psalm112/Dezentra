import { FC, useState } from "react";
import {
  FaSpinner,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
} from "react-icons/fa";
import { motion } from "framer-motion";
import { useContract } from "../../utils/hooks/useContract";

interface ConfirmDeliveryProps {
  tradeId: string;
  onComplete: () => void;
}

const ConfirmDelivery: FC<ConfirmDeliveryProps> = ({ tradeId, onComplete }) => {
  const { confirmDelivery, deliveryConfirmLoading } = useContract();
  const [status, setStatus] = useState<
    "pending" | "confirming" | "success" | "error"
  >("pending");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleConfirm = async () => {
    setStatus("confirming");
    try {
      const result = await confirmDelivery(tradeId);
      if (result.success) {
        setStatus("success");
        setTimeout(() => {
          onComplete();
        }, 2000);
      } else {
        setStatus("error");
        setErrorMessage(result.message || "Failed to confirm delivery");
      }
    } catch (error: any) {
      console.error("Delivery confirmation error:", error);
      setStatus("error");
      setErrorMessage(error.message || "An unexpected error occurred");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-md mx-auto bg-[#212428] p-6 md:p-8 rounded-lg shadow-lg"
    >
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4">
          {(status === "pending" || status === "confirming") && (
            <FaExclamationTriangle
              className={`text-4xl text-yellow-500 ${
                status === "confirming" ? "animate-pulse" : ""
              }`}
            />
          )}
          {status === "success" && (
            <FaCheckCircle className="text-4xl text-green-500" />
          )}
          {status === "error" && (
            <FaTimesCircle className="text-4xl text-red-500" />
          )}
        </div>
        <h2 className="text-xl font-semibold mb-2">
          {status === "pending" && "Confirm Delivery"}
          {status === "confirming" && "Confirming Delivery"}
          {status === "success" && "Delivery Confirmed"}
          {status === "error" && "Confirmation Failed"}
        </h2>
        <p className="text-gray-400 text-sm">
          {status === "pending" &&
            "Confirm that you've received your order to release funds to the seller."}
          {status === "confirming" && "Processing your confirmation..."}
          {status === "success" && "Funds have been released to the seller."}
          {status === "error" && errorMessage}
        </p>
      </div>

      <div className="bg-[#2A2D35] p-4 rounded-lg mb-4">
        <p className="text-gray-400 text-sm">Trade ID</p>
        <p className="text-white font-mono text-sm break-all">{tradeId}</p>
      </div>

      {status === "pending" && (
        <div className="space-y-3">
          <button
            onClick={handleConfirm}
            disabled={deliveryConfirmLoading}
            className="w-full py-3 bg-Red hover:bg-[#e02d37] text-white rounded transition-colors flex items-center justify-center"
          >
            {deliveryConfirmLoading ? (
              <FaSpinner className="animate-spin mr-2" />
            ) : null}
            Confirm Delivery
          </button>
          <p className="text-xs text-gray-500 text-center">
            This action cannot be undone. Only confirm if you've received your
            order.
          </p>
        </div>
      )}

      {status === "error" && (
        <button
          onClick={() => setStatus("pending")}
          className="w-full py-3 bg-Red hover:bg-[#e02d37] text-white rounded transition-colors mt-4"
        >
          Try Again
        </button>
      )}
    </motion.div>
  );
};

export default ConfirmDelivery;
