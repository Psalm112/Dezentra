import { useCallback } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import {
  readContract,
  simulateContract,
  waitForTransactionReceipt,
} from "@wagmi/core";
import { Dezentra_ABI } from "../abi/dezenmartAbi.json";
import {
  ESCROW_ADDRESSES,
  wagmiConfig,
  GAS_LIMITS,
} from "../config/web3.config";
import { useSnackbar } from "../../context/SnackbarContext";
import { parseWeb3Error } from "../errorParser";

interface ChainInfo {
  chainSelector: string;
  chainId: number;
  name: string;
}

interface SmartContractResult {
  hash: string;
  timestamp: number;
  status: "pending" | "success" | "failed";
}

export const useSmartContract = () => {
  const { address, chain } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { showSnackbar } = useSnackbar();

  const escrowContractAddress = ESCROW_ADDRESSES[
    chain?.id as keyof typeof ESCROW_ADDRESSES
  ] as `0x${string}` | undefined;

  // Confirm delivery function
  const confirmDelivery = useCallback(
    async (purchaseId: string): Promise<SmartContractResult> => {
      if (!address || !chain?.id) {
        throw new Error("Wallet not connected");
      }

      if (!escrowContractAddress) {
        throw new Error("Escrow contract not available on this network");
      }

      try {
        // Validate purchase exists and is in correct state
        const purchaseDetails = await readContract(wagmiConfig, {
          address: escrowContractAddress,
          abi: Dezentra_ABI,
          functionName: "purchases",
          args: [BigInt(purchaseId)],
        });

        if (!purchaseDetails || (purchaseDetails as any).purchaseId === 0n) {
          throw new Error("Purchase not found");
        }

        // Estimate gas
        let gasEstimate: bigint;
        try {
          const { request } = await simulateContract(wagmiConfig, {
            address: escrowContractAddress,
            abi: Dezentra_ABI,
            functionName: "confirmDelivery",
            args: [BigInt(purchaseId)],
            account: address,
          });
          gasEstimate = request.gas
            ? (request.gas * BigInt(120)) / BigInt(100)
            : GAS_LIMITS.CONFIRM_DELIVERY || BigInt(100000);
        } catch (estimateError) {
          console.warn("Gas estimation failed, using default:", estimateError);
          gasEstimate = GAS_LIMITS.CONFIRM_DELIVERY || BigInt(100000);
        }

        const hash = await writeContractAsync({
          address: escrowContractAddress,
          abi: Dezentra_ABI,
          functionName: "confirmDelivery",
          args: [BigInt(purchaseId)],
          gas: gasEstimate,
        });

        if (!hash) {
          throw new Error("Transaction failed to execute");
        }

        // Wait for confirmation
        await waitForTransactionReceipt(wagmiConfig, {
          hash,
          timeout: 60000,
        });

        showSnackbar("Delivery confirmed successfully!", "success");

        return {
          hash,
          timestamp: Date.now(),
          status: "success",
        };
      } catch (error: any) {
        console.error("Confirm delivery failed:", error);

        const errorMessage = error?.message || error?.toString() || "";

        if (errorMessage.includes("InvalidPurchaseId")) {
          throw new Error("Invalid purchase ID");
        }
        if (errorMessage.includes("InvalidPurchaseState")) {
          throw new Error(
            "Purchase is not in the correct state for delivery confirmation"
          );
        }
        if (errorMessage.includes("NotAuthorized")) {
          throw new Error("You are not authorized to confirm this delivery");
        }
        if (errorMessage.includes("User rejected")) {
          throw new Error("Transaction was rejected by user");
        }

        throw new Error(
          `Delivery confirmation failed: ${parseWeb3Error(error)}`
        );
      }
    },
    [
      address,
      chain?.id,
      escrowContractAddress,
      writeContractAsync,
      showSnackbar,
    ]
  );

  // Confirm purchase function
  const confirmPurchase = useCallback(
    async (purchaseId: string): Promise<SmartContractResult> => {
      if (!address || !chain?.id) {
        throw new Error("Wallet not connected");
      }

      if (!escrowContractAddress) {
        throw new Error("Escrow contract not available on this network");
      }

      try {
        // Validate purchase exists
        const purchaseDetails = await readContract(wagmiConfig, {
          address: escrowContractAddress,
          abi: Dezentra_ABI,
          functionName: "purchases",
          args: [BigInt(purchaseId)],
        });

        if (!purchaseDetails || (purchaseDetails as any).purchaseId === 0n) {
          throw new Error("Purchase not found");
        }

        // Estimate gas
        let gasEstimate: bigint;
        try {
          const { request } = await simulateContract(wagmiConfig, {
            address: escrowContractAddress,
            abi: Dezentra_ABI,
            functionName: "confirmPurchase",
            args: [BigInt(purchaseId)],
            account: address,
          });
          gasEstimate = request.gas
            ? (request.gas * BigInt(120)) / BigInt(100)
            : GAS_LIMITS.CONFIRM_PURCHASE || BigInt(80000);
        } catch (estimateError) {
          console.warn("Gas estimation failed, using default:", estimateError);
          gasEstimate = GAS_LIMITS.CONFIRM_PURCHASE || BigInt(80000);
        }

        const hash = await writeContractAsync({
          address: escrowContractAddress,
          abi: Dezentra_ABI,
          functionName: "confirmPurchase",
          args: [BigInt(purchaseId)],
          gas: gasEstimate,
        });

        if (!hash) {
          throw new Error("Transaction failed to execute");
        }

        // Wait for confirmation
        await waitForTransactionReceipt(wagmiConfig, {
          hash,
          timeout: 60000,
        });

        showSnackbar("Purchase confirmed successfully!", "success");

        return {
          hash,
          timestamp: Date.now(),
          status: "success",
        };
      } catch (error: any) {
        console.error("Confirm purchase failed:", error);

        const errorMessage = error?.message || error?.toString() || "";

        if (errorMessage.includes("InvalidPurchaseId")) {
          throw new Error("Invalid purchase ID");
        }
        if (errorMessage.includes("InvalidPurchaseState")) {
          throw new Error(
            "Purchase is not in the correct state for confirmation"
          );
        }
        if (errorMessage.includes("NotAuthorized")) {
          throw new Error("You are not authorized to confirm this purchase");
        }
        if (errorMessage.includes("User rejected")) {
          throw new Error("Transaction was rejected by user");
        }

        throw new Error(
          `Purchase confirmation failed: ${parseWeb3Error(error)}`
        );
      }
    },
    [
      address,
      chain?.id,
      escrowContractAddress,
      writeContractAsync,
      showSnackbar,
    ]
  );

  // Get supported chains function
  const {
    data: supportedChains,
    refetch: refetchSupportedChains,
    isLoading: isLoadingSupportedChains,
  } = useReadContract({
    address: escrowContractAddress,
    abi: Dezentra_ABI,
    functionName: "getAllowlistedChains",
    query: {
      enabled: !!escrowContractAddress,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchInterval: 10 * 60 * 1000, // 10 minutes
    },
  });

  const getSupportedChains = useCallback(async (): Promise<ChainInfo[]> => {
    try {
      const chains =
        supportedChains ||
        (await refetchSupportedChains().then((result) => result.data));

      if (!chains || !Array.isArray(chains)) {
        return [];
      }

      // Map chain selectors to readable chain info
      const chainMapping: Record<string, { chainId: number; name: string }> = {
        "16015286601757825753": { chainId: 43113, name: "Avalanche Fuji" },
        "10344971235874465080": { chainId: 84532, name: "Base Sepolia" },
        "16281711391670634445": { chainId: 11155111, name: "Ethereum Sepolia" },
        "3478487238524512106": { chainId: 421614, name: "Arbitrum Sepolia" },
      };

      return (chains as bigint[])
        .map((selector) => {
          const selectorStr = selector.toString();
          const chainInfo = chainMapping[selectorStr];

          if (chainInfo) {
            return {
              chainSelector: selectorStr,
              chainId: chainInfo.chainId,
              name: chainInfo.name,
            };
          }

          return {
            chainSelector: selectorStr,
            chainId: 0,
            name: `Unknown Chain (${selectorStr})`,
          };
        })
        .filter((chain) => chain.chainId !== 0);
    } catch (error) {
      console.error("Failed to fetch supported chains:", error);
      return [];
    }
  }, [supportedChains, refetchSupportedChains]);

  return {
    confirmDelivery,
    confirmPurchase,
    getSupportedChains,
    supportedChains,
    isLoadingSupportedChains,
    refetchSupportedChains,
  };
};
