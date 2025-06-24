import { useCallback, useMemo } from "react";
import { useWriteContract, useReadContract } from "wagmi";
import { useWeb3 } from "../../context/Web3Context";
import { Dezentra_ABI } from "../abi/dezenmartAbi.json";
import { 
  ESCROW_ADDRESSES, 
  CCIP_CHAIN_SELECTORS,
  CHAIN_METADATA,
  getDestinationChains,
  getCrossChainFee,
  GAS_LIMITS,
  isCrossChainSupported 
} from "../config/web3.config";
import { useSnackbar } from "../../context/SnackbarContext";
import { parseUnits, formatUnits } from "viem";
interface ContractResult {
success: boolean;
message?: string;
hash?: string;
data?: any;
}
interface CreateTradeParams {
productCost: string;
logisticsProvidersList: string[];
logisticsCosts: string[];
totalQuantity: string;
destinationChainId?: number; // For cross-chain trades
}
interface CrossChainBuyParams {
tradeId: string;
quantity: string;
logisticsProvider: string;
destinationChainId: number;
}
interface DestinationChain {
id: number;
name: string;
shortName: string;
icon: string;
color: string;
selector: string;
estimatedFee: string;
}
export const useSmartContract = () => {
const { wallet, switchToCorrectNetwork, isCorrectNetwork } = useWeb3();
const { writeContractAsync } = useWriteContract();
const { showSnackbar } = useSnackbar();
// Get current escrow address
const getEscrowAddress = useCallback(() => {
if (!wallet.chainId) {
throw new Error("Wallet not connected");
}
const escrowAddress = ESCROW_ADDRESSES[wallet.chainId as keyof typeof ESCROW_ADDRESSES];
if (!escrowAddress) {
  throw new Error("Escrow contract not available on this network");
}

return escrowAddress as `0x${string}`;
}, [wallet.chainId]);
// Get available destination chains for cross-chain operations
const getAvailableDestinationChains = useCallback((): DestinationChain[] => {
if (!wallet.chainId) return [];
const destinationChains = getDestinationChains(wallet.chainId);

return destinationChains.map(chain => {
  const metadata = CHAIN_METADATA[chain.id as keyof typeof CHAIN_METADATA];
  const selector = CCIP_CHAIN_SELECTORS[chain.id as keyof typeof CCIP_CHAIN_SELECTORS];
  const estimatedFee = getCrossChainFee(wallet.chainId!, chain.id);

  return {
    id: chain.id,
    name: metadata.name,
    shortName: metadata.shortName,
    icon: metadata.icon,
    color: metadata.color,
    selector,
    estimatedFee: formatUnits(BigInt(estimatedFee), 18),
  };
}).filter(chain => chain.selector); // Only include chains with valid selectors
}, [wallet.chainId]);
// Create a new trade (same-chain or cross-chain)
const createTrade = useCallback(
async (params: CreateTradeParams): Promise<ContractResult> => {
try {
if (!wallet.isConnected || !wallet.address) {
return {
success: false,
message: "Please connect your wallet first",
};
}
    if (!isCorrectNetwork) {
      try {
        await switchToCorrectNetwork();
        await new Promise((resolve) => setTimeout(resolve, 1500));
      } catch (error) {
        return {
          success: false,
          message: "Please switch to the correct network first",
        };
      }
    }

    const escrowAddress = getEscrowAddress();
    
    // Validate inputs
    if (!params.logisticsProvidersList.length || !params.logisticsCosts.length) {
      return {
        success: false,
        message: "At least one logistics provider is required",
      };
    }

    if (params.logisticsProvidersList.length !== params.logisticsCosts.length) {
      return {
        success: false,
        message: "Logistics providers and costs arrays must have same length",
      };
    }

    // Convert to contract format
    const productCost = parseUnits(params.productCost, 6); // Assuming USDT decimals
    const logisticsCosts = params.logisticsCosts.map(cost => parseUnits(cost, 6));
    const totalQuantity = BigInt(params.totalQuantity);
    const logisticsProviders = params.logisticsProvidersList as `0x${string}`[];

    showSnackbar("Creating trade...", "info");

    let hash: string;
    let gasLimit = GAS_LIMITS.CREATE_TRADE;

    // Check if this is a cross-chain trade
    if (params.destinationChainId && params.destinationChainId !== wallet.chainId) {
      // Cross-chain trade creation
      const destinationChainSelector = CCIP_CHAIN_SELECTORS[params.destinationChainId as keyof typeof CCIP_CHAIN_SELECTORS];
      if (!destinationChainSelector) {
        return {
          success: false,
          message: "Destination chain not supported for cross-chain operations",
        };
      }

      const crossChainFee = getCrossChainFee(wallet.chainId!, params.destinationChainId);
      gasLimit = GAS_LIMITS.BUY_TRADE_CROSS_CHAIN;

      hash = await writeContractAsync({
        address: escrowAddress,
        abi: Dezentra_ABI,
        functionName: "createCrossChainTrade",
        args: [
          destinationChainSelector,
          productCost,
          logisticsProviders,
          logisticsCosts,
          totalQuantity,
        ],
        value: BigInt(crossChainFee),
        gas: gasLimit,
      });
    } else {
      // Same-chain trade creation
      hash = await writeContractAsync({
        address: escrowAddress,
        abi: Dezentra_ABI,
        functionName: "createTrade",
        args: [productCost, logisticsProviders, logisticsCosts, totalQuantity],
        gas: gasLimit,
      });
    }

    return {
      success: true,
      message: "Trade created successfully",
      hash,
    };
  } catch (error: any) {
    console.error("Create trade error:", error);

    let errorMessage = "Failed to create trade. Please try again.";

    if (error.message?.includes("NoLogisticsProviders")) {
      errorMessage = "At least one logistics provider is required.";
    } else if (error.message?.includes("MismatchedArrays")) {
      errorMessage = "Logistics providers and costs must have the same length.";
    } else if (error.message?.includes("InvalidQuantity")) {
      errorMessage = "Invalid quantity. Must be greater than 0.";
    } else if (error.message?.includes("User rejected")) {
      errorMessage = "Transaction was cancelled by user.";
    } else if (error.message?.includes("insufficient funds")) {
      errorMessage = "Insufficient funds for gas fees and cross-chain costs.";
    } else if (error.message?.includes("InsufficientUSDTBalance")) {
      errorMessage = "Insufficient USDT balance for trade creation.";
    }

    return { success: false, message: errorMessage };
  }
},
[
  wallet.isConnected,
  wallet.address,
  wallet.chainId,
  isCorrectNetwork,
  switchToCorrectNetwork,
  getEscrowAddress,
  writeContractAsync,
  showSnackbar,
]
);
// Buy trade cross-chain
const buyCrossChainTrade = useCallback(
async (params: CrossChainBuyParams): Promise<ContractResult> => {
try {
if (!wallet.isConnected || !wallet.address) {
return {
success: false,
message: "Please connect your wallet first",
};
}
    if (!isCorrectNetwork) {
      try {
        await switchToCorrectNetwork();
        await new Promise((resolve) => setTimeout(resolve, 1500));
      } catch (error) {
        return {
          success: false,
          message: "Please switch to the correct network first",
        };
      }
    }

    if (!isCrossChainSupported(wallet.chainId!, params.destinationChainId)) {
      return {
        success: false,
        message: "Cross-chain operation not supported between these networks",
      };
    }

    const escrowAddress = getEscrowAddress();
    const destinationChainSelector = CCIP_CHAIN_SELECTORS[params.destinationChainId as keyof typeof CCIP_CHAIN_SELECTORS];
    
    if (!destinationChainSelector) {
      return {
        success: false,
        message: "Invalid destination chain",
      };
    }

    const crossChainFee = getCrossChainFee(wallet.chainId!, params.destinationChainId);
    
    showSnackbar("Processing cross-chain purchase...", "info");

    const hash = await writeContractAsync({
      address: escrowAddress,
      abi: Dezentra_ABI,
      functionName: "buyCrossChainTrade",
      args: [
        destinationChainSelector,
        BigInt(params.tradeId),
        BigInt(params.quantity),
        params.logisticsProvider as `0x${string}`,
      ],
      value: BigInt(crossChainFee),
      gas: GAS_LIMITS.BUY_TRADE_CROSS_CHAIN,
    });

    return {
      success: true,
      message: "Cross-chain purchase initiated successfully",
      hash,
    };
  } catch (error: any) {
    console.error("Cross-chain buy trade error:", error);

    let errorMessage = "Cross-chain purchase failed. Please try again.";

    if (error.message?.includes("InsufficientUSDTBalance")) {
      errorMessage = "Insufficient USDT balance for this purchase.";
    } else if (error.message?.includes("InsufficientUSDTAllowance")) {
      errorMessage = "USDT allowance insufficient. Please approve the amount first.";
    } else if (error.message?.includes("InvalidTradeId")) {
      errorMessage = "Trade not found on destination chain.";
    } else if (error.message?.includes("InsufficientQuantity")) {
      errorMessage = "Requested quantity exceeds available stock.";
    } else if (error.message?.includes("User rejected")) {
      errorMessage = "Transaction was cancelled by user.";
    } else if (error.message?.includes("insufficient funds")) {
      errorMessage = "Insufficient funds for gas and cross-chain fees.";
    }

    return { success: false, message: errorMessage };
  }
},
[
  wallet.isConnected,
  wallet.address,
  wallet.chainId,
  isCorrectNetwork,
  switchToCorrectNetwork,
  getEscrowAddress,
  writeContractAsync,
  showSnackbar,
]
);
// Confirm delivery (with cross-chain support)
const confirmDelivery = useCallback(
async (purchaseId: string, isLocalPurchase: boolean = true): Promise<ContractResult> => {
try {
if (!wallet.isConnected || !wallet.address) {
return {
success: false,
message: "Please connect your wallet first",
};
}
    if (!isCorrectNetwork) {
      try {
        await switchToCorrectNetwork();
        await new Promise((resolve) => setTimeout(resolve, 1500));
      } catch (error) {
        return {
          success: false,
          message: "Please switch to the correct network first",
        };
      }
    }

    const escrowAddress = getEscrowAddress();
    const purchaseIdBigInt = BigInt(purchaseId);

    showSnackbar("Confirming delivery...", "info");

    const functionName = isLocalPurchase ? "confirmDelivery" : "confirmCrossChainDelivery";
    
    const hash = await writeContractAsync({
      address: escrowAddress,
      abi: Dezentra_ABI,
      functionName,
      args: [purchaseIdBigInt],
      gas: GAS_LIMITS.CONFIRM_DELIVERY,
    });

    return {
      success: true,
      message: "Delivery confirmation submitted successfully",
      hash,
    };
  } catch (error: any) {
    console.error("Confirm delivery error:", error);

    let errorMessage = "Failed to confirm delivery. Please try again.";

    if (error.message?.includes("InvalidPurchaseId")) {
      errorMessage = "Invalid purchase ID. Please check and try again.";
    } else if (error.message?.includes("InvalidPurchaseState")) {
      errorMessage = "Purchase is not in the correct state for delivery confirmation.";
    } else if (error.message?.includes("NotAuthorized")) {
      errorMessage = "You are not authorized to confirm this delivery.";
    } else if (error.message?.includes("PurchaseNotFound")) {
      errorMessage = "Purchase not found. Please check the purchase ID.";
    } else if (error.message?.includes("User rejected")) {
      errorMessage = "Transaction was cancelled by user.";
    } else if (error.message?.includes("insufficient funds")) {
      errorMessage = "Insufficient funds for gas fees.";
    }

    return { success: false, message: errorMessage };
  }
},
[
  wallet.isConnected,
  wallet.address,
  isCorrectNetwork,
  switchToCorrectNetwork,
  getEscrowAddress,
  writeContractAsync,
  showSnackbar,
]
);
// Confirm purchase (with cross-chain support)
const confirmPurchase = useCallback(
async (purchaseId: string, isLocalPurchase: boolean = true): Promise<ContractResult> => {
try {
if (!wallet.isConnected || !wallet.address) {
return {
success: false,
message: "Please connect your wallet first",
};
}
    if (!isCorrectNetwork) {
      try {
        await switchToCorrectNetwork();
        await new Promise((resolve) => setTimeout(resolve, 1500));
      } catch (error) {
        return {
          success: false,
          message: "Please switch to the correct network first",
        };
      }
    }

    const escrowAddress = getEscrowAddress();
    const purchaseIdBigInt = BigInt(purchaseId);

    showSnackbar("Confirming purchase...", "info");

    const functionName = isLocalPurchase ? "confirmPurchase" : "confirmCrossChainPurchase";

    const hash = await writeContractAsync({
      address: escrowAddress,
      abi: Dezentra_ABI,
      functionName,
      args: [purchaseIdBigInt],
      gas: GAS_LIMITS.CONFIRM_PURCHASE,
    });

    return {
      success: true,
      message: "Purchase confirmation submitted successfully",
      hash,
    };
  } catch (error: any) {
    console.error("Confirm purchase error:", error);

    let errorMessage = "Failed to confirm purchase. Please try again.";

    if (error.message?.includes("InvalidPurchaseId")) {
      errorMessage = "Invalid purchase ID. Please check and try again.";
    } else if (error.message?.includes("InvalidPurchaseState")) {
      errorMessage = "Purchase is not in the correct state for confirmation.";
    } else if (error.message?.includes("NotAuthorized")) {
      errorMessage = "You are not authorized to confirm this purchase.";
    } else if (error.message?.includes("PurchaseNotFound")) {
      errorMessage = "Purchase not found. Please check the purchase ID.";
    } else if (error.message?.includes("User rejected")) {
      errorMessage = "Transaction was cancelled by user.";
    } else if (error.message?.includes("insufficient funds")) {
      errorMessage = "Insufficient funds for gas fees.";
    }

    return { success: false, message: errorMessage };
  }
},
[
  wallet.isConnected,
  wallet.address,
  isCorrectNetwork,
  switchToCorrectNetwork,
  getEscrowAddress,
  writeContractAsync,
  showSnackbar,
]
);
// Cancel purchase (with cross-chain support)
const cancelPurchase = useCallback(
async (purchaseId: string, isLocalPurchase: boolean = true): Promise<ContractResult> => {
try {
if (!wallet.isConnected || !wallet.address) {
return {
success: false,
message: "Please connect your wallet first",
};
}
    if (!isCorrectNetwork) {
      try {
        await switchToCorrectNetwork();
        await new Promise((resolve) => setTimeout(resolve, 1500));
      } catch (error) {
        return {
          success: false,
          message: "Please switch to the correct network first",
        };
      }
    }

    const escrowAddress = getEscrowAddress();
    const purchaseIdBigInt = BigInt(purchaseId);

    showSnackbar("Cancelling purchase...", "info");

    const functionName = isLocalPurchase ? "cancelPurchase" : "cancelCrossChainPurchase";

    const hash = await writeContractAsync({
      address: escrowAddress,
      abi: Dezentra_ABI,
      functionName,
      args: [purchaseIdBigInt],
      gas: GAS_LIMITS.CANCEL_PURCHASE,
    });

    return {
      success: true,
      message: "Purchase cancellation submitted successfully",
      hash,
    };
  } catch (error: any) {
    console.error("Cancel purchase error:", error);

    let errorMessage = "Failed to cancel purchase. Please try again.";

    if (error.message?.includes("InvalidPurchaseId")) {
      errorMessage = "Invalid purchase ID. Please check and try again.";
    } else if (error.message?.includes("InvalidPurchaseState")) {
      errorMessage = "Purchase cannot be cancelled in its current state.";
    } else if (error.message?.includes("NotAuthorized")) {
      errorMessage = "You are not authorized to cancel this purchase.";
    } else if (error.message?.includes("PurchaseNotFound")) {
      errorMessage = "Purchase not found. Please check the purchase ID.";
    } else if (error.message?.includes("User rejected")) {
      errorMessage = "Transaction was cancelled by user.";
    } else if (error.message?.includes("insufficient funds")) {
      errorMessage = "Insufficient funds for gas fees.";
    }

    return { success: false, message: errorMessage };
  }
},
[
  wallet.isConnected,
  wallet.address,
  isCorrectNetwork,
  switchToCorrectNetwork,
  getEscrowAddress,
  writeContractAsync,
  showSnackbar,
]
);
// Raise dispute (with cross-chain support)
const raiseDispute = useCallback(
async (purchaseId: string, isLocalPurchase: boolean = true): Promise<ContractResult> => {
try {
if (!wallet.isConnected || !wallet.address) {
return {
success: false,
message: "Please connect your wallet first",
};
}
    if (!isCorrectNetwork) {
      try {
        await switchToCorrectNetwork();
        await new Promise((resolve) => setTimeout(resolve, 1500));
      } catch (error) {
        return {
          success: false,
          message: "Please switch to the correct network first",
        };
      }
    }

    const escrowAddress = getEscrowAddress();
    const purchaseIdBigInt = BigInt(purchaseId);

    showSnackbar("Raising dispute...", "info");

    const functionName = isLocalPurchase ? "raiseDispute" : "raiseCrossChainDispute";

    const hash = await writeContractAsync({
      address: escrowAddress,
      abi: Dezentra_ABI,
      functionName,
      args: [purchaseIdBigInt],
      gas: GAS_LIMITS.RAISE_DISPUTE,
    });

    return {
      success: true,
      message: "Dispute raised successfully",
      hash,
    };
  } catch (error: any) {
    console.error("Raise dispute error:", error);

    let errorMessage = "Failed to raise dispute. Please try again.";

    if (error.message?.includes("InvalidPurchaseId")) {
      errorMessage = "Invalid purchase ID. Please check and try again.";
    } else if (error.message?.includes("InvalidPurchaseState")) {
      errorMessage = "Dispute cannot be raised for this purchase.";
    } else if (error.message?.includes("NotAuthorized")) {
      errorMessage = "You are not authorized to