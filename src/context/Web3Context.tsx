import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useBalance,
  useSwitchChain,
} from "wagmi";
import { parseUnits, formatUnits, erc20Abi, decodeEventLog } from "viem";
import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import {
  Web3ContextType,
  WalletState,
  PaymentTransaction,
  PaymentParams,
  BuyTradeParams,
  TradeDetails,
} from "../utils/types/web3.types";
import {
  TARGET_CHAIN,
  USDT_ADDRESSES,
  wagmiConfig,
  GAS_LIMITS,
  PERFORMANCE_CONFIG,
} from "../utils/config/web3.config";
import { useSnackbar } from "./SnackbarContext";
import { useCurrencyConverter } from "../utils/hooks/useCurrencyConverter";
import { Dezentra_ABI } from "../utils/abi/dezenmartAbi.json";
import { ESCROW_ADDRESSES } from "../utils/config/web3.config";
import { parseWeb3Error } from "../utils/errorParser";
import {
  readContract,
  simulateContract,
  waitForTransactionReceipt,
} from "@wagmi/core";

interface ExtendedWalletState extends WalletState {
  usdtBalance?: {
    raw: string;
    usdt: string;
    celo: string;
    fiat: string;
  };
}

interface ExtendedWeb3ContextType extends Omit<Web3ContextType, "wallet"> {
  wallet: ExtendedWalletState;
  buyTrade: (params: BuyTradeParams) => Promise<PaymentTransaction>;
  validateTradeBeforePurchase: (
    tradeId: string,
    quantity: string,
    logisticsProvider: string
  ) => Promise<boolean>;
  approveUSDT: (amount: string) => Promise<string>;
  usdtAllowance: bigint | undefined;
  usdtDecimals: number | undefined;
  getTrade: (tradeId: string) => Promise<TradeDetails>;
  refreshBalances: () => Promise<void>;
}

const Web3Context = createContext<ExtendedWeb3ContextType | undefined>(
  undefined
);

export const Web3Provider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { showSnackbar } = useSnackbar();
  const { address, isConnected, chain } = useAccount();
  const {
    connect,
    connectors,
    isPending: isConnecting,
    error: connectError,
  } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const { convertPrice, formatPrice } = useCurrencyConverter();

  const [wallet, setWallet] = useState<ExtendedWalletState>({
    isConnected: false,
    isConnecting: false,
  });

  const [isRefreshing, setIsRefreshing] = useState(false);

  const isCorrectNetwork = chain?.id === TARGET_CHAIN.id;

  // AVAX balance for gas fees (since we're on Avalanche Fuji)
  const { data: avaxBalance, refetch: refetchAvaxBalance } = useBalance({
    address,
    query: {
      enabled: !!address && isCorrectNetwork,
      refetchInterval: PERFORMANCE_CONFIG.CACHE_DURATION / 2,
      staleTime: PERFORMANCE_CONFIG.CACHE_DURATION / 4,
    },
  });

  // Get USDT contract address
  const usdtContractAddress = useMemo(() => {
    if (!address || !chain?.id) return undefined;
    const contractAddr =
      USDT_ADDRESSES[chain.id as keyof typeof USDT_ADDRESSES];
    return contractAddr as `0x${string}` | undefined;
  }, [address, chain?.id]);

  // Get escrow contract address
  const escrowContractAddress = useMemo(() => {
    if (!chain?.id) return undefined;
    const contractAddr =
      ESCROW_ADDRESSES[chain.id as keyof typeof ESCROW_ADDRESSES];
    return contractAddr as `0x${string}` | undefined;
  }, [chain?.id]);

  const {
    data: usdtBalance,
    refetch: refetchUSDTBalance,
    isLoading: isLoadingUSDT,
    error: usdtError,
  } = useReadContract({
    address: usdtContractAddress,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!usdtContractAddress && isCorrectNetwork,
      refetchInterval: PERFORMANCE_CONFIG.CACHE_DURATION,
      staleTime: PERFORMANCE_CONFIG.CACHE_DURATION / 2,
    },
  });

  // Get USDT decimals
  const { data: usdtDecimals } = useReadContract({
    address: usdtContractAddress,
    abi: erc20Abi,
    functionName: "decimals",
    query: {
      enabled: !!usdtContractAddress && isCorrectNetwork,
      staleTime: Infinity,
    },
  });

  // Check current allowance
  const { data: usdtAllowance, refetch: refetchAllowance } = useReadContract({
    address: usdtContractAddress,
    abi: erc20Abi,
    functionName: "allowance",
    args:
      address && escrowContractAddress
        ? [address, escrowContractAddress]
        : undefined,
    query: {
      enabled:
        !!address &&
        !!usdtContractAddress &&
        !!escrowContractAddress &&
        isCorrectNetwork,
      refetchInterval: PERFORMANCE_CONFIG.CACHE_DURATION / 4,
      staleTime: PERFORMANCE_CONFIG.CACHE_DURATION / 8,
    },
  });

  // Optimized balance refresh function
  const refreshBalances = useCallback(async () => {
    if (!isConnected || !address || !isCorrectNetwork || isRefreshing) return;

    setIsRefreshing(true);
    try {
      await Promise.allSettled([
        refetchUSDTBalance(),
        refetchAvaxBalance(),
        refetchAllowance(),
      ]);
    } catch (error) {
      console.warn("Failed to refresh some balances:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [
    isConnected,
    address,
    isCorrectNetwork,
    isRefreshing,
    refetchUSDTBalance,
    refetchAvaxBalance,
    refetchAllowance,
  ]);

  // Auto-refresh balances with performance optimization
  useEffect(() => {
    if (isConnected && address && isCorrectNetwork) {
      const interval = setInterval(() => {
        if (!isLoadingUSDT && !isRefreshing) {
          refreshBalances();
        }
      }, PERFORMANCE_CONFIG.CACHE_DURATION);

      return () => clearInterval(interval);
    }
  }, [
    isConnected,
    address,
    isCorrectNetwork,
    isLoadingUSDT,
    isRefreshing,
    refreshBalances,
  ]);

  const connectWallet = useCallback(async () => {
    try {
      const connector =
        connectors.find((c) => c.name === "MetaMask") || connectors[0];
      if (connector) {
        connect({ connector });
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      showSnackbar("Failed to connect wallet. Please try again.", "error");
    }
  }, [connect, connectors, showSnackbar]);

  const disconnectWallet = useCallback(() => {
    disconnect();
    showSnackbar("Wallet disconnected", "success");
  }, [disconnect, showSnackbar]);

  const switchToCorrectNetwork = useCallback(async () => {
    try {
      await switchChain({ chainId: TARGET_CHAIN.id });
      showSnackbar(`Switched to ${TARGET_CHAIN.name}`, "success");
    } catch (error) {
      console.error("Failed to switch network:", error);
      showSnackbar(`Failed to switch to ${TARGET_CHAIN.name}`, "error");
      throw error;
    }
  }, [switchChain, showSnackbar]);

  const getUSDTBalance = useCallback(async (): Promise<string> => {
    try {
      const result = await refetchUSDTBalance();
      if (result.data && usdtDecimals !== undefined) {
        const balanceBigInt = result.data as bigint;
        const decimals = Number(usdtDecimals);

        const formattedBalance = formatUnits(balanceBigInt, decimals);
        const numericBalance = parseFloat(formattedBalance);

        const cleanBalance = numericBalance.toLocaleString("en-US", {
          minimumFractionDigits: 0,
          maximumFractionDigits: Math.min(decimals, 6),
        });

        return cleanBalance;
      }
      return "0";
    } catch (error) {
      console.error("Failed to fetch USDT balance:", error);
      return "0";
    }
  }, [refetchUSDTBalance, usdtDecimals]);

  // Converted USDT balances
  const convertedUSDTBalances = useMemo(() => {
    if (!usdtBalance || usdtError || usdtDecimals === undefined)
      return undefined;

    try {
      const decimals = Number(usdtDecimals);
      const rawBalance = formatUnits(usdtBalance as bigint, decimals);
      const numericBalance = parseFloat(rawBalance);

      if (isNaN(numericBalance)) return undefined;

      const formatWithDecimals = (value: number, maxDecimals: number = 2) => {
        return value.toLocaleString("en-US", {
          minimumFractionDigits: 0,
          maximumFractionDigits: maxDecimals,
          useGrouping: true,
        });
      };

      return {
        raw: rawBalance,
        usdt: `${formatWithDecimals(numericBalance, 6)} USDT`,
        celo: formatPrice(convertPrice(numericBalance, "USDT", "CELO"), "CELO"),
        fiat: formatPrice(convertPrice(numericBalance, "USDT", "FIAT"), "FIAT"),
      };
    } catch (error) {
      console.error("Error formatting USDT balance:", error);
      return undefined;
    }
  }, [usdtBalance, usdtError, usdtDecimals, convertPrice, formatPrice]);

  // Update wallet state
  useEffect(() => {
    setWallet((prev) => ({
      ...prev,
      isConnected,
      address,
      chainId: chain?.id,
      balance: avaxBalance
        ? formatUnits(avaxBalance.value, avaxBalance.decimals)
        : undefined,
      error: connectError?.message || usdtError?.message,
      isConnecting: isConnecting || isLoadingUSDT,
      usdtBalance: convertedUSDTBalances,
    }));
  }, [
    isConnected,
    address,
    chain,
    avaxBalance,
    connectError,
    usdtError,
    isConnecting,
    isLoadingUSDT,
    convertedUSDTBalances,
  ]);

  // Get trade details
  const getTrade = useCallback(
    async (tradeId: string): Promise<TradeDetails> => {
      if (!escrowContractAddress) {
        throw new Error("Escrow contract not available");
      }

      try {
        const tradeDetails = await readContract(wagmiConfig, {
          address: escrowContractAddress,
          abi: Dezentra_ABI,
          functionName: "trades",
          args: [BigInt(tradeId)],
        });

        return tradeDetails as TradeDetails;
      } catch (error: any) {
        console.error("Failed to get trade details:", error);
        if (error?.message?.includes("TradeNotFound")) {
          throw new Error("Trade not found");
        }
        throw new Error("Failed to fetch trade details");
      }
    },
    [escrowContractAddress]
  );

  // Updated buyTrade function to match new ABI
  const buyTrade = useCallback(
    async (params: BuyTradeParams): Promise<PaymentTransaction> => {
      if (!address || !chain?.id) {
        throw new Error("Wallet not connected");
      }

      if (!isCorrectNetwork) {
        throw new Error("Please switch to the correct network first");
      }

      if (!escrowContractAddress) {
        throw new Error("Escrow contract not available on this network");
      }

      if (!usdtContractAddress) {
        throw new Error("USDT contract not available on this network");
      }

      try {
        const tradeId = BigInt(params.tradeId);
        const quantity = BigInt(params.quantity);
        const logisticsProvider = params.logisticsProvider as `0x${string}`;

        if (
          !logisticsProvider?.startsWith("0x") ||
          logisticsProvider.length !== 42
        ) {
          throw new Error("Invalid logistics provider address");
        }

        // Get trade details to calculate amounts
        const tradeDetails = await getTrade(params.tradeId);
        const productCost = tradeDetails.productCost as bigint;
        const totalProductCost = productCost * quantity;

        // For this implementation, we'll use USDT as the buyer token
        // In a production system, you might want to support multiple tokens
        const buyerToken = usdtContractAddress;
        const buyerTokenAmount = totalProductCost;
        const totalAmountInUSDT = totalProductCost;

        // Estimate gas first
        let gasEstimate: bigint;
        try {
          const { request } = await simulateContract(wagmiConfig, {
            address: escrowContractAddress,
            abi: Dezentra_ABI,
            functionName: "buyTrade",
            args: [
              tradeId,
              quantity,
              logisticsProvider,
              buyerToken,
              buyerTokenAmount,
              totalAmountInUSDT,
            ],
            account: address,
          });

          gasEstimate = request.gas
            ? (request.gas * BigInt(120)) / BigInt(100)
            : GAS_LIMITS.BUY_TRADE;
        } catch (estimateError) {
          console.warn("Gas estimation failed, using default:", estimateError);
          gasEstimate = GAS_LIMITS.BUY_TRADE;
        }

        const hash = await writeContractAsync({
          address: escrowContractAddress,
          abi: Dezentra_ABI,
          functionName: "buyTrade",
          args: [
            tradeId,
            quantity,
            logisticsProvider,
            buyerToken,
            buyerTokenAmount,
            totalAmountInUSDT,
          ],
          gas: gasEstimate,
        });

        if (!hash) {
          throw new Error("Transaction failed to execute");
        }

        const receipt = await waitForTransactionReceipt(wagmiConfig, {
          hash,
          timeout: 60000,
        });

        let purchaseId: string | undefined;

        if (receipt.logs) {
          try {
            const decodedLogs = receipt.logs
              .map((log) => {
                try {
                  return decodeEventLog({
                    abi: Dezentra_ABI,
                    data: log.data,
                    topics: log.topics,
                  });
                } catch {
                  return null;
                }
              })
              .filter(Boolean);

            const purchaseCreatedEvent = decodedLogs.find(
              (event: any) => event?.eventName === "PurchaseCreated"
            );

            if (purchaseCreatedEvent?.args) {
              const args = purchaseCreatedEvent.args as any;
              purchaseId = args.purchaseId?.toString();
            }
          } catch (error) {
            console.warn("Failed to decode event logs:", error);
          }
        }

        // Refresh balances after successful transaction
        setTimeout(() => {
          refreshBalances();
        }, 2000);

        return {
          hash,
          amount: formatUnits(totalAmountInUSDT, Number(usdtDecimals || 6)),
          token: "USDT",
          to: escrowContractAddress,
          from: address,
          status: "pending",
          timestamp: Date.now(),
          purchaseId,
        };
      } catch (error: any) {
        console.error("Buy trade failed:", error);

        // Enhanced error parsing for new contract errors
        const errorMessage = error?.message || error?.toString() || "";

        if (errorMessage.includes("InsufficientTokenBalance")) {
          throw new Error("Insufficient USDT balance for this purchase");
        }
        if (errorMessage.includes("InsufficientTokenAllowance")) {
          throw new Error(
            "USDT allowance insufficient. Please approve the amount first"
          );
        }
        if (
          errorMessage.includes("InvalidTradeId") ||
          errorMessage.includes("TradeNotFound")
        ) {
          throw new Error(
            "Invalid trade ID. This product may no longer be available"
          );
        }
        if (errorMessage.includes("InsufficientQuantity")) {
          throw new Error("Requested quantity exceeds available stock");
        }
        if (errorMessage.includes("InvalidQuantity")) {
          throw new Error("Invalid quantity specified");
        }
        if (errorMessage.includes("InvalidLogisticsProvider")) {
          throw new Error("Invalid logistics provider selected");
        }
        if (errorMessage.includes("BuyerIsSeller")) {
          throw new Error("Cannot purchase your own product");
        }
        if (errorMessage.includes("InvalidTradeState")) {
          throw new Error("Trade is not in a valid state for purchase");
        }
        if (
          errorMessage.includes("User rejected") ||
          errorMessage.includes("user rejected")
        ) {
          throw new Error("Transaction was rejected by user");
        }
        if (errorMessage.includes("Internal JSON-RPC error")) {
          throw new Error(
            "Network error. Please check your connection and try again"
          );
        }
        if (errorMessage.includes("gas")) {
          throw new Error(
            "Transaction failed due to gas issues. Please try again"
          );
        }

        throw new Error("Transaction failed. Please try again.");
      }
    },
    [
      address,
      chain,
      isCorrectNetwork,
      escrowContractAddress,
      usdtContractAddress,
      writeContractAsync,
      getTrade,
      usdtDecimals,
      refreshBalances,
    ]
  );

  const validateTradeBeforePurchase = useCallback(
    async (
      tradeId: string,
      quantity: string,
      logisticsProvider: string
    ): Promise<boolean> => {
      if (!address || !chain?.id) {
        console.warn("Wallet not connected for trade validation");
        return false;
      }

      if (!escrowContractAddress) {
        console.warn("Escrow contract not available on this network");
        return false;
      }

      try {
        const tradeDetails = await getTrade(tradeId);

        // Check if trade is active
        if (!tradeDetails.active) {
          console.warn(`Trade ${tradeId} is not active`);
          return false;
        }

        // Check if sufficient quantity is available
        if (tradeDetails.remainingQuantity < BigInt(quantity)) {
          console.warn(
            `Insufficient quantity for trade ${tradeId}. Available: ${tradeDetails.remainingQuantity}, Requested: ${quantity}`
          );
          return false;
        }

        // Additional validation for logistics provider could be added here
        // For now, we'll assume the logistics provider validation is handled by the contract

        return true;
      } catch (error: any) {
        if (error?.message?.includes("TradeNotFound")) {
          console.warn(`Trade ${tradeId} not found in contract`);
        } else {
          console.error("Trade validation failed:", error);
        }
        return false;
      }
    },
    [address, chain, escrowContractAddress, getTrade]
  );

  const getCurrentAllowance = useCallback(async (): Promise<number> => {
    if (!address || !chain?.id || !usdtContractAddress) {
      return 0;
    }

    try {
      const result = await refetchAllowance();
      if (result.data && usdtDecimals !== undefined) {
        const allowanceBigInt = result.data as bigint;
        const decimals = Number(usdtDecimals);
        const formattedAllowance = formatUnits(allowanceBigInt, decimals);
        return parseFloat(formattedAllowance);
      }
      return 0;
    } catch (error) {
      console.error("Failed to fetch allowance:", error);
      return 0;
    }
  }, [address, chain?.id, usdtContractAddress, refetchAllowance, usdtDecimals]);

  const approveUSDT = useCallback(
    async (amount: string): Promise<string> => {
      if (!address || !chain?.id) {
        throw new Error("Wallet not connected");
      }

      if (!usdtContractAddress || !escrowContractAddress) {
        throw new Error("Contracts not available on this network");
      }

      try {
        const currentAllowance = await getCurrentAllowance();
        const requiredAmount = parseFloat(amount);

        if (currentAllowance >= requiredAmount) {
          return "0x0"; // Already approved
        }

        const maxApproval = BigInt(
          "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
        );

        const hash = await writeContractAsync({
          address: usdtContractAddress,
          abi: erc20Abi,
          functionName: "approve",
          args: [escrowContractAddress, maxApproval],
          gas: GAS_LIMITS.APPROVE,
        });

        // Refresh allowance after approval
        setTimeout(() => {
          refetchAllowance();
        }, 2000);

        return hash;
      } catch (error: any) {
        console.error("USDT approval failed:", error);

        if (error?.message?.includes("User rejected")) {
          throw new Error("Approval was rejected by user");
        }
        if (error?.message?.includes("insufficient funds")) {
          throw new Error("Insufficient AVAX for gas fees");
        }

        throw new Error(`Approval failed: ${parseWeb3Error(error)}`);
      }
    },
    [
      address,
      chain,
      usdtContractAddress,
      escrowContractAddress,
      writeContractAsync,
      getCurrentAllowance,
      refetchAllowance,
    ]
  );

  const sendPayment = useCallback(
    async (params: PaymentParams): Promise<PaymentTransaction> => {
      if (!address || !chain?.id) {
        throw new Error("Wallet not connected");
      }

      if (!isCorrectNetwork) {
        try {
          await switchToCorrectNetwork();
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (error) {
          throw new Error("Please switch to the correct network first");
        }
      }

      if (!usdtContractAddress) {
        throw new Error("USDT not supported on this network");
      }

      try {
        const amount = parseUnits(params.amount, Number(usdtDecimals || 6));

        const hash = await writeContractAsync({
          address: usdtContractAddress,
          abi: erc20Abi,
          functionName: "transfer",
          args: [params.to as `0x${string}`, amount],
        });

        const transaction: PaymentTransaction = {
          hash,
          amount: params.amount,
          token: "USDT",
          to: params.to,
          from: address,
          status: "pending",
          timestamp: Date.now(),
        };

        showSnackbar("Payment sent! Waiting for confirmation...", "success");

        // Refresh balances after payment
        setTimeout(() => {
          refreshBalances();
        }, 2000);

        return transaction;
      } catch (error) {
        console.error("Payment failed:", error);
        showSnackbar("Payment failed. Please try again.", "error");
        throw error;
      }
    },
    [
      address,
      chain,
      isCorrectNetwork,
      switchToCorrectNetwork,
      usdtContractAddress,
      usdtDecimals,
      writeContractAsync,
      showSnackbar,
      refreshBalances,
    ]
  );

  const value: ExtendedWeb3ContextType = {
    wallet,
    connectWallet,
    disconnectWallet,
    switchToCorrectNetwork,
    sendPayment,
    usdtAllowance,
    usdtDecimals,
    getCurrentAllowance,
    getUSDTBalance,
    buyTrade,
    approveUSDT,
    validateTradeBeforePurchase,
    getTrade,
    refreshBalances,
    isCorrectNetwork,
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
};

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error("useWeb3 must be used within a Web3Provider");
  }
  return context;
};
