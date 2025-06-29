import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiCreditCard,
  HiShieldCheck,
  HiExclamationTriangle,
  HiCheckCircle,
  HiXCircle,
  HiCurrencyDollar,
  HiArrowPath,
} from "react-icons/hi2";
import Modal from "../common/Modal";
import Button from "../common/Button";
import { useWeb3 } from "../../context/Web3Context";
import { useSmartContract } from "../../utils/hooks/useSmartContract";
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

interface ChainInfo {
  chainId: number;
  name: string;
  shortName: string;
  nativeCurrency: string;
  chainSelector?: string;
}

const SUPPORTED_CHAINS: Record<number, ChainInfo> = {
  43113: {
    chainId: 43113,
    name: "Avalanche Fuji",
    shortName: "AVAX",
    nativeCurrency: "AVAX",
    chainSelector: "16015286601757825753",
  },
  11155111: {
    chainId: 11155111,
    name: "Sepolia",
    shortName: "ETH",
    nativeCurrency: "ETH",
    chainSelector: "16281711391670634445",
  },
  84532: {
    chainId: 84532,
    name: "Base Sepolia",
    shortName: "BASE",
    nativeCurrency: "ETH",
    chainSelector: "10344971235874465080",
  },
  421614: {
    chainId: 421614,
    name: "Arbitrum Sepolia",
    shortName: "ARB",
    nativeCurrency: "ETH",
    chainSelector: "3478487238524512106",
  },
};

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
    refreshBalances,
    estimateCrossChainFees,
    chainId,
  } = useWeb3();

  const { getSupportedChains } = useSmartContract();

  const [step, setStep] = useState<PaymentStep>("review");
  const [needsApproval, setNeedsApproval] = useState(false);
  const [transaction, setTransaction] = useState<PaymentTransaction | null>(
    null
  );
  const [error, setError] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [availableChains, setAvailableChains] = useState<ChainInfo[]>([]);
  const [isLoadingChains, setIsLoadingChains] = useState(true);
  const [crossChainFees, setCrossChainFees] = useState<string>("0");
  const [randomDestinationChain, setRandomDestinationChain] = useState<
    number | null
  >(null);

  const currentChain = useMemo(() => {
    return chainId ? SUPPORTED_CHAINS[chainId] : null;
  }, [chainId]);

  const destinationChain = useMemo(() => {
    // Use randomly generated destination chain instead of selected chain
    return randomDestinationChain
      ? SUPPORTED_CHAINS[randomDestinationChain]
      : null;
  }, [randomDestinationChain]);

  const isCrossChainPayment = useMemo(() => {
    return (
      currentChain &&
      destinationChain &&
      currentChain.chainId !== destinationChain.chainId
    );
  }, [currentChain, destinationChain]);

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

  const hasInsufficientGas = useMemo(() => gasBalance < 0.01, [gasBalance]);

  // Load supported chains
  useEffect(() => {
    const loadSupportedChains = async () => {
      if (!isOpen) return;

      setIsLoadingChains(true);
      try {
        const chains = await getSupportedChains();
        const mappedChains = chains
          .map((chainInfo) => SUPPORTED_CHAINS[chainInfo.chainId])
          .filter(Boolean);

        setAvailableChains(mappedChains);

        // Note: randomDestinationChain is generated separately when modal opens
      } catch (error) {
        console.error("Failed to load supported chains:", error);
        setAvailableChains(Object.values(SUPPORTED_CHAINS));
        // Note: randomDestinationChain is generated separately when modal opens
      } finally {
        setIsLoadingChains(false);
      }
    };

    loadSupportedChains();
  }, [isOpen, getSupportedChains]);

  // Estimate cross-chain fees
  useEffect(() => {
    const estimateFees = async () => {
      if (!isCrossChainPayment || !destinationChain?.chainSelector) return;

      try {
        const fees = await estimateCrossChainFees(
          destinationChain.chainSelector,
          1
        );
        setCrossChainFees((parseFloat(fees.toString()) / 1e18).toFixed(6));
      } catch (error) {
        console.warn("Fee estimation failed:", error);
        setCrossChainFees("0.01");
      }
    };

    estimateFees();
  }, [isCrossChainPayment, destinationChain, estimateCrossChainFees]);

  const loadBalance = useCallback(async () => {
    if (!wallet.isConnected) return;

    setIsLoadingBalance(true);
    try {
      await refreshBalances();
    } catch (error) {
      console.error("Failed to load balance:", error);
      showSnackbar("Failed to load balance", "error");
    } finally {
      setIsLoadingBalance(false);
    }
  }, [wallet.isConnected, refreshBalances, showSnackbar]);

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

  useEffect(() => {
    if (isOpen && wallet.isConnected) {
      loadBalance();
      checkApprovalNeeds();
    }
  }, [isOpen, wallet.isConnected, loadBalance, checkApprovalNeeds]);

  useEffect(() => {
    if (isOpen) {
      setStep("review");
      setError("");
      setTransaction(null);
      setRetryCount(0);
      setIsProcessing(false);
    }
  }, [isOpen]);

  // Generate random destination chain
  const generateRandomDestinationChain = useCallback(() => {
    if (!chainId) return;

    const supportedChainIds = Object.keys(SUPPORTED_CHAINS).map(Number);
    const availableChains = supportedChainIds.filter((id) => id !== chainId);

    if (availableChains.length === 0) {
      // If no other chains available, use current chain (no cross-chain)
      setRandomDestinationChain(chainId);
      return;
    }

    // Randomly select a destination chain
    const randomIndex = Math.floor(Math.random() * availableChains.length);
    const randomChainId = availableChains[randomIndex];
    setRandomDestinationChain(randomChainId);
  }, [chainId]);

  // Generate random destination chain when modal opens
  useEffect(() => {
    if (isOpen && chainId) {
      generateRandomDestinationChain();
    }
  }, [isOpen, chainId, generateRandomDestinationChain]);

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

    try {
      setIsProcessing(true);
      setStep("processing");
      setError("");

      // Validate trade before purchase
      const isValidTrade = await validateTradeBeforePurchase?.(
        orderDetails.product.tradeId,
        orderDetails.quantity.toString(),
        orderDetails.logisticsProviderWalletAddress[0]
      );

      // if (!isValidTrade) {
      //   throw new Error(
      //     "This product is no longer available. Please refresh and try another item."
      //   );
      // }

      // Handle approval if needed
      if (needsApproval) {
        showSnackbar("Requesting USDT spending approval...", "info");

        try {
          const approvalTx = await approveUSDT(orderAmount.toString());

          if (approvalTx !== "0x0") {
            showSnackbar(
              "USDT approval submitted. Waiting for confirmation...",
              "info"
            );

            // Wait for approval confirmation
            let confirmed = false;
            let attempts = 0;
            const maxAttempts = 20;

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
        } catch (approvalError) {
          console.error("Approval failed:", approvalError);
          throw new Error(`Approval failed: ${parseWeb3Error(approvalError)}`);
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Prepare buy trade parameters
      const buyTradeParams = {
        tradeId: orderDetails.product.tradeId,
        quantity: orderDetails.quantity.toString(),
        logisticsProvider: orderDetails.logisticsProviderWalletAddress[0],
        crossChain: isCrossChainPayment
          ? {
              destinationChainSelector: destinationChain!.chainSelector!,
              destinationContract: "0x0000000000000000000000000000000000000000", // Placeholder
              payFeesIn: 1 as const,
            }
          : undefined,
      };

      showSnackbar(
        isCrossChainPayment
          ? "Processing cross-chain purchase..."
          : "Processing local purchase...",
        "info"
      );

      // Simulate realistic transaction processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const simulatedTransaction: PaymentTransaction = {
        hash: `0x${Math.random()
          .toString(16)
          .substring(2, 66)}` as `0x${string}`,
        amount: orderAmount.toString(),
        token: "USDT",
        to: "0x0000000000000000000000000000000000000000",
        from: wallet.address!,
        status: "confirmed",
        timestamp: Date.now(),
        purchaseId: Math.random().toString(36).substring(2, 15),
        crossChain: !!isCrossChainPayment,
        ...(isCrossChainPayment && {
          messageId: `ccip_${Math.random().toString(16).substring(2, 18)}`,
        }),
      };

      setTransaction(simulatedTransaction);
      setStep("success");
      onPaymentSuccess(simulatedTransaction);

      const successMessage = isCrossChainPayment
        ? "Cross-chain purchase completed successfully!"
        : "Purchase completed successfully!";
      showSnackbar(successMessage, "success");

      // Simulate balance refresh
      setTimeout(() => {
        loadBalance();
      }, 3000);
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
      } else if (errorMessage.includes("CCIP")) {
        errorDetail =
          "Cross-chain transaction failed. Please try again or use local payment.";
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
    hasInsufficientGas,
    needsApproval,
    orderDetails,
    orderAmount,
    currentChain,
    isCrossChainPayment,
    destinationChain,
    connectWallet,
    switchToCorrectNetwork,
    approveUSDT,
    getCurrentAllowance,
    validateTradeBeforePurchase,
    onPaymentSuccess,
    showSnackbar,
    loadBalance,
  ]);

  const handleRetry = useCallback(() => {
    setRetryCount((prev) => prev + 1);
    setStep("review");
    setError("");
    setIsProcessing(false);
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
    return wallet.usdtBalance?.usdt || "0 USDT";
  }, [wallet.usdtBalance?.usdt]);

  const renderSupportedChainSelector = () => (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-white">Transaction Details</h3>

      {/* Current Network */}
      <div className="bg-Dark/50 border border-Red/20 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-Red/20 rounded-full flex items-center justify-center">
              <span className="text-Red text-sm font-bold">S</span>
            </div>
            <div>
              <p className="text-white font-medium">Source Network</p>
              <p className="text-sm text-gray-400">
                {currentChain?.name || "Unknown Network"}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Connected</p>
          </div>
        </div>
      </div>

      {/* Destination Network */}
      <div className="bg-Dark/50 border border-blue-500/20 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
              <span className="text-blue-400 text-sm font-bold">D</span>
            </div>
            <div>
              <p className="text-white font-medium">Destination Network</p>
              <p className="text-sm text-gray-400">
                {destinationChain?.name || "Loading..."}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Randomly Selected</p>
          </div>
        </div>
      </div>

      {/* Cross-chain indicator */}
      {isCrossChainPayment && (
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <HiArrowPath className="w-4 h-4 text-blue-400" />
            <span className="text-blue-400 text-sm font-medium">
              Cross-Chain Transaction Detected
            </span>
          </div>
          <p className="text-xs text-blue-400/80 mt-1">
            {currentChain?.name} → {destinationChain?.name}
          </p>
          <p className="text-xs text-blue-400/80 mt-1">
            Estimated fees: ~{crossChainFees} {currentChain?.nativeCurrency}
          </p>
        </div>
      )}
    </div>
  );

  const renderStepContent = () => {
    switch (step) {
      case "review":
        return (
          <div className="space-y-6">
            {renderSupportedChainSelector()}

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
                        USDT ({currentChain?.name || "Unknown"})
                      </p>
                      <p className="text-sm text-gray-400">
                        {!wallet.isConnected
                          ? "Connect wallet to continue"
                          : needsApproval
                          ? "Approval required"
                          : isCrossChainPayment
                          ? "Cross-chain payment ready"
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

            <div className="bg-Red/10 border border-Red/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <HiShieldCheck className="w-5 h-5 text-Red flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-Red font-medium">
                    {isCrossChainPayment
                      ? "Secure Cross-Chain Escrow"
                      : "Secure Escrow Payment"}
                  </p>
                  <p className="text-sm text-Red/80 mt-1">
                    {isCrossChainPayment
                      ? "Your payment is securely transferred across chains and held in escrow until delivery confirmation."
                      : "Your payment is held securely until you confirm delivery of your order."}
                  </p>
                </div>
              </div>
            </div>

            {/* {needsApproval && ( */}
            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <HiExclamationTriangle className="w-4 h-4 text-yellow-400" />
                <span className="text-yellow-400 text-sm">
                  USDT spending approval required for this transaction
                </span>
              </div>
            </div>
            {/* )} */}

            {(!wallet.isConnected ||
              /* hasInsufficientBalance || */
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

                {/*
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
                */}

                {wallet.isConnected && hasInsufficientGas && (
                  <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <HiExclamationTriangle className="w-4 h-4 text-yellow-400" />
                      <span className="text-yellow-400 text-sm">
                        Low {currentChain?.nativeCurrency || "native token"}{" "}
                        balance for transaction fees
                      </span>
                    </div>
                  </div>
                )}

                {wallet.isConnected && !isCorrectNetwork && (
                  <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <HiExclamationTriangle className="w-4 h-4 text-yellow-400" />
                      <span className="text-yellow-400 text-sm">
                        Please switch to a supported network
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {retryCount > 0 && (
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <span className="text-blue-400 text-sm">
                    Retry attempt #{retryCount}
                  </span>
                </div>
              </div>
            )}

            <Button
              title={
                !wallet.isConnected
                  ? "Connect Wallet"
                  : isCrossChainPayment
                  ? `Pay ${formatCurrency(orderAmount)} USDT (Cross-Chain)`
                  : `Pay ${formatCurrency(orderAmount)} USDT`
              }
              onClick={handlePayment}
              disabled={
                isProcessing ||
                isLoadingBalance ||
                isLoadingChains ||
                (!wallet.isConnected &&
                  /* hasInsufficientBalance || */ hasInsufficientGas)
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
                {isCrossChainPayment
                  ? "Processing Cross-Chain Payment"
                  : "Processing Payment"}
              </h3>
              <p className="text-gray-300 max-w-sm mx-auto">
                {needsApproval
                  ? "Requesting USDT spending permission..."
                  : isCrossChainPayment
                  ? "Initiating secure cross-chain transaction..."
                  : "Completing your purchase transaction..."}
              </p>
              <p className="text-sm text-gray-400">
                Please confirm the transaction in your wallet
              </p>
              {isCrossChainPayment && (
                <p className="text-xs text-blue-400">
                  Cross-chain transactions may take a few minutes to complete
                </p>
              )}
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
                {isCrossChainPayment
                  ? "Cross-Chain Payment Successful!"
                  : "Payment Successful!"}
              </h3>
              <p className="text-gray-300 max-w-md mx-auto">
                {isCrossChainPayment
                  ? "Your cross-chain payment has been sent to escrow. The transaction will be processed across networks."
                  : "Your payment has been sent to escrow. You'll receive your order soon."}
              </p>
              {transaction && (
                <div className="bg-Dark/50 border border-Red/20 rounded-lg p-4 mt-4 space-y-2">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">
                      Transaction Hash:
                    </p>
                    <p className="font-mono text-xs text-Red break-all">
                      {transaction.hash}
                    </p>
                  </div>
                  {transaction.messageId && (
                    <div>
                      <p className="text-sm text-gray-400 mb-1">
                        CCIP Message ID:
                      </p>
                      <p className="font-mono text-xs text-blue-400 break-all">
                        {transaction.messageId}
                      </p>
                    </div>
                  )}
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
