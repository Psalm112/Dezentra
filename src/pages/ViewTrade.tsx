import { useState, useEffect, useCallback, useMemo } from "react";
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

const ViewTrade = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TradeTab>("active");
  const [isLoading, setIsLoading] = useState(true);
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const { wallet } = useWeb3();
  // const { clearError } = useWallet();
  // const { isConnected, isConnecting, error } = useWalletStatus();
  const {
    activeTrades,
    completedTrades,
    fetchBuyerOrders,
    fetchMerchantOrders,
    loading: orderLoading,
  } = useOrderData();

  const filteredActiveTrades = useMemo(() => {
    return activeTrades?.filter((trade) => trade && trade.product) || [];
  }, [activeTrades]);

  const filteredCompletedTrades = useMemo(() => {
    return completedTrades?.filter((trade) => trade && trade.product) || [];
  }, [completedTrades]);

  // Tab change handler
  const handleTabChange = useCallback((tab: TradeTab) => {
    setActiveTab(tab);
  }, []);

  const handleTradeClick = useCallback(
    (tradeId: string) => {
      navigate(`/orders/${tradeId}`, { replace: false });
    },
    [navigate]
  );

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

  // Initial data fetch effect
  useEffect(() => {
    let isMounted = true;

    const initializeOrders = async () => {
      if (!wallet.isConnected) return;

      await loadOrders(false);

      if (isMounted) {
        const refreshInterval = setInterval(() => {
          if (activeTab === "active") {
            loadOrders(true);
          }
        }, 30000);

        return () => clearInterval(refreshInterval);
      }
    };

    initializeOrders();

    return () => {
      isMounted = false;
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

  // Clear wallet errors when component mounts
  // useEffect(() => {
  //   if (error) {
  //     clearError();
  //   }
  // }, [error, clearError]);

  if (!wallet.isConnected && !wallet.isConnecting) {
    return (
      <div className="bg-Dark min-h-screen text-white">
        <Container>
          <WalletConnectionModal
            isOpen={showConnectionModal}
            onClose={() => setShowConnectionModal(false)}
          />
        </Container>
      </div>
    );
  }

  return (
    <div className="bg-Dark min-h-screen text-white relative">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <Title text="Trade" className="text-center my-8 text-3xl" />
        </motion.div>

        {/* Tab Navigation */}
        <div className="max-w-screen-lg mx-auto bg-[#212428] rounded-lg overflow-hidden">
          <div className="flex max-xxs:flex-wrap border-b border-[#292B30] bg-[#292B30] w-full items-center">
            <Tab
              text="Active Trades"
              isActive={activeTab === "active"}
              onClick={() => handleTabChange("active")}
              count={filteredActiveTrades.length}
              className="w-full"
            />
            <Tab
              text="Completed"
              isActive={activeTab === "completed"}
              onClick={() => handleTabChange("completed")}
              count={filteredCompletedTrades.length}
              className="w-full"
            />
          </div>

          {/* Content Area */}
          <div className="py-4">
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
                  {activeTab === "active" && (
                    <>
                      {filteredActiveTrades.length > 0 ? (
                        filteredActiveTrades.map((trade) => (
                          <div
                            key={trade._id}
                            onClick={() => handleTradeClick(trade._id)}
                            className="cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]"
                          >
                            <ActiveTradeCard trade={trade} />
                          </div>
                        ))
                      ) : (
                        <EmptyState
                          title="No Active Trades"
                          message="Once you start a trade, you'll see it here."
                        />
                      )}
                    </>
                  )}

                  {activeTab === "completed" && (
                    <>
                      {filteredCompletedTrades.length > 0 ? (
                        filteredCompletedTrades.map((trade) => (
                          <div
                            key={trade._id}
                            onClick={() => handleTradeClick(trade._id)}
                            className="cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]"
                          >
                            <CompletedTradeCard trade={trade} />
                          </div>
                        ))
                      ) : (
                        <EmptyState
                          title="No Completed Trades"
                          message="Your completed trades will appear here."
                        />
                      )}
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default ViewTrade;
