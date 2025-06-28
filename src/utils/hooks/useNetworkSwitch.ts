import { useCallback, useState, useRef, useEffect } from "react";
import { useSwitchChain } from "wagmi";
import { useWeb3 } from "../../context/Web3Context";
import {
  SUPPORTED_CHAINS,
  getChainMetadata,
} from "../../utils/config/web3.config";

interface UseNetworkSwitchOptions {
  targetChainId?: number;
  onSuccess?: (chainId: number) => void;
  onError?: (error: Error) => void;
}

export const useNetworkSwitch = (options: UseNetworkSwitchOptions = {}) => {
  const { wallet, chainId } = useWeb3();
  const { switchChain, isPending: isWagmiSwitching } = useSwitchChain();
  const [isSwitching, setIsSwitching] = useState(false);
  const switchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const abortControllerRef = useRef<AbortController | undefined>(undefined);

  const switchNetwork = useCallback(
    async (targetChainId?: number) => {
      const targetId = targetChainId || options.targetChainId;

      if (!wallet.isConnected) {
        const error = new Error("Wallet not connected");
        options.onError?.(error);
        throw error;
      }

      if (isSwitching || isWagmiSwitching) {
        return {
          success: false,
          error: new Error("Switch already in progress"),
        };
      }

      if (!targetId) {
        const error = new Error("No target chain ID specified");
        options.onError?.(error);
        throw error;
      }

      if (chainId === targetId) {
        options.onSuccess?.(targetId);
        return { success: true, error: null };
      }

      // Cancel any previous switch attempt
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      setIsSwitching(true);

      // Clear any existing timeout
      if (switchTimeoutRef.current) {
        clearTimeout(switchTimeoutRef.current);
      }

      // Set timeout for switch operation with cleanup
      switchTimeoutRef.current = setTimeout(() => {
        if (!signal.aborted) {
          setIsSwitching(false);
          abortControllerRef.current?.abort();
          const timeoutError = new Error("Network switch timed out");
          options.onError?.(timeoutError);
        }
      }, 30000); // 30 second timeout

      try {
        // Check if operation was aborted
        if (signal.aborted) {
          throw new Error("Operation was cancelled");
        }

        // connection check before switch
        if (!window.ethereum || !window.ethereum.isConnected?.()) {
          throw new Error("Wallet connection lost. Please reconnect.");
        }

        await switchChain({ chainId: targetId });

        // Check if operation was aborted after switch
        if (signal.aborted) {
          throw new Error("Operation was cancelled");
        }

        // Clear timeout on success
        if (switchTimeoutRef.current) {
          clearTimeout(switchTimeoutRef.current);
        }

        options.onSuccess?.(targetId);
        return { success: true, error: null };
      } catch (error: any) {
        // Clear timeout on error
        if (switchTimeoutRef.current) {
          clearTimeout(switchTimeoutRef.current);
        }

        if (signal.aborted) {
          return { success: false, error: new Error("Operation cancelled") };
        }

        console.error("Network switch failed:", error);

        let errorMessage = "Failed to switch network";

        if (error?.message) {
          const msg = error.message.toLowerCase();
          if (
            msg.includes("user rejected") ||
            msg.includes("rejected") ||
            msg.includes("cancelled") ||
            msg.includes("user denied")
          ) {
            errorMessage = "Network switch cancelled by user";
          } else if (
            msg.includes("unsupported") ||
            msg.includes("unrecognized")
          ) {
            errorMessage = "Network not supported by your wallet";
          } else if (msg.includes("timeout")) {
            errorMessage = "Network switch timed out";
          } else if (
            msg.includes("scheme does not have a registered handler")
          ) {
            errorMessage = "Wallet connection issue detected";
          } else if (
            msg.includes("resource unavailable") ||
            msg.includes("network error")
          ) {
            errorMessage = "Network temporarily unavailable";
          } else if (msg.includes("connection lost")) {
            errorMessage = "Wallet connection lost";
          }
        }

        const errorObj = new Error(errorMessage);
        options.onError?.(errorObj);
        throw errorObj;
      } finally {
        setIsSwitching(false);
        abortControllerRef.current = undefined;
      }
    },
    [
      wallet.isConnected,
      chainId,
      isSwitching,
      isWagmiSwitching,
      options,
      switchChain,
    ]
  );

  const isOnTargetNetwork = useCallback(
    (targetChainId?: number) => {
      const targetId = targetChainId || options.targetChainId;
      return chainId === targetId;
    },
    [chainId, options.targetChainId]
  );

  const isOnSupportedNetwork = useCallback(() => {
    return chainId
      ? SUPPORTED_CHAINS.some((chain) => chain.id === chainId)
      : false;
  }, [chainId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (switchTimeoutRef.current) {
        clearTimeout(switchTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Reset switching state if wallet disconnects
  useEffect(() => {
    if (!wallet.isConnected && isSwitching) {
      setIsSwitching(false);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    }
  }, [wallet.isConnected, isSwitching]);

  return {
    switchNetwork,
    isSwitching: isSwitching || isWagmiSwitching,
    isOnTargetNetwork,
    isOnSupportedNetwork,
    currentChainId: chainId,
    isConnected: wallet.isConnected,
  };
};
