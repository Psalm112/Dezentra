import { useMemo } from "react";
import { useWeb3 } from "../../context/Web3Context";
import { TARGET_CHAIN } from "../config/web3.config";

export const useNetworkStatus = () => {
  const { chainId, isCorrectNetwork, wallet, networkStatus } = useWeb3();

  return useMemo(
    () => ({
      chainId,
      isCorrectNetwork,
      isConnected: wallet.isConnected,
      networkStatus,
      needsSwitch: wallet.isConnected && !isCorrectNetwork,
      targetChain: TARGET_CHAIN,
      canInteract:
        wallet.isConnected && isCorrectNetwork && networkStatus === "connected",
    }),
    [chainId, isCorrectNetwork, wallet.isConnected, networkStatus]
  );
};
