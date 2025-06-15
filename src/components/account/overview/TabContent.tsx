import { LazyMotion, domAnimation, m } from "framer-motion";
import OrderHistoryItem from "./OrderHistoryItem";
import DisputeItem from "./DisputeItem";
import EmptyState from "./EmptyState";
import SavedItem from "./SavedItem";
import { TabType } from "../../../utils/types";
import ReferralsTab from "./referrals";
import React, {
  useEffect,
  useState,
  lazy,
  Suspense,
  useCallback,
  useRef,
} from "react";
import LoadingSpinner from "../../common/LoadingSpinner";
import { useOrderData } from "../../../utils/hooks/useOrder";
import { useWatchlist } from "../../../utils/hooks/useWatchlist";

const ProductContainer = lazy(() => import("./products/Container"));

interface TabContentProps {
  activeTab: TabType;
  milestones?: {
    sales: number;
    purchases: number;
  };
  referralCode?: string;
  referralCount?: number;
  points?: {
    total: number;
    available: number;
  };
}

const TabContent: React.FC<TabContentProps> = React.memo(({ activeTab }) => {
  const {
    fetchBuyerOrders,
    disputeOrders,
    nonDisputeOrders,
    loading: orderLoading,
    error: orderError,
  } = useOrderData();

  const {
    watchlistItems,
    fetchUserWatchlist,
    removeProductFromWatchlist,
    isLoading: watchlistLoading,
    error: watchlistError,
  } = useWatchlist();

  const [tabInitialized, setTabInitialized] = useState<Record<string, boolean>>(
    {}
  );
  const [retryCount, setRetryCount] = useState<Record<string, number>>({});
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // Initialize tab data with proper error handling and cleanup
  const initializeTab = useCallback(
    async (tabId: string) => {
      if (tabInitialized[tabId]) return;

      // Cleanup previous requests
      cleanup();
      abortControllerRef.current = new AbortController();

      try {
        let success = false;
        const maxRetries = 3;
        const currentRetry = retryCount[tabId] || 0;

        switch (tabId) {
          case "1":
            success = await fetchUserWatchlist(false, true);
            break;
          case "3":
          case "4":
            const orders = await fetchBuyerOrders(false, true);
            success = orders !== null;
            break;
          default:
            success = true;
        }

        if (success) {
          setTabInitialized((prev) => ({ ...prev, [tabId]: true }));
          setRetryCount((prev) => ({ ...prev, [tabId]: 0 }));
        } else if (currentRetry < maxRetries) {
          setTimeout(() => {
            setRetryCount((prev) => ({ ...prev, [tabId]: currentRetry + 1 }));
            setTabInitialized((prev) => ({ ...prev, [tabId]: false }));
          }, Math.pow(2, currentRetry) * 1000);
        }
      } catch (error) {
        console.error(`Failed to initialize tab ${tabId}:`, error);
        if (retryCount[tabId] < 3) {
          setTimeout(() => {
            setRetryCount((prev) => ({
              ...prev,
              [tabId]: (prev[tabId] || 0) + 1,
            }));
            setTabInitialized((prev) => ({ ...prev, [tabId]: false }));
          }, 2000);
        }
      }
    },
    [tabInitialized, retryCount, fetchUserWatchlist, fetchBuyerOrders, cleanup]
  );

  // Effect to handle tab changes
  useEffect(() => {
    if (["1", "3", "4"].includes(activeTab)) {
      initializeTab(activeTab);
    }

    return cleanup;
  }, [activeTab, initializeTab, cleanup]);

  // Reset initialization when component unmounts
  useEffect(() => {
    return () => {
      cleanup();
      setTabInitialized({});
      setRetryCount({});
    };
  }, [cleanup]);

  const handleRetryWatchlist = useCallback(() => {
    setTabInitialized((prev) => ({ ...prev, "1": false }));
    setRetryCount((prev) => ({ ...prev, "1": 0 }));
    initializeTab("1");
  }, [initializeTab]);

  const handleRetryOrders = useCallback(() => {
    const tabId = activeTab;
    setTabInitialized((prev) => ({ ...prev, [tabId]: false }));
    setRetryCount((prev) => ({ ...prev, [tabId]: 0 }));
    initializeTab(tabId);
  }, [activeTab, initializeTab]);

  // Enhanced loading state
  const isTabLoading = useCallback(
    (tabId: string) => {
      return (
        !tabInitialized[tabId] &&
        ((tabId === "1" && watchlistLoading) ||
          (["3", "4"].includes(tabId) && orderLoading))
      );
    },
    [tabInitialized, watchlistLoading, orderLoading]
  );

  return (
    <LazyMotion features={domAnimation}>
      {/* Watchlist Tab */}
      {activeTab === "1" && (
        <m.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.3 }}
        >
          {isTabLoading("1") && (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          )}

          {!isTabLoading("1") && watchlistError && (
            <div className="text-center py-8">
              <p className="text-Red mb-2">Error loading saved items</p>
              <p className="text-gray-400 text-sm mb-4">
                {retryCount["1"] > 0 && `Retry attempt ${retryCount["1"]}/3`}
              </p>
              <button
                onClick={handleRetryWatchlist}
                disabled={isTabLoading("1")}
                className="text-white underline hover:text-gray-300 disabled:opacity-50"
              >
                {isTabLoading("1") ? "Retrying..." : "Try Again"}
              </button>
            </div>
          )}

          {!isTabLoading("1") &&
            !watchlistError &&
            (!watchlistItems || watchlistItems.length === 0) && (
              <EmptyState
                message="Your wishlist is empty."
                buttonText="Browse Products"
                buttonPath="/product"
              />
            )}

          {!isTabLoading("1") &&
            !watchlistError &&
            watchlistItems &&
            watchlistItems.length > 0 && (
              <div className="mt-6 space-y-4">
                {watchlistItems
                  .filter((item) => item?.product?._id)
                  .map((item, index) => (
                    <SavedItem
                      key={`${item._id}-${item.product._id}`}
                      item={item}
                      index={index}
                      onRemove={removeProductFromWatchlist}
                    />
                  ))}
              </div>
            )}
        </m.div>
      )}

      {/* Referrals Tab */}
      {activeTab === "2" && (
        <m.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.3 }}
        >
          <ReferralsTab />
        </m.div>
      )}

      {/* Order History Tab */}
      {activeTab === "3" && (
        <m.div
          className="mt-6 space-y-4"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.3 }}
        >
          {isTabLoading("3") && (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          )}

          {!isTabLoading("3") && orderError && (
            <div className="text-center py-8">
              <p className="text-Red mb-2">Error loading orders</p>
              <p className="text-gray-400 text-sm mb-4">
                {retryCount["3"] > 0 && `Retry attempt ${retryCount["3"]}/3`}
              </p>
              <button
                onClick={handleRetryOrders}
                disabled={isTabLoading("3")}
                className="text-white underline hover:text-gray-300 disabled:opacity-50"
              >
                {isTabLoading("3") ? "Retrying..." : "Try Again"}
              </button>
            </div>
          )}

          {!isTabLoading("3") &&
            !orderError &&
            (!nonDisputeOrders || nonDisputeOrders.length === 0) && (
              <EmptyState
                message="You haven't placed any orders yet."
                buttonText="Browse Products"
                buttonPath="/product"
              />
            )}

          {!isTabLoading("3") &&
            !orderError &&
            nonDisputeOrders &&
            nonDisputeOrders.length > 0 && (
              <div className="space-y-4">
                {nonDisputeOrders
                  .filter((order) => order?._id && order?.product?._id)
                  .map((order, index) => (
                    <OrderHistoryItem
                      key={`order-${order._id}`}
                      {...order}
                      index={index}
                    />
                  ))}
              </div>
            )}
        </m.div>
      )}

      {/* Disputes Tab */}
      {activeTab === "4" && (
        <m.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.3 }}
        >
          {isTabLoading("4") && (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          )}

          {!isTabLoading("4") && orderError && (
            <div className="text-center py-8">
              <p className="text-Red mb-2">Error loading disputes</p>
              <p className="text-gray-400 text-sm mb-4">
                {retryCount["4"] > 0 && `Retry attempt ${retryCount["4"]}/3`}
              </p>
              <button
                onClick={handleRetryOrders}
                disabled={isTabLoading("4")}
                className="text-white underline hover:text-gray-300 disabled:opacity-50"
              >
                {isTabLoading("4") ? "Retrying..." : "Try Again"}
              </button>
            </div>
          )}

          {!isTabLoading("4") &&
            !orderError &&
            (!disputeOrders || disputeOrders.length === 0) && (
              <EmptyState
                message="You haven't raised any disputes yet."
                buttonText="View Orders"
                buttonPath="/account"
              />
            )}

          {!isTabLoading("4") &&
            !orderError &&
            disputeOrders &&
            disputeOrders.length > 0 && (
              <div className="mt-6 space-y-4">
                {disputeOrders
                  .filter((order) => order?._id && order?.product?._id)
                  .map((order) => (
                    <DisputeItem
                      key={`dispute-${order._id}`}
                      disputeStatus={
                        order.dispute?.resolved === false
                          ? "Under Review"
                          : "Resolved"
                      }
                      order={order}
                    />
                  ))}
              </div>
            )}
        </m.div>
      )}

      {/* Create Product Tab */}
      {activeTab === "5" && (
        <m.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.3 }}
        >
          <Suspense
            fallback={
              <div className="flex justify-center items-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            }
          >
            <ProductContainer />
          </Suspense>
        </m.div>
      )}
    </LazyMotion>
  );
});

TabContent.displayName = "TabContent";

export default TabContent;
