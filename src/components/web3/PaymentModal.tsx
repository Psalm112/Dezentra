import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiCreditCard,
  HiShieldCheck,
  HiExclamationTriangle,
  HiCheckCircle,
  HiXCircle,
  HiCurrencyDollar,
} from "react-icons/hi2";
import Modal from "../common/Modal";
import Button from "../common/Button";
import { useWeb3 } from "../../context/Web3Context";
import { PaymentTransaction } from "../../utils/types/web3.types";
import { formatCurrency } from "../../utils/web3.utils";
import { useSnackbar } from "../../context/SnackbarContext";
import { Order } from "../../utils/types";
import { parseWeb3Error } from "../../utils/errorParser";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderDetails: Order;
  onPaymentSuccess: (transaction: PaymentTransaction) => void;
}

type PaymentStep = "review" | "processing" | "success" | "error";

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  orderDetails,
  onPaymentSuccess,
}) => {
  const { showSnackbar } = useSnackbar();
  const {
    wallet,
    buyTrade,
    approveUSDT,
    getUSDTBalance,
    isCorrectNetwork,
    switchToCorrectNetwork,
    getCurrentAllowance,
    connectWallet,
    validateTradeBeforePurchase,
  } = useWeb3();

  const [step, setStep] = useState<PaymentStep>("review");
  const [needsApproval, setNeedsApproval] = useState(false);
  const [approvalHash, setApprovalHash] = useState<string>("");
  const [transaction, setTransaction] = useState<PaymentTransaction | null>(
    null
  );
  const [usdtBalance, setUsdtBalance] = useState<string>("0");
  const [error, setError] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  const orderAmount = useMemo(() => {
    return (
      orderDetails?.amount ||
      (orderDetails?.product?.price || 0) * (orderDetails?.quantity || 1)
    );
  }, [orderDetails]);

  const balanceNumber = useMemo(() => {
    if (!wallet.usdtBalance?.raw) return 0;
    return parseFloat(wallet.usdtBalance.raw);
  }, [wallet.usdtBalance?.raw]);

  const gasBalance = useMemo(
    () => parseFloat(wallet.balance || "0"),
    [wallet.balance]
  );

  const hasInsufficientBalance = useMemo(
    () => balanceNumber < orderAmount,
    [balanceNumber, orderAmount]
  );

  const hasInsufficientGas = useMemo(() => gasBalance < 0.01, [gasBalance]);

  const loadBalance = useCallback(async () => {
    if (!wallet.isConnected) return;

    setIsLoadingBalance(true);
    try {
      const balance = await getUSDTBalance();
      setUsdtBalance(balance);
    } catch (error) {
      console.error("Failed to load balance:", error);
      setUsdtBalance("0");
      showSnackbar("Failed to load balance", "error");
    } finally {
      setIsLoadingBalance(false);
    }
  }, [wallet.isConnected, getUSDTBalance, showSnackbar]);

  // Check approval requirements
  const checkApprovalNeeds = useCallback(async () => {
    if (!wallet.isConnected || !isCorrectNetwork) return;

    try {
      const allowance = await getCurrentAllowance();
      setNeedsApproval(allowance < orderAmount);
    } catch (error) {
      console.error("Failed to check allowance:", error);
      setNeedsApproval(true);
    }
  }, [wallet.isConnected, isCorrectNetwork, getCurrentAllowance, orderAmount]);

  // Initialize modal state
  useEffect(() => {
    if (isOpen && wallet.isConnected) {
      loadBalance();
      checkApprovalNeeds();
    }
  }, [isOpen, wallet.isConnected, loadBalance, checkApprovalNeeds]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep("review");
      setError("");
      setTransaction(null);
      setApprovalHash("");
      setRetryCount(0);
      setIsProcessing(false);
    }
  }, [isOpen]);

  const handlePayment = useCallback(async () => {
    if (!wallet.isConnected) {
      try {
        await connectWallet();
        return;
      } catch (error) {
        showSnackbar("Failed to connect wallet", "error");
        return;
      }
    }

    if (!isCorrectNetwork) {
      try {
        setIsProcessing(true);
        await switchToCorrectNetwork();
        await new Promise((resolve) => setTimeout(resolve, 3000));
        setIsProcessing(false);
      } catch (error) {
        setError(
          "Failed to switch network. Please switch manually in your wallet."
        );
        setStep("error");
        setIsProcessing(false);
        return;
      }
    }

    if (hasInsufficientBalance) {
      setError(
        `Insufficient USDT balance. Required: ${formatCurrency(
          orderAmount
        )} USDT`
      );
      setStep("error");
      return;
    }

    if (hasInsufficientGas) {
      setError(
        "Insufficient CELO for transaction fees. Please add some CELO to your wallet."
      );
      setStep("error");
      return;
    }

    try {
      setIsProcessing(true);
      setStep("processing");
      setError("");

      const isValidTrade = await validateTradeBeforePurchase?.(
        orderDetails.product.tradeId,
        orderDetails.quantity.toString(),
        orderDetails.logisticsProviderWalletAddress[0]
      );

      if (!isValidTrade) {
        throw new Error(
          "This product is no longer available. Please refresh and try another item."
        );
      }

      if (needsApproval) {
        showSnackbar("Requesting USDT spending approval...", "info");

        try {
          const approvalTx = await approveUSDT(orderAmount.toString());

          if (approvalTx !== "0x0") {
            setApprovalHash(approvalTx);
            showSnackbar(
              "USDT approval submitted. Waiting for confirmation...",
              "info"
            );

            let confirmed = false;
            let attempts = 0;
            const maxAttempts = 20; // 40 seconds total

            while (!confirmed && attempts < maxAttempts) {
              await new Promise((resolve) => setTimeout(resolve, 2000));

              try {
                const newAllowance = await getCurrentAllowance();
                if (newAllowance >= orderAmount) {
                  confirmed = true;
                  break;
                }
              } catch (checkError) {
                console.warn("Allowance check failed:", checkError);
              }

              attempts++;
            }

            if (!confirmed) {
              throw new Error(
                "Approval confirmation timeout. Please try again."
              );
            }
          }

          showSnackbar("USDT spending approved!", "success");
          if (onPaymentSuccess && transaction) {
            onPaymentSuccess(transaction);
          }
        } catch (approvalError) {
          console.error("Approval failed:", approvalError);
          throw new Error(`Approval failed: ${parseWeb3Error(approvalError)}`);
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
      let retryAttempts = 0;
      const maxRetries = 3;

      while (retryAttempts < maxRetries) {
        try {
          showSnackbar("Processing purchase transaction...", "info");

          const paymentTransaction = await buyTrade({
            tradeId: orderDetails.product.tradeId,
            quantity: orderDetails.quantity.toString(),
            logisticsProvider: orderDetails.logisticsProviderWalletAddress[0],
          });

          setTransaction(paymentTransaction);
          setStep("success");
          onPaymentSuccess(paymentTransaction);
          showSnackbar("Purchase completed successfully!", "success");

          setTimeout(() => loadBalance(), 3000);
          break;
        } catch (txError: any) {
          retryAttempts++;
          const errorMsg = txError.message || "Transaction failed";

          if (retryAttempts >= maxRetries) {
            throw txError;
          }

          if (
            errorMsg.includes("Network error") ||
            errorMsg.includes("JSON-RPC")
          ) {
            showSnackbar(
              `Retry attempt ${retryAttempts}/${maxRetries}...`,
              "info"
            );
            await new Promise((resolve) =>
              setTimeout(resolve, 2000 * retryAttempts)
            );
            continue;
          } else {
            throw txError;
          }
        }
      }
    } catch (error: unknown) {
      console.error("Payment failed:", error);
      const errorMessage = parseWeb3Error(error);
      let errorDetail = errorMessage;
      if (
        errorMessage.includes("TradeNotFound") ||
        errorMessage.includes("no longer available")
      ) {
        errorDetail =
          "This product is no longer available. Please try a different item.";
      } else if (errorMessage.includes("InsufficientQuantity")) {
        errorDetail =
          "Not enough stock available. Please reduce quantity or try later.";
      }

      setError(errorDetail);
      setStep("error");
      showSnackbar(errorDetail, "error");
    } finally {
      setIsProcessing(false);
    }
  }, [
    wallet.isConnected,
    isCorrectNetwork,
    hasInsufficientBalance,
    hasInsufficientGas,
    needsApproval,
    orderDetails,
    orderAmount,
    connectWallet,
    switchToCorrectNetwork,
    approveUSDT,
    buyTrade,
    getCurrentAllowance,
    onPaymentSuccess,
    showSnackbar,
    loadBalance,
  ]);

  const handleRetry = useCallback(() => {
    setRetryCount((prev) => prev + 1);
    setStep("review");
    setError("");
    setIsProcessing(false);
    setApprovalHash("");

    // Refresh all necessary data
    loadBalance();
    checkApprovalNeeds();
  }, [loadBalance, checkApprovalNeeds]);

  const handleModalClose = useCallback(() => {
    if (step === "processing" && isProcessing) {
      showSnackbar(
        "Transaction in progress. Please wait for completion before closing.",
        "info"
      );
      return;
    }
    onClose();
  }, [step, isProcessing, onClose, showSnackbar]);

  const displayBalance = useMemo(() => {
    return wallet.usdtBalance?.usdt || `${usdtBalance} USDT`;
  }, [wallet.usdtBalance?.usdt, usdtBalance]);

  const renderStepContent = () => {
    switch (step) {
      case "review":
        return (
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">
                Order Summary
              </h3>
              <div className="bg-Dark/50 border border-Red/20 rounded-lg p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">
                    {orderDetails.product?.name} × {orderDetails.quantity}
                  </span>
                  <span className="text-white font-medium">
                    {formatCurrency(orderAmount)} USDT
                  </span>
                </div>
                <div className="border-t border-Red/20 pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-white">Total</span>
                    <span className="text-Red">
                      {formatCurrency(orderAmount)} USDT
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method & Balance */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white">
                Payment Method
              </h3>
              <div className="bg-Dark/50 border border-Red/20 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-Red/20 rounded-full flex items-center justify-center">
                      <HiCurrencyDollar className="w-5 h-5 text-Red" />
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        USDT (Celo Network)
                      </p>
                      <p className="text-sm text-gray-400">
                        {!wallet.isConnected
                          ? "Connect wallet to continue"
                          : needsApproval
                          ? "Approval required"
                          : "Ready to pay"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-medium">
                      {isLoadingBalance ? "Loading..." : displayBalance}
                    </p>
                    <p className="text-xs text-gray-400">Available</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Security Notice */}
            <div className="bg-Red/10 border border-Red/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <HiShieldCheck className="w-5 h-5 text-Red flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-Red font-medium">Secure Escrow Payment</p>
                  <p className="text-sm text-Red/80 mt-1">
                    Your payment is held securely until you confirm delivery of
                    your order.
                  </p>
                </div>
              </div>
            </div>

            {needsApproval && (
              <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <HiExclamationTriangle className="w-4 h-4 text-yellow-400" />
                  <span className="text-yellow-400 text-sm">
                    USDT spending approval required for this transaction
                  </span>
                </div>
              </div>
            )}

            {/* Warnings */}
            {(!wallet.isConnected ||
              hasInsufficientBalance ||
              hasInsufficientGas ||
              !isCorrectNetwork) && (
              <div className="space-y-2">
                {!wallet.isConnected && (
                  <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <HiExclamationTriangle className="w-4 h-4 text-blue-400" />
                      <span className="text-blue-400 text-sm">
                        Please connect your wallet to continue
                      </span>
                    </div>
                  </div>
                )}

                {wallet.isConnected && hasInsufficientBalance && (
                  <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <HiExclamationTriangle className="w-4 h-4 text-red-400" />
                      <span className="text-red-400 text-sm">
                        Insufficient USDT balance. Need{" "}
                        {formatCurrency(orderAmount)} USDT
                      </span>
                    </div>
                  </div>
                )}

                {wallet.isConnected && hasInsufficientGas && (
                  <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <HiExclamationTriangle className="w-4 h-4 text-yellow-400" />
                      <span className="text-yellow-400 text-sm">
                        Low CELO balance for transaction fees
                      </span>
                    </div>
                  </div>
                )}

                {wallet.isConnected && !isCorrectNetwork && (
                  <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <HiExclamationTriangle className="w-4 h-4 text-yellow-400" />
                      <span className="text-yellow-400 text-sm">
                        Please switch to Celo network
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Retry indicator */}
            {retryCount > 0 && (
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <span className="text-blue-400 text-sm">
                    Retry attempt #{retryCount}
                  </span>
                </div>
              </div>
            )}

            {/* Payment Button */}
            <Button
              title={
                !wallet.isConnected
                  ? "Connect Wallet"
                  : `Pay ${formatCurrency(orderAmount)} USDT`
              }
              onClick={handlePayment}
              disabled={
                isProcessing ||
                isLoadingBalance ||
                (wallet.isConnected &&
                  (hasInsufficientBalance || hasInsufficientGas))
              }
              className="flex items-center justify-center w-full bg-Red hover:bg-Red/80 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-lg py-4 font-semibold transition-all duration-200"
            />
          </div>
        );

      case "processing":
        return (
          <div className="text-center space-y-6 py-12">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-Red/30 border-t-Red rounded-full animate-spin mx-auto" />
              <div className="absolute inset-0 w-12 h-12 border-2 border-Red/20 border-t-transparent rounded-full animate-spin mx-auto mt-2" />
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-bold text-white">
                Processing Payment
              </h3>
              <p className="text-gray-300 max-w-sm mx-auto">
                {needsApproval && !approvalHash
                  ? "Requesting USDT spending permission..."
                  : "Completing your purchase transaction..."}
              </p>
              <p className="text-sm text-gray-400">
                Please confirm the transaction in your wallet
              </p>
              <div className="flex items-center justify-center gap-1 text-sm text-Red">
                <div className="w-2 h-2 bg-Red rounded-full animate-pulse" />
                <div className="w-2 h-2 bg-Red rounded-full animate-pulse delay-100" />
                <div className="w-2 h-2 bg-Red rounded-full animate-pulse delay-200" />
              </div>
            </div>
          </div>
        );

      case "success":
        return (
          <div className="text-center space-y-6 py-8">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", duration: 0.6, delay: 0.1 }}
            >
              <div className="w-16 h-16 bg-Red/20 rounded-full flex items-center justify-center mx-auto">
                <HiCheckCircle className="w-10 h-10 text-Red" />
              </div>
            </motion.div>
            <div className="space-y-3">
              <h3 className="text-xl font-bold text-white">
                Payment Successful!
              </h3>
              <p className="text-gray-300 max-w-md mx-auto">
                Your payment has been sent to escrow. You'll receive your order
                soon.
              </p>
              {transaction && (
                <div className="bg-Dark/50 border border-Red/20 rounded-lg p-4 mt-4">
                  <p className="text-sm text-gray-400 mb-1">
                    Transaction Hash:
                  </p>
                  <p className="font-mono text-xs text-Red break-all">
                    {transaction.hash}
                  </p>
                </div>
              )}
            </div>
            <Button
              title="Continue Shopping"
              onClick={onClose}
              className="w-full bg-Red hover:bg-Red/80 text-white"
            />
          </div>
        );

      case "error":
        return (
          <div className="text-center space-y-6 py-8">
            <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mx-auto">
              <HiXCircle className="w-10 h-10 text-red-400" />
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-bold text-white">Payment Failed</h3>
              <p className="text-gray-300 max-w-md mx-auto">{error}</p>
            </div>
            <div className="space-y-3">
              <Button
                title="Try Again"
                onClick={handleRetry}
                className="w-full bg-Red hover:bg-Red/80 text-white"
              />
              <Button
                title="Close"
                onClick={onClose}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      title={step === "review" ? "Complete Payment" : ""}
      maxWidth="md:max-w-lg"
      showCloseButton={step !== "processing"}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {renderStepContent()}
        </motion.div>
      </AnimatePresence>
    </Modal>
  );
};

export default PaymentModal;
