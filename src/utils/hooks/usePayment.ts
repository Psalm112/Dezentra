import { useState, useCallback } from "react";
import { useWeb3 } from "../../context/Web3Context";
import { PaymentTransaction } from "../types/web3.types";
import { useSnackbar } from "../../context/SnackbarContext";
import { ESCROW_ADDRESSES } from "../config/web3.config";
interface UsePaymentReturn {
  initiatePayment: (params: {
    amount: string;
    orderId: string;
    escrowAddress: string;
  }) => Promise<PaymentTransaction | null>;
  isProcessing: boolean;
  error: string | null;
  clearError: () => void;
}

export const usePayment = (): UsePaymentReturn => {
  const { showSnackbar } = useSnackbar();
  const { sendPayment, wallet, isCorrectNetwork, switchToCorrectNetwork } =
    useWeb3();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initiatePayment = useCallback(
    async (params: {
      amount: string;
      orderId: string;
      //   escrowAddress: string;
    }) => {
      if (!wallet.isConnected) {
        throw new Error("Wallet not connected");
      }

      setIsProcessing(true);
      setError(null);

      try {
        // Ensure correct network
        if (!isCorrectNetwork) {
          await switchToCorrectNetwork();
        }

        const transaction = await sendPayment({
          to: ESCROW_ADDRESSES[44787],
          amount: params.amount,
          orderId: params.orderId,
        });

        showSnackbar("Payment initiated successfully!", "success");
        return transaction;
      } catch (err: any) {
        const errorMessage = err.message || "Payment failed";
        setError(errorMessage);
        showSnackbar(errorMessage, "error");
        return null;
      } finally {
        setIsProcessing(false);
      }
    },
    [wallet.isConnected, isCorrectNetwork, sendPayment, switchToCorrectNetwork]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    initiatePayment,
    isProcessing,
    error,
    clearError,
  };
};
