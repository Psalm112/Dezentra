import { FC, useState } from "react";
import {
  FaSpinner,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
} from "react-icons/fa";
import { motion } from "framer-motion";
import { useOrderData } from "../../utils/hooks/useOrder";

interface RaiseDisputeProps {
  tradeId: string;
  onComplete: (success: boolean) => void;
}

const RaiseDispute: FC<RaiseDisputeProps> = ({ tradeId, onComplete }) => {
  const { raiseDispute } = useOrderData();
  const [status, setStatus] = useState<
    "pending" | "processing" | "success" | "error"
  >("pending");
  const [reason, setReason] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRaiseDispute = async () => {
    if (!reason.trim()) {
      setErrorMessage("Please provide a reason for the dispute");
      return;
    }

    setIsSubmitting(true);
    setStatus("processing");

    try {
      const result = await raiseDispute(tradeId, reason);
      if (result) {
        setStatus("success");
        setTimeout(() => {
          onComplete(true);
        }, 2000);
      } else {
        setStatus("error");
        setErrorMessage("Failed to raise dispute");
        onComplete(false);
      }
    } catch (error: any) {
      console.error("Dispute creation error:", error);
      setStatus("error");
      setErrorMessage(error.message || "An unexpected error occurred");
      onComplete(false);
    } finally {
      setIsSubmitting(false);
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
          {(status === "pending" || status === "processing") && (
            <FaExclamationTriangle
              className={`text-4xl text-yellow-500 ${
                status === "processing" ? "animate-pulse" : ""
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
          {status === "pending" && "Raise a Dispute"}
          {status === "processing" && "Processing Dispute"}
          {status === "success" && "Dispute Raised"}
          {status === "error" && "Failed to Raise Dispute"}
        </h2>
        <p className="text-gray-400 text-sm">
          {status === "pending" &&
            "If you have an issue with your order, you can raise a dispute."}
          {status === "processing" && "Creating your dispute..."}
          {status === "success" &&
            "Your dispute has been submitted for review."}
          {status === "error" && errorMessage}
        </p>
      </div>

      <div className="bg-[#2A2D35] p-4 rounded-lg mb-4">
        <p className="text-gray-400 text-sm">Trade ID</p>
        <p className="text-white font-mono text-sm break-all">{tradeId}</p>
      </div>

      {status === "pending" && (
        <>
          <div className="mb-4">
            <label
              htmlFor="reason"
              className="block text-gray-400 text-sm mb-2"
            >
              Reason for Dispute
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-[#2A2D35] border border-[#3A3D45] rounded p-3 text-white focus:outline-none focus:border-Red focus:ring-1 focus:ring-Red h-28"
              placeholder="Describe the issue with your order..."
            ></textarea>
            {errorMessage && (
              <p className="text-red-500 text-xs mt-1">{errorMessage}</p>
            )}
          </div>

          <div className="space-y-3">
            <button
              onClick={handleRaiseDispute}
              disabled={isSubmitting}
              className="w-full py-3 bg-Red hover:bg-[#e02d37] text-white rounded transition-colors flex items-center justify-center"
            >
              {isSubmitting ? (
                <FaSpinner className="animate-spin mr-2" />
              ) : null}
              Raise Dispute
            </button>
            <p className="text-xs text-gray-500 text-center">
              An admin will review your case and make a decision. This may take
              some time.
            </p>
          </div>
        </>
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

export default RaiseDispute;
