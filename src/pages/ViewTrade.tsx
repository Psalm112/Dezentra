import { useState, useEffect, useCallback, useMemo, memo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Container from "../components/common/Container";
import Title from "../components/common/Title";
import { TradeTab } from "../utils/types";
import ProductListingSkeleton from "../components/trade/ProductListingSkeleton";
import ActiveTradeCard from "../components/trade/view/ActiveTradeCard";
import CompletedTradeCard from "../components/trade/view/CompletedTradeCard";
import Tab from "../components/trade/Tab";
import EmptyState from "../components/trade/view/EmptyState";
import { useNavigate } from "react-router-dom";
import { useOrderData } from "../utils/hooks/useOrder";
import { useWeb3 } from "../context/Web3Context";
import WalletConnectionModal from "../components/web3/WalletConnectionModal";

const ViewTrade = memo(() => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TradeTab>("active");
  const [isLoading, setIsLoading] = useState(true);
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const { wallet, chainId, isCorrectNetwork } = useWeb3();

  // Refs for cleanup
  const mountedRef = useRef(true);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const {
    activeTrades,
    completedTrades,
    fetchBuyerOrders,
    fetchMerchantOrders,
    loading: orderLoading,
  } = useOrderData({
    chainId,
    isConnected: wallet.isConnected && isCorrectNetwork,
  });

  // filtered trades
  const filteredActiveTrades = useMemo(() => {
    return activeTrades?.filter((trade) => trade && trade.product) || [];
  }, [activeTrades]);

  const filteredCompletedTrades = useMemo(() => {
    return completedTrades?.filter((trade) => trade && trade.product) || [];
  }, [completedTrades]);

  // handlers
  const handleTabChange = useCallback((tab: TradeTab) => {
    setActiveTab(tab);
  }, []);

  const handleTradeClick = useCallback(
    (tradeId: string) => {
      navigate(`/orders/${tradeId}`, { replace: false });
    },
    [navigate]
  );

  const handleCloseConnectionModal = useCallback(() => {
    setShowConnectionModal(false);
  }, []);

  // load orders function
  const loadOrders = useCallback(
    async (silent = false) => {
      if (!wallet.isConnected) return;

      try {
        if (!silent) {
          setIsLoading(true);
        }

        // Fetch both buyer and seller orders
        const [buyerResult, merchantResult] = await Promise.allSettled([
          fetchBuyerOrders(false, silent),
          fetchMerchantOrders(false, silent),
        ]);

        if (buyerResult.status === "rejected") {
          console.warn("Failed to fetch buyer orders:", buyerResult.reason);
        }
        if (merchantResult.status === "rejected") {
          console.warn(
            "Failed to fetch merchant orders:",
            merchantResult.reason
          );
        }
      } catch (error) {
        console.error("Failed to load orders:", error);
      } finally {
        if (!silent) {
          setTimeout(() => {
            setIsLoading(false);
          }, 600);
        }
      }
    },
    [wallet.isConnected, fetchBuyerOrders, fetchMerchantOrders]
  );

  // tab configuration
  const tabConfig = useMemo(
    () => [
      {
        text: "Active",
        isActive: activeTab === "active",
        onClick: () => handleTabChange("active"),
        count: filteredActiveTrades.length,
      },
      {
        text: "Completed",
        isActive: activeTab === "completed",
        onClick: () => handleTabChange("completed"),
        count: filteredCompletedTrades.length,
      },
    ],
    [
      activeTab,
      filteredActiveTrades.length,
      filteredCompletedTrades.length,
      handleTabChange,
    ]
  );

  // content based on active tab
  const tabContent = useMemo(() => {
    if (activeTab === "active") {
      return filteredActiveTrades.map((trade) => (
        <div
          key={trade._id}
          onClick={() => handleTradeClick(trade._id)}
          className="cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <ActiveTradeCard trade={trade} />
        </div>
      ));
    } else {
      return filteredCompletedTrades.map((trade) => (
        <div
          key={trade._id}
          onClick={() => handleTradeClick(trade._id)}
          className="cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <CompletedTradeCard trade={trade} />
        </div>
      ));
    }
  }, [
    activeTab,
    filteredActiveTrades,
    filteredCompletedTrades,
    handleTradeClick,
  ]);

  // Initial data fetch effect
  useEffect(() => {
    mountedRef.current = true;

    const initializeOrders = async () => {
      if (!wallet.isConnected) return;

      await loadOrders(false);

      if (mountedRef.current) {
        refreshIntervalRef.current = setInterval(() => {
          if (activeTab === "active") {
            loadOrders(true);
          }
        }, 30000);

        return () => {
          if (refreshIntervalRef.current) {
            clearInterval(refreshIntervalRef.current);
          }
        };
      }
    };

    initializeOrders();

    return () => {
      mountedRef.current = false;
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [wallet.isConnected, loadOrders, activeTab]);

  // Handle order loading state changes
  useEffect(() => {
    if (!orderLoading && wallet.isConnected) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [orderLoading, wallet.isConnected]);

  // Show wallet connection UI if not connected
  if (!wallet.isConnected && !wallet.isConnecting) {
    return (
      <div className="bg-Dark min-h-screen text-white">
        <Container>
          <WalletConnectionModal
            isOpen={showConnectionModal}
            onClose={handleCloseConnectionModal}
          />
        </Container>
      </div>
    );
  }

  return (
    <div className="bg-Dark min-h-screen text-white">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <Title text="View Trades" className="text-center my-8 text-3xl" />
        </motion.div>

        <div className="max-w-screen-lg mx-auto bg-[#212428] rounded-lg overflow-hidden">
          <div className="flex flex-wrap border-b border-[#292B30]">
            {tabConfig.map((tab) => (
              <Tab
                key={tab.text}
                text={tab.text}
                isActive={tab.isActive}
                onClick={tab.onClick}
                count={tab.count}
              />
            ))}
          </div>

          <div className="p-4">
            <AnimatePresence mode="wait">
              {isLoading ? (
                <ProductListingSkeleton key="loading" />
              ) : (
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {tabContent.length > 0 ? (
                    tabContent
                  ) : (
                    <EmptyState
                      title={
                        activeTab === "active"
                          ? "No Active Trades"
                          : "No Completed Trades"
                      }
                      message={
                        activeTab === "active"
                          ? "No active trades found"
                          : "No completed trades found"
                      }
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </Container>
    </div>
  );
});

ViewTrade.displayName = "ViewTrade";

export default ViewTrade;
