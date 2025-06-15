import { FC, useState, useEffect } from "react";
import { FaSpinner, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { motion } from "framer-motion";
import { useWeb3 } from "../../context/Web3Context";
import { useWalletBalance } from "../../utils/hooks/useWalletBalance";
import { useCurrencyConverter } from "../../utils/hooks/useCurrencyConverter";
import { PaymentTransaction } from "../../utils/types/web3.types";

interface TransactionConfirmationProps {
  contractAddress: string;
  amount: string;
  isUSDT?: boolean;
  usdtAddress?: string;
  tradeId?: string;
  quantity?: number;
  logisticsProviderAddress?: string;
  onComplete: (success: boolean, transaction?: PaymentTransaction) => void;
}

const TransactionConfirmation: FC<TransactionConfirmationProps> = ({
  contractAddress,
  amount,
  isUSDT = true,
  tradeId,
  quantity = 1,
  logisticsProviderAddress,
  onComplete,
}) => {
  const { wallet, sendPayment, isCorrectNetwork, switchToCorrectNetwork } =
    useWeb3();
  const { usdtBalance, celoBalance } = useWalletBalance();
  const { formatPrice } = useCurrencyConverter();

  const [status, setStatus] = useState<"pending" | "success" | "error">(
    "pending"
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleTransaction = async () => {
      if (!wallet.isConnected) {
        setStatus("error");
        setErrorMessage("Wallet not connected");
        onComplete(false);
        return;
      }

      setIsProcessing(true);

      try {
        // Check network
        if (!isCorrectNetwork) {
          await switchToCorrectNetwork();
        }

        // Validate balances
        const userUSDTBalance = parseFloat(usdtBalance || "0");
        const requiredAmount = parseFloat(amount);
        const requiredWithBuffer = requiredAmount * 1.02; // 2% buffer

        if (userUSDTBalance < requiredWithBuffer) {
          setStatus("error");
          setErrorMessage(
            `Insufficient USDT balance. You need ${formatPrice(
              requiredAmount,
              "USDT"
            )} but only have ${formatPrice(userUSDTBalance, "USDT")} available.`
          );
          onComplete(false);
          return;
        }

        const userCELOBalance = parseFloat(celoBalance || "0");
        if (userCELOBalance < 0.001) {
          console.warn("Low CELO balance for gas fees");
        }

        // Send payment to escrow
        const paymentResult = await sendPayment({
          to: contractAddress,
          amount: amount,
          orderId: tradeId || `order_${Date.now()}`,
        });

        if (paymentResult) {
          setTransactionHash(paymentResult.hash);
          setStatus("success");
          onComplete(true, paymentResult);
        } else {
          throw new Error("Payment transaction failed");
        }
      } catch (error: any) {
        console.error("Transaction error:", error);
        setStatus("error");
        setErrorMessage(
          error.message || "Transaction failed. Please try again."
        );
        onComplete(false);
      } finally {
        setIsProcessing(false);
      }
    };

    handleTransaction();
  }, [
    wallet.isConnected,
    contractAddress,
    amount,
    tradeId,
    isCorrectNetwork,
    usdtBalance,
    celoBalance,
  ]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-md mx-auto bg-[#212428] p-6 md:p-8 rounded-lg shadow-lg"
    >
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4">
          {status === "pending" && (
            <FaSpinner className="text-4xl text-yellow-500 animate-spin" />
          )}
          {status === "success" && (
            <FaCheckCircle className="text-4xl text-green-500" />
          )}
          {status === "error" && (
            <FaTimesCircle className="text-4xl text-red-500" />
          )}
        </div>
        <h2 className="text-xl font-semibold mb-2 text-white">
          {status === "pending" && "Confirming Transaction"}
          {status === "success" && "Payment Successful"}
          {status === "error" && "Transaction Failed"}
        </h2>
        <p className="text-gray-400 text-sm">
          {status === "pending" && `Sending ${amount} USDT to escrow...`}
          {status === "success" &&
            `Successfully sent ${amount} USDT to escrow. Your payment is secure.`}
          {status === "error" &&
            (errorMessage || "There was an error processing your transaction.")}
        </p>
      </div>

      <div className="bg-[#2A2D35] p-4 rounded-lg mb-4">
        <p className="text-gray-400 text-sm">Escrow Address</p>
        <p className="text-white font-mono text-sm break-all">
          {contractAddress}
        </p>
      </div>

      <div className="bg-[#2A2D35] p-4 rounded-lg mb-4">
        <p className="text-gray-400 text-sm">Amount</p>
        <p className="text-white">{amount} USDT</p>
      </div>

      {transactionHash && (
        <div className="bg-[#2A2D35] p-4 rounded-lg mb-4">
          <p className="text-gray-400 text-sm">Transaction Hash</p>
          <p className="text-white font-mono text-sm break-all">
            {transactionHash}
          </p>
        </div>
      )}

      {status === "error" && (
        <button
          onClick={() => window.location.reload()}
          className="w-full py-3 bg-Red hover:bg-[#e02d37] text-white rounded transition-colors mt-4"
        >
          Try Again
        </button>
      )}
    </motion.div>
  );
};

export default TransactionConfirmation;
