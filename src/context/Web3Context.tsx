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
} from "../utils/types/web3.types";
import {
  TARGET_CHAIN,
  USDT_ADDRESSES,
  wagmiConfig,
} from "../utils/config/web3.config";
import { useSnackbar } from "./SnackbarContext";
import { useCurrencyConverter } from "../utils/hooks/useCurrencyConverter";
import { DEZENMART_ABI } from "../utils/abi/dezenmartAbi.json";
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
  ) => Promise<any>;
  approveUSDT: (amount: string) => Promise<string>;
  usdtAllowance: bigint | undefined;
  usdtDecimals: number | undefined;
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

  const isCorrectNetwork = chain?.id === TARGET_CHAIN.id;

  // CELO balance for gas fees
  const { data: celoBalance, refetch: refetchCeloBalance } = useBalance({
    address,
    query: {
      enabled: !!address && isCorrectNetwork,
      refetchInterval: 30000,
    },
  });

  // Get USDT contract address
  const usdtContractAddress = useMemo(() => {
    if (!address || !chain?.id) return undefined;
    const contractAddr =
      USDT_ADDRESSES[chain.id as keyof typeof USDT_ADDRESSES];
    return contractAddr as `0x${string}` | undefined;
  }, [address, chain?.id]);

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
      refetchInterval: 60000,
      staleTime: 30000,
    },
  });

  // Auto-refresh balances
  useEffect(() => {
    if (isConnected && address && isCorrectNetwork) {
      const interval = setInterval(() => {
        if (!isLoadingUSDT) {
          refetchUSDTBalance();
          refetchCeloBalance();
        }
      }, 60000);

      return () => clearInterval(interval);
    }
  }, [isConnected, address, isCorrectNetwork, isLoadingUSDT]);

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

  // get USDT decimals
  const { data: usdtDecimals } = useReadContract({
    address: usdtContractAddress,
    abi: erc20Abi,
    functionName: "decimals",
    query: {
      enabled: !!usdtContractAddress && isCorrectNetwork,
      staleTime: Infinity,
    },
  });

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

  // converted USDT balances
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
      balance: celoBalance
        ? formatUnits(celoBalance.value, celoBalance.decimals)
        : undefined,
      error: connectError?.message || usdtError?.message,
      isConnecting: isConnecting || isLoadingUSDT,
      usdtBalance: convertedUSDTBalances,
    }));
  }, [
    isConnected,
    address,
    chain,
    celoBalance,
    connectError,
    usdtError,
    isConnecting,
    isLoadingUSDT,
    convertedUSDTBalances,
  ]);

  const buyTrade = useCallback(
    async (params: BuyTradeParams): Promise<PaymentTransaction> => {
      if (!address || !chain?.id) {
        throw new Error("Wallet not connected");
      }

      if (!isCorrectNetwork) {
        throw new Error("Please switch to the correct network first");
      }

      const escrowAddress =
        ESCROW_ADDRESSES[chain.id as keyof typeof ESCROW_ADDRESSES];
      if (!escrowAddress) {
        throw new Error("Escrow contract not available on this network");
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

        // Estimate gas first
        let gasEstimate: bigint;
        try {
          const { request } = await simulateContract(wagmiConfig, {
            address: escrowAddress as `0x${string}`,
            abi: DEZENMART_ABI,
            functionName: "buyTrade",
            args: [tradeId, quantity, logisticsProvider],
            account: address,
          });

          gasEstimate = request.gas
            ? (request.gas * BigInt(120)) / BigInt(100)
            : BigInt(800000);
        } catch (estimateError) {
          console.warn("Gas estimation failed, using default:", estimateError);
          gasEstimate = BigInt(800000);
        }

        const hash = await writeContractAsync({
          address: escrowAddress as `0x${string}`,
          abi: DEZENMART_ABI,
          functionName: "buyTrade",
          args: [tradeId, quantity, logisticsProvider],
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
                    abi: DEZENMART_ABI,
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

        return {
          hash,
          amount: "0",
          token: "USDT",
          to: escrowAddress,
          from: address,
          status: "pending",
          timestamp: Date.now(),
          purchaseId,
        };
      } catch (error: any) {
        console.error("Buy trade failed:", error);

        // Enhanced error parsing
        const errorMessage = error?.message || error?.toString() || "";

        if (errorMessage.includes("InsufficientUSDTBalance")) {
          throw new Error("Insufficient USDT balance for this purchase");
        }
        if (errorMessage.includes("InsufficientUSDTAllowance")) {
          throw new Error(
            "USDT allowance insufficient. Please approve the amount first"
          );
        }
        if (
          errorMessage.includes("InvalidTradeId") ||
          errorMessage.includes("Trade not found")
        ) {
          throw new Error(
            "Invalid trade ID. This product may no longer be available"
          );
        }
        if (errorMessage.includes("InsufficientQuantity")) {
          throw new Error("Requested quantity exceeds available stock");
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
    [address, chain, isCorrectNetwork, writeContractAsync]
  );

  const validateTradeBeforePurchase = useCallback(
    async (tradeId: string, quantity: string, logisticsProvider: string) => {
      if (!address || !chain?.id) {
        console.warn("Wallet not connected for trade validation");
        return false;
      }

      const escrowAddress =
        ESCROW_ADDRESSES[chain.id as keyof typeof ESCROW_ADDRESSES];
      if (!escrowAddress) {
        console.warn("Escrow contract not available on this network");
        return false;
      }

      try {
        const tradeDetails = (await readContract(wagmiConfig, {
          address: escrowAddress as `0x${string}`,
          abi: DEZENMART_ABI,
          functionName: "getTrade",
          args: [BigInt(tradeId)],
        })) as {
          active: boolean;
          remainingQuantity: bigint;
          logisticsProviders: string[];
        };

        // More detailed validation
        if (!tradeDetails.active) {
          console.warn(`Trade ${tradeId} is not active`);
          return false;
        }

        if (tradeDetails.remainingQuantity < BigInt(quantity)) {
          console.warn(
            `Insufficient quantity for trade ${tradeId}. Available: ${tradeDetails.remainingQuantity}, Requested: ${quantity}`
          );
          return false;
        }

        if (!tradeDetails.logisticsProviders.includes(logisticsProvider)) {
          console.warn(
            `Logistics provider ${logisticsProvider} not available for trade ${tradeId}`
          );
          return false;
        }

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
    [address, chain]
  );
  // Check current allowance
  const { data: usdtAllowance, refetch: refetchAllowance } = useReadContract({
    address: usdtContractAddress,
    abi: erc20Abi,
    functionName: "allowance",
    args:
      address && chain?.id
        ? [
            address,
            ESCROW_ADDRESSES[
              chain.id as keyof typeof ESCROW_ADDRESSES
            ] as `0x${string}`,
          ]
        : undefined,
    query: {
      enabled: !!address && !!usdtContractAddress && isCorrectNetwork,
      refetchInterval: 15000,
    },
  });

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

      const usdtAddress =
        USDT_ADDRESSES[chain.id as keyof typeof USDT_ADDRESSES];
      const escrowAddress =
        ESCROW_ADDRESSES[chain.id as keyof typeof ESCROW_ADDRESSES];

      if (!usdtAddress || !escrowAddress) {
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
          address: usdtAddress as `0x${string}`,
          abi: erc20Abi,
          functionName: "approve",
          args: [escrowAddress as `0x${string}`, maxApproval],
          gas: BigInt(150000),
        });

        return hash;
      } catch (error: any) {
        console.error("USDT approval failed:", error);

        if (error?.message?.includes("User rejected")) {
          throw new Error("Approval was rejected by user");
        }
        if (error?.message?.includes("insufficient funds")) {
          throw new Error("Insufficient CELO for gas fees");
        }

        throw new Error(`Approval failed: ${parseWeb3Error(error)}`);
      }
    },
    [address, chain, writeContractAsync, getCurrentAllowance]
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

      const usdtAddress =
        USDT_ADDRESSES[chain.id as keyof typeof USDT_ADDRESSES];
      if (!usdtAddress) {
        throw new Error("USDT not supported on this network");
      }

      try {
        const amount = parseUnits(params.amount, 6);

        const hash = await writeContractAsync({
          address: usdtAddress as `0x${string}`,
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
      writeContractAsync,
      showSnackbar,
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
