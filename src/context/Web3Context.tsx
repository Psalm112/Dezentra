import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useBalance,
  useSwitchChain,
  useChainId,
} from "wagmi";
import { parseUnits, formatUnits, erc20Abi, decodeEventLog, Chain } from "viem";
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
  UnifiedBuyTradeParams,
} from "../utils/types/web3.types";
import {
  TARGET_CHAIN,
  USDT_ADDRESSES,
  wagmiConfig,
  GAS_LIMITS,
  PERFORMANCE_CONFIG,
  getChainMetadata,
  SUPPORTED_CHAINS,
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
  buyTrade: (params: UnifiedBuyTradeParams) => Promise<PaymentTransaction>;
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
  estimateCrossChainFees: (
    destinationChainSelector: string,
    payFeesIn: 0 | 1
  ) => Promise<bigint>;
  chain: Chain | undefined;
  chainId: number | undefined;
  isCorrectNetwork: boolean;
  networkStatus: "connected" | "wrong-network" | "disconnected" | "switching";
}

const Web3Context = createContext<ExtendedWeb3ContextType | undefined>(
  undefined
);

export const Web3Provider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { showSnackbar } = useSnackbar();
  const { address, isConnected, chain } = useAccount();
  const chainId = useChainId();

  // const watchedChainId = useWatchChainId({
  //   onChainChanged: (chainId: number) => {
  //     console.log("Chain changed to:", chainId);
  //     // Trigger immediate state updates
  //     setNetworkStatus(
  //       chainId === TARGET_CHAIN.id ? "connected" : "wrong-network"
  //     );
  //   },
  // });
  const {
    connect,
    connectors,
    isPending: isConnecting,
    error: connectError,
  } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const { convertPrice, formatPrice } = useCurrencyConverter();

  const [wallet, setWallet] = useState<ExtendedWalletState>({
    isConnected: false,
    isConnecting: false,
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [networkStatus, setNetworkStatus] = useState<
    "connected" | "wrong-network" | "disconnected" | "switching"
  >("disconnected");

  const networkStatusRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const previousChainIdRef = useRef<number | undefined>(undefined);
  const lastRefreshRef = useRef<number>(0);
  const autoRefreshIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const currentChain = useMemo(() => chain, [chain]);
  const currentChainId = useMemo(
    () => chainId || chain?.id,
    [chainId, chain?.id]
  );

  const isCorrectNetwork = useMemo(() => {
    return SUPPORTED_CHAINS.some((chain) => chain.id === currentChainId);
  }, [currentChainId]);

  // network status management
  const updateNetworkStatus = useCallback(() => {
    if (!isConnected) {
      setNetworkStatus("disconnected");
      return;
    }

    if (isSwitchingChain) {
      setNetworkStatus("switching");
      return;
    }

    const newStatus = isCorrectNetwork ? "connected" : "wrong-network";
    setNetworkStatus(newStatus);
  }, [isConnected, isSwitchingChain, isCorrectNetwork]);

  // Network status effect
  // useEffect(() => {
  //   if (networkStatusRef.current) {
  //     clearTimeout(networkStatusRef.current);
  //   }

  //   if (previousChainIdRef.current !== currentChainId) {
  //     previousChainIdRef.current = currentChainId;

  //     networkStatusRef.current = setTimeout(() => {
  //       updateNetworkStatus();

  //       if (currentChainId && currentChainId !== TARGET_CHAIN.id) {
  //         const currentChainName =
  //           getChainMetadata(currentChainId)?.name || "Unknown Network";
  //         // showSnackbar(
  //         //   `Connected to ${currentChainName}. Switch to ${TARGET_CHAIN.name} for full functionality.`,
  //         //   "error"
  //         // );
  //       } else if (currentChainId === TARGET_CHAIN.id) {
  //         showSnackbar(`Connected to ${TARGET_CHAIN.name}`, "success");
  //       }
  //     }, 100);
  //   }

  //   return () => {
  //     if (networkStatusRef.current) {
  //       clearTimeout(networkStatusRef.current);
  //     }
  //   };
  // }, [currentChainId, updateNetworkStatus, showSnackbar]);

  // Connection status effect
  useEffect(() => {
    if (!isConnected) {
      setNetworkStatus("disconnected");
      setWallet((prev) => ({
        ...prev,
        isConnected: false,
        address: undefined,
        chainId: undefined,
        balance: undefined,
        usdtBalance: undefined,
      }));
    }
  }, [isConnected]);

  // AVAX balance
  const { data: avaxBalance, refetch: refetchAvaxBalance } = useBalance({
    address,
    query: {
      enabled: Boolean(address && currentChainId && isCorrectNetwork),
      refetchInterval: false,
      staleTime: PERFORMANCE_CONFIG.CACHE_DURATION,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  });

  // Get USDT contract address
  const usdtContractAddress = useMemo(() => {
    if (!address || !currentChainId || !isCorrectNetwork) return undefined;

    const contractAddr =
      USDT_ADDRESSES[currentChainId as keyof typeof USDT_ADDRESSES];
    return contractAddr ? (contractAddr as `0x${string}`) : undefined;
  }, [address, currentChainId, isCorrectNetwork]);

  // Get escrow contract address
  const escrowContractAddress = useMemo(() => {
    if (!currentChainId || !isCorrectNetwork) return undefined;

    const contractAddr =
      ESCROW_ADDRESSES[currentChainId as keyof typeof ESCROW_ADDRESSES];
    return contractAddr ? (contractAddr as `0x${string}`) : undefined;
  }, [currentChainId, isCorrectNetwork]);

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
      enabled: Boolean(address && usdtContractAddress && isCorrectNetwork),
      refetchInterval: false,
      staleTime: PERFORMANCE_CONFIG.CACHE_DURATION,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  });

  // Get USDT decimals
  const { data: usdtDecimals } = useReadContract({
    address: usdtContractAddress,
    abi: erc20Abi,
    functionName: "decimals",
    query: {
      enabled: Boolean(usdtContractAddress && isCorrectNetwork),
      staleTime: Infinity,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
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
      enabled: Boolean(
        address &&
          usdtContractAddress &&
          escrowContractAddress &&
          isCorrectNetwork
      ),
      refetchInterval: false, // Disable automatic refetching
      staleTime: PERFORMANCE_CONFIG.CACHE_DURATION / 2,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  });

  // balance refresh function
  const refreshBalances = useCallback(async () => {
    if (!isConnected || !address || !isCorrectNetwork || isRefreshing) return;

    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshRef.current;

    // Throttling to prevent excessive calls (minimum 2 seconds between refreshes)
    if (timeSinceLastRefresh < 2000) {
      return;
    }

    setIsRefreshing(true);
    lastRefreshRef.current = now;

    try {
      const promises = [
        refetchUSDTBalance(),
        refetchAvaxBalance(),
        refetchAllowance(),
      ].filter(Boolean);

      await Promise.allSettled(promises);
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

  // Auto-refresh balances
  useEffect(() => {
    if (!isConnected || !address || !isCorrectNetwork) {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
        autoRefreshIntervalRef.current = undefined;
      }
      return;
    }

    // Clear existing interval
    if (autoRefreshIntervalRef.current) {
      clearInterval(autoRefreshIntervalRef.current);
    }

    autoRefreshIntervalRef.current = setInterval(() => {
      if (!isLoadingUSDT && !isRefreshing) {
        refreshBalances();
      }
    }, 300000); // 5 minutes

    return () => {
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
        autoRefreshIntervalRef.current = undefined;
      }
    };
  }, [isConnected, address, isCorrectNetwork]);

  const connectWallet = useCallback(async () => {
    try {
      const connector =
        connectors.find((c) => c.name === "MetaMask") || connectors[0];
      if (connector) {
        await connect({ connector });
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
    if (currentChainId === TARGET_CHAIN.id) {
      return;
    }

    setNetworkStatus("switching");

    try {
      await switchChain({ chainId: TARGET_CHAIN.id });
      // Status will be updated by the chain change effect
    } catch (error: any) {
      setNetworkStatus(
        currentChainId === TARGET_CHAIN.id ? "connected" : "wrong-network"
      );

      console.error("Failed to switch network:", error);

      if (
        error?.message?.includes("rejected") ||
        error?.message?.includes("denied")
      ) {
        showSnackbar("Network switch cancelled", "error");
      } else {
        showSnackbar(`Failed to switch to ${TARGET_CHAIN.name}`, "error");
      }
      throw error;
    }
  }, [switchChain, currentChainId, showSnackbar]);

  const getUSDTBalance = useCallback(async (): Promise<string> => {
    try {
      const result = await refetchUSDTBalance();
      if (result.data && usdtDecimals !== undefined) {
        const balanceBigInt = result.data as bigint;
        const decimals = Number(usdtDecimals);

        const formattedBalance = formatUnits(balanceBigInt, decimals);
        const numericBalance = parseFloat(formattedBalance);

        return numericBalance.toLocaleString("en-US", {
          minimumFractionDigits: 0,
          maximumFractionDigits: Math.min(decimals, 6),
        });
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
        celo: formatPrice(
          convertPrice(numericBalance, "USDT", "NATIVE"),
          "NATIVE"
        ),
        fiat: formatPrice(convertPrice(numericBalance, "USDT", "FIAT"), "FIAT"),
      };
    } catch (error) {
      console.error("Error formatting USDT balance:", error);
      return undefined;
    }
  }, [usdtBalance, usdtError, usdtDecimals, convertPrice, formatPrice]);

  // Update wallet state
  useEffect(() => {
    setWallet((prev) => {
      const newWallet = {
        ...prev,
        isConnected,
        address,
        chainId: currentChainId,
        balance: avaxBalance
          ? formatUnits(avaxBalance.value, avaxBalance.decimals)
          : undefined,
        error: connectError?.message || usdtError?.message,
        isConnecting: isConnecting || isLoadingUSDT || isSwitchingChain,
        usdtBalance: convertedUSDTBalances,
      };

      // Only update if values actually changed
      if (JSON.stringify(prev) !== JSON.stringify(newWallet)) {
        return newWallet;
      }
      return prev;
    });
  }, [
    isConnected,
    address,
    currentChainId,
    avaxBalance,
    connectError,
    usdtError,
    isConnecting,
    isLoadingUSDT,
    isSwitchingChain,
    convertedUSDTBalances,
  ]);

  useEffect(() => {
    return () => {
      if (networkStatusRef.current) {
        clearTimeout(networkStatusRef.current);
      }
      if (autoRefreshIntervalRef.current) {
        clearInterval(autoRefreshIntervalRef.current);
      }
    };
  }, []);

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

  // fee estimation function
  const estimateCrossChainFees = useCallback(
    async (
      destinationChainSelector: string,
      payFeesIn: 0 | 1
    ): Promise<bigint> => {
      if (!escrowContractAddress) {
        throw new Error("Escrow contract not available");
      }

      try {
        const fees = await readContract(wagmiConfig, {
          address: escrowContractAddress,
          abi: Dezentra_ABI,
          functionName: "getFee",
          args: [
            BigInt(destinationChainSelector),
            payFeesIn === 0 ? false : true,
          ],
        });

        return fees as bigint;
      } catch (error) {
        console.warn("Fee estimation failed, using default:", error);
        return parseUnits("0.01", 18);
      }
    },
    [escrowContractAddress]
  );

  // unified buy trade
  const buyTrade = useCallback(
    async (params: UnifiedBuyTradeParams): Promise<PaymentTransaction> => {
      if (!address || !currentChainId) {
        throw new Error("Wallet not connected");
      }

      if (!isCorrectNetwork) {
        throw new Error("Please switch to the correct network first");
      }

      if (!escrowContractAddress || !usdtContractAddress) {
        throw new Error("Contracts not available on this network");
      }

      const isLocalPurchase = !params.crossChain;

      try {
        const tradeId = BigInt(params.tradeId);
        const quantity = BigInt(params.quantity);
        const logisticsProvider = params.logisticsProvider as `0x${string}`;

        // Validate logistics provider address
        if (
          !logisticsProvider?.startsWith("0x") ||
          logisticsProvider.length !== 42
        ) {
          throw new Error("Invalid logistics provider address");
        }

        // Get trade details and calculate amounts
        const tradeDetails = await getTrade(params.tradeId);
        const productCost = tradeDetails.productCost as bigint;
        const totalProductCost = productCost * quantity;

        const buyerToken = usdtContractAddress;
        const buyerTokenAmount = totalProductCost;
        const totalAmountInUSDT = totalProductCost;

        let gasEstimate: bigint;
        let hash: `0x${string}`;

        if (isLocalPurchase) {
          // Local purchase
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
            console.warn(
              "Gas estimation failed, using default:",
              estimateError
            );
            gasEstimate = GAS_LIMITS.BUY_TRADE;
          }

          hash = await writeContractAsync({
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
        } else {
          // Cross-chain purchase
          if (!params.crossChain) {
            throw new Error(
              "Cross-chain parameters are required for cross-chain purchase"
            );
          }

          const {
            destinationChainSelector,
            destinationContract,
            payFeesIn = 1,
          } = params.crossChain;

          const destChainSelector = BigInt(destinationChainSelector);
          const destContract = destinationContract as `0x${string}`;

          // Validate destination contract address
          if (!destContract?.startsWith("0x") || destContract.length !== 42) {
            throw new Error("Invalid destination contract address");
          }

          // Estimate cross-chain fees
          let crossChainFees: bigint;
          try {
            crossChainFees = await estimateCrossChainFees(
              destinationChainSelector,
              payFeesIn
            );
          } catch (error) {
            console.warn("Cross-chain fee estimation failed:", error);
            crossChainFees = parseUnits("0.01", 18);
          }

          // Gas estimation for cross-chain transaction
          try {
            const { request } = await simulateContract(wagmiConfig, {
              address: escrowContractAddress,
              abi: Dezentra_ABI,
              functionName: "buyCrossChainTrade",
              args: [
                destChainSelector,
                destContract,
                tradeId,
                quantity,
                logisticsProvider,
                buyerToken,
                buyerTokenAmount,
                totalAmountInUSDT,
                payFeesIn,
              ],
              account: address,
              value: payFeesIn === 1 ? crossChainFees : 0n,
            });

            gasEstimate = request.gas
              ? (request.gas * BigInt(130)) / BigInt(100)
              : GAS_LIMITS.BUY_TRADE * BigInt(2);
          } catch (estimateError) {
            console.warn(
              "Cross-chain gas estimation failed, using default:",
              estimateError
            );
            gasEstimate = GAS_LIMITS.BUY_TRADE * BigInt(2);
          }

          hash = await writeContractAsync({
            address: escrowContractAddress,
            abi: Dezentra_ABI,
            functionName: "buyCrossChainTrade",
            args: [
              destChainSelector,
              destContract,
              tradeId,
              quantity,
              logisticsProvider,
              buyerToken,
              buyerTokenAmount,
              totalAmountInUSDT,
              payFeesIn,
            ],
            gas: gasEstimate,
            value: payFeesIn === 1 ? crossChainFees : 0n,
          });
        }

        if (!hash) {
          throw new Error("Transaction failed to execute");
        }

        // Wait for transaction receipt
        const receipt = await waitForTransactionReceipt(wagmiConfig, {
          hash,
          timeout: isLocalPurchase ? 60000 : 120000,
        });

        // Parse events for purchase ID and cross-chain message ID
        let purchaseId: string | undefined;
        let messageId: string | undefined;

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

            if (!isLocalPurchase) {
              const messageSentEvent = decodedLogs.find(
                (event: any) => event?.eventName === "MessageSent"
              );

              if (messageSentEvent?.args) {
                const args = messageSentEvent.args as any;
                messageId = args.messageId;
              }
            }
          } catch (error) {
            console.warn("Failed to decode event logs:", error);
          }
        }

        const successMessage = isLocalPurchase
          ? "Purchase successful!"
          : "Cross-chain purchase initiated! Your transaction is being processed.";

        showSnackbar(successMessage, "success");

        setTimeout(
          () => {
            refreshBalances();
          },
          isLocalPurchase ? 2000 : 5000
        );

        return {
          hash,
          amount: formatUnits(totalAmountInUSDT, Number(usdtDecimals || 6)),
          token: "USDT",
          to: escrowContractAddress,
          from: address,
          status: "pending",
          timestamp: Date.now(),
          purchaseId,
          messageId,
          crossChain: !isLocalPurchase,
        };
      } catch (error: any) {
        console.error("Buy trade failed:", error);

        const errorMessage = error?.message || error?.toString() || "";

        if (errorMessage.includes("InsufficientFeeTokenAmount")) {
          throw new Error("Insufficient funds for cross-chain fees");
        }
        if (errorMessage.includes("SourceChainNotAllowlisted")) {
          throw new Error(
            "Cross-chain purchases not supported from this network"
          );
        }
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
        if (errorMessage.includes("InvalidLogisticsProvider")) {
          throw new Error("Invalid logistics provider selected");
        }
        if (errorMessage.includes("BuyerIsSeller")) {
          throw new Error("Cannot purchase your own product");
        }
        if (errorMessage.includes("User rejected")) {
          throw new Error("Transaction was rejected by user");
        }
        if (errorMessage.includes("gas")) {
          throw new Error(
            "Transaction failed due to gas issues. Please try again"
          );
        }

        const errorPrefix = isLocalPurchase
          ? "Purchase failed"
          : "Cross-chain purchase failed";

        throw new Error(`${errorPrefix}. Please try again.`);
      }
    },
    [
      address,
      currentChainId,
      isCorrectNetwork,
      escrowContractAddress,
      usdtContractAddress,
      writeContractAsync,
      getTrade,
      usdtDecimals,
      refreshBalances,
      estimateCrossChainFees,
      showSnackbar,
    ]
  );

  const validateTradeBeforePurchase = useCallback(
    async (
      tradeId: string,
      quantity: string,
      logisticsProvider: string
    ): Promise<boolean> => {
      if (!address || !currentChainId) {
        console.warn("Wallet not connected for trade validation");
        return false;
      }

      if (!escrowContractAddress) {
        console.warn("Escrow contract not available on this network");
        return false;
      }

      try {
        const tradeDetails = await getTrade(tradeId);

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
    [address, currentChainId, escrowContractAddress, getTrade]
  );

  const getCurrentAllowance = useCallback(async (): Promise<number> => {
    if (!address || !currentChainId || !usdtContractAddress) {
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
  }, [
    address,
    currentChainId,
    usdtContractAddress,
    refetchAllowance,
    usdtDecimals,
  ]);

  const approveUSDT = useCallback(
    async (amount: string): Promise<string> => {
      if (!address || !currentChainId) {
        throw new Error("Wallet not connected");
      }

      if (!usdtContractAddress || !escrowContractAddress) {
        throw new Error("Contracts not available on this network");
      }

      try {
        const currentAllowance = await getCurrentAllowance();
        const requiredAmount = parseFloat(amount);

        if (currentAllowance >= requiredAmount) {
          return "0x0";
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
      currentChainId,
      usdtContractAddress,
      escrowContractAddress,
      writeContractAsync,
      getCurrentAllowance,
      refetchAllowance,
    ]
  );

  const sendPayment = useCallback(
    async (params: PaymentParams): Promise<PaymentTransaction> => {
      if (!address || !currentChainId) {
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
      currentChainId,
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
    estimateCrossChainFees,
    isCorrectNetwork,
    chain: currentChain,
    chainId: currentChainId,
    networkStatus,
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
