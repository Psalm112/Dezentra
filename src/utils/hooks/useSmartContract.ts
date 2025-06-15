import { useCallback } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useWeb3 } from "../../context/Web3Context";
import { DEZENMART_ABI } from "../abi/dezenmartAbi.json";
import { ESCROW_ADDRESSES } from "../config/web3.config";
import { useSnackbar } from "../../context/SnackbarContext";

interface ContractResult {
  success: boolean;
  message?: string;
  hash?: string;
}

export const useContract = () => {
  const { wallet, switchToCorrectNetwork, isCorrectNetwork } = useWeb3();
  const { writeContractAsync } = useWriteContract();
  const { showSnackbar } = useSnackbar();

  const getEscrowAddress = useCallback(() => {
    if (!wallet.chainId) {
      throw new Error("Wallet not connected");
    }

    const escrowAddress =
      ESCROW_ADDRESSES[wallet.chainId as keyof typeof ESCROW_ADDRESSES];
    if (!escrowAddress) {
      throw new Error("Escrow contract not available on this network");
    }

    return escrowAddress as `0x${string}`;
  }, [wallet.chainId]);

  const confirmDelivery = useCallback(
    async (purchaseId: string): Promise<ContractResult> => {
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

        const hash = await writeContractAsync({
          address: escrowAddress,
          abi: DEZENMART_ABI,
          functionName: "confirmDelivery",
          args: [purchaseIdBigInt],
        });

        return {
          success: true,
          message: "Delivery confirmation submitted successfully",
          hash,
        };
      } catch (error: any) {
        console.error("Confirm delivery error:", error);

        // Handle specific contract errors
        let errorMessage = "Failed to confirm delivery. Please try again.";

        if (error.message?.includes("InvalidPurchaseId")) {
          errorMessage = "Invalid purchase ID. Please check and try again.";
        } else if (error.message?.includes("InvalidPurchaseState")) {
          errorMessage =
            "Purchase is not in the correct state for delivery confirmation.";
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

  const confirmPurchase = useCallback(
    async (purchaseId: string): Promise<ContractResult> => {
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

        const hash = await writeContractAsync({
          address: escrowAddress,
          abi: DEZENMART_ABI,
          functionName: "confirmPurchase",
          args: [purchaseIdBigInt],
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
          errorMessage =
            "Purchase is not in the correct state for confirmation.";
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

  return {
    confirmDelivery,
    confirmPurchase,
    // raiseDispute,
  };
};
