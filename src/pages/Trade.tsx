import {
  useState,
  useEffect,
  FC,
  Suspense,
  lazy,
  useCallback,
  useMemo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaExchangeAlt } from "react-icons/fa";
import Container from "../components/common/Container";
import Title from "../components/common/Title";
import BannerCarousel from "../components/common/BannerCarousel";
import { Pen, Pen2 } from ".";
import { Product, TradeTab } from "../utils/types";
import ProductListingSkeleton from "../components/trade/ProductListingSkeleton";
import Tab from "../components/trade/Tab";
import LazyFloatingButton from "../components/common/LazyFloatingButton";
import { useWeb3 } from "../context/Web3Context";
import WalletConnectionModal from "../components/web3/WalletConnectionModal";

// Lazy load components for better performance
const ProductCard = lazy(() => import("../components/trade/ProductCard"));
const IncomingOrderCard = lazy(
  () => import("../components/trade/IncomingOrderCard")
);

// Static data to prevent re-creation
const SAMPLE_PRODUCTS: Product[] = [
  {
    _id: "68082c3efae576e05502c04b",
    name: "Test Product",
    description: "Testing product endpoint",
    price: 20000,
    category: "Item",
    seller: "680821b06eda53ead327e0ea",
    images: [],
    isSponsored: false,
    isActive: true,
    createdAt: "2025-04-22T23:54:38.445Z",
    updatedAt: "2025-04-22T23:54:38.445Z",
    type: [],
    stock: 100,
    logisticsCost: [],
    logisticsProviders: [],
  },
  {
    _id: "68082f7a7d3f057ab0fafd5c",
    name: "Wood Carving",
    description: "Neat carved wood art works",
    price: 20000,
    category: "Art Work",
    seller: "680821b06eda53ead327e0ea",
    images: [
      "images-1745366906480-810449189.jpeg",
      "images-1745366906494-585992412.jpeg",
    ],
    isSponsored: false,
    isActive: true,
    createdAt: "2025-04-23T00:08:26.519Z",
    updatedAt: "2025-04-23T00:08:26.519Z",
    type: [],
    stock: 100,
    logisticsCost: [],
    logisticsProviders: [],
  },
];

const SAMPLE_INCOMING_ORDERS: Product[] = [
  {
    _id: "68082f7a7d3f057ab0fafd5c",
    name: "Wood Carving",
    description: "Neat carved wood art works",
    price: 20000,
    category: "Art Work",
    seller: "680821b06eda53ead327e0ea",
    images: [
      "images-1745366906480-810449189.jpeg",
      "images-1745366906494-585992412.jpeg",
    ],
    isSponsored: false,
    isActive: true,
    createdAt: "2025-04-23T00:08:26.519Z",
    updatedAt: "2025-04-23T00:08:26.519Z",
    type: [],
    stock: 100,
    logisticsCost: [],
    logisticsProviders: [],
  },
];

const BANNERS_DATA = [
  {
    title: "Smart Ecommerce for",
    subtitle: "creators",
    primaryImage: Pen,
    secondaryImage: Pen2,
    backgroundColor: "#ff3b3b",
    textColor: "white",
    isUppercase: true,
  },
  {
    title: "Special Offers for",
    subtitle: "new users",
    primaryImage: Pen,
    backgroundColor: "#ff3b3b",
    textColor: "white",
    isUppercase: true,
  },
  {
    title: "Smart Ecommerce for",
    subtitle: "creators",
    primaryImage: Pen,
    secondaryImage: Pen2,
    backgroundColor: "#ff3b3b",
    textColor: "white",
    isUppercase: true,
  },
  {
    title: "Special Offers for",
    subtitle: "new users",
    primaryImage: Pen,
    backgroundColor: "#ff3b3b",
    textColor: "white",
    isUppercase: true,
  },
  {
    title: "Smart Ecommerce for",
    subtitle: "creators",
    primaryImage: Pen,
    secondaryImage: Pen2,
    backgroundColor: "#ff3b3b",
    textColor: "white",
    isUppercase: true,
  },
  {
    title: "Special Offers for",
    subtitle: "new users",
    primaryImage: Pen,
    backgroundColor: "#ff3b3b",
    textColor: "white",
    isUppercase: true,
  },
  {
    title: "Smart Ecommerce for",
    subtitle: "creators",
    primaryImage: Pen,
    secondaryImage: Pen2,
    backgroundColor: "#ff3b3b",
    textColor: "white",
    isUppercase: true,
  },
  {
    title: "Special Offers for",
    subtitle: "new users",
    primaryImage: Pen,
    backgroundColor: "#ff3b3b",
    textColor: "white",
    isUppercase: true,
  },
] as const;

// Loading placeholder component
const ButtonPlaceholder: FC = () => (
  <motion.div
    className="fixed bottom-20 right-4 z-50 w-12 h-12 rounded-full bg-[#292B30]"
    animate={{ opacity: [0.5, 1, 0.5] }}
    transition={{ repeat: Infinity, duration: 1.5 }}
  />
);

const Trade = () => {
  const [activeTab, setActiveTab] = useState<TradeTab>("buy");
  const [isLoading, setIsLoading] = useState(true);
  const [isComponentMounted, setIsComponentMounted] = useState(false);
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const { wallet } = useWeb3();

  // products data
  const products = useMemo(() => SAMPLE_PRODUCTS, []);
  const incomingOrders = useMemo(() => SAMPLE_INCOMING_ORDERS, []);

  // Tab change handler
  const handleTabChange = useCallback((tab: TradeTab) => {
    setActiveTab(tab);
  }, []);

  // Order rejection handler
  const handleRejectOrder = useCallback((product: Product) => {
    console.log("Order rejected:", product);
    // Implement actual rejection logic here
  }, []);

  // Component mount and loading effect
  useEffect(() => {
    let mounted = true;

    setIsComponentMounted(true);

    const loadTimer = setTimeout(() => {
      if (mounted) {
        requestAnimationFrame(() => {
          setIsLoading(false);
        });
      }
    }, 600);

    return () => {
      mounted = false;
      clearTimeout(loadTimer);
      setIsComponentMounted(false);
    };
  }, []);

  // Clear wallet errors when component mounts
  // useEffect(() => {
  //   if (error) {
  //     clearError();
  //   }
  // }, [error, clearError]);

  // Show wallet connection UI if not connected
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
      <Container className="relative pb-20 md:pb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <Title text="P2P Trading" className="text-center my-8 text-3xl" />
        </motion.div>

        <BannerCarousel
          banners={[...BANNERS_DATA]}
          autoRotate={true}
          className="mb-8"
          rotationInterval={6000}
        />

        <div className="max-w-screen-lg mx-auto bg-[#212428] rounded-lg overflow-hidden">
          <div className="flex flex-wrap border-b border-[#292B30]">
            <Tab
              text="Buy"
              isActive={activeTab === "buy"}
              onClick={() => handleTabChange("buy")}
              count={products.length}
            />
            <Tab
              text="Sell"
              isActive={activeTab === "sell"}
              onClick={() => handleTabChange("sell")}
              count={incomingOrders.length}
            />
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
                  {activeTab === "buy" &&
                    products.map((product) => (
                      <Suspense
                        key={product._id}
                        fallback={
                          <div className="h-32 bg-[#292B30] rounded animate-pulse" />
                        }
                      >
                        <ProductCard
                          product={product}
                          actionType="buy"
                          isSellTab={false}
                        />
                      </Suspense>
                    ))}

                  {activeTab === "sell" &&
                    incomingOrders.map((order) => (
                      <Suspense
                        key={order._id}
                        fallback={
                          <div className="h-32 bg-[#292B30] rounded animate-pulse" />
                        }
                      >
                        <IncomingOrderCard
                          product={order}
                          onReject={() => handleRejectOrder(order)}
                        />
                      </Suspense>
                    ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </Container>

      {/* Floating action button */}
      {/* Floating action button */}
      {isComponentMounted && (
        <LazyFloatingButton
          icon={<FaExchangeAlt />}
          to="/trades/viewtrades"
          label="View Trades"
          position="bottom-right"
          color="primary"
        />
      )}
    </div>
  );
};

export default Trade;
