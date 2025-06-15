import { useState, useEffect, useCallback } from "react";
import { useWeb3 } from "../../context/Web3Context";

interface UseWalletBalanceReturn {
  usdtBalance: string;
  celoBalance: string;
  isLoading: boolean;
  refetch: () => Promise<void>;
}

export const useWalletBalance = (): UseWalletBalanceReturn => {
  const { wallet, getUSDTBalance } = useWeb3();
  const [usdtBalance, setUsdtBalance] = useState("0");
  const [isLoading, setIsLoading] = useState(false);

  const fetchBalances = useCallback(async () => {
    if (!wallet.isConnected) return;

    setIsLoading(true);
    try {
      const balance = await getUSDTBalance();
      setUsdtBalance(balance);
    } catch (error) {
      console.error("Failed to fetch balances:", error);
      setUsdtBalance("0");
    } finally {
      setIsLoading(false);
    }
  }, [wallet.isConnected, getUSDTBalance]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  return {
    usdtBalance,
    celoBalance: wallet.balance || "0",
    isLoading,
    refetch: fetchBalances,
  };
};
