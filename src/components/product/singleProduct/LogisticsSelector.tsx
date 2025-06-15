import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiTruck, FiChevronDown, FiCheck } from "react-icons/fi";
import { useContract } from "../../../utils/hooks/useContract";

interface ApiResponse {
  status: string;
  data: string[];
}

export interface LogisticsProvider {
  id: string;
  name: string;
  walletAddress: string;
  cost: number;
  deliveryTime: string;
  rating?: number;
}

interface LogisticsSelectorProps {
  onSelect: (provider: LogisticsProvider) => void;
  logisticsCost: string[];
  logisticsProviders: string[];
  selectedProvider?: LogisticsProvider | null;
  selectedProviderWalletAddress?: string;
}

const COMPANY_PREFIXES = [
  "Swift",
  "Express",
  "Global",
  "Royal",
  "Premium",
  "Fast",
  "Reliable",
  "Elite",
  "Prime",
  "Rapid",
];

const COMPANY_SUFFIXES = [
  "Logistics",
  "Delivery",
  "Shipping",
  "Courier",
  "Transport",
  "Express",
  "Cargo",
  "Freight",
  "Distribution",
  "Movers",
];

const DELIVERY_TIMES = [
  "Same day",
  "1-2 days",
  "2-3 days",
  "3-5 days",
  "1-3 days",
  "2-4 days",
];

const LogisticsSelector = ({
  onSelect,
  logisticsProviders,
  logisticsCost,
  selectedProvider,
  selectedProviderWalletAddress,
}: LogisticsSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [providers, setProviders] = useState<LogisticsProvider[]>([]);
  const [selected, setSelected] = useState<LogisticsProvider | null>(null);
  // const {
  //   getLogisticsProviders,
  //   logisticsProviders,
  //   logisticsProviderLoading,
  // } = useContract();

  // Generate random logistics provider data
  const generateRandomLogisticsData = useCallback(
    (address: string, index: number): LogisticsProvider => {
      const randomPrefix =
        COMPANY_PREFIXES[Math.floor(Math.random() * COMPANY_PREFIXES.length)];
      const randomSuffix =
        COMPANY_SUFFIXES[Math.floor(Math.random() * COMPANY_SUFFIXES.length)];
      const randomDeliveryTime =
        DELIVERY_TIMES[Math.floor(Math.random() * DELIVERY_TIMES.length)];
      const cost = logisticsCost[index];
      const randomRating = (Math.random() * (5 - 4) + 4).toFixed(1); // Random rating between 4.0 and 5.0

      return {
        id: address,
        name: `${randomPrefix} ${randomSuffix}`,
        walletAddress: address,
        cost: Number(cost),
        deliveryTime: randomDeliveryTime,
        rating: parseFloat(randomRating),
      };
    },
    []
  );

  const transformedLogisticsProviders = useMemo(() => {
    if (
      !logisticsProviders ||
      !Array.isArray(logisticsProviders) ||
      !logisticsCost ||
      !Array.isArray(logisticsCost)
    )
      return [];
    return logisticsProviders.map(generateRandomLogisticsData);
  }, [logisticsProviders, generateRandomLogisticsData]);

  useEffect(() => {
    setProviders(transformedLogisticsProviders);

    if (!selectedProvider && transformedLogisticsProviders.length > 0) {
      setSelected(transformedLogisticsProviders[0]);
      onSelect(transformedLogisticsProviders[0]);
    } else if (selectedProvider) {
      setSelected(selectedProvider);
    }
  }, [transformedLogisticsProviders, selectedProvider, onSelect]);

  useEffect(() => {
    if (
      selectedProviderWalletAddress &&
      transformedLogisticsProviders?.length > 0
    ) {
      const provider = transformedLogisticsProviders.find(
        (p) =>
          p.walletAddress.toLowerCase() ===
          selectedProviderWalletAddress?.toLowerCase()
      );

      if (provider) {
        setSelected(provider);
        onSelect(provider);
      }
    }
  }, [selectedProviderWalletAddress, transformedLogisticsProviders, onSelect]);

  const handleSelectProvider = (provider: LogisticsProvider) => {
    setSelected(provider);
    onSelect(provider);
    setIsOpen(false);
  };

  return (
    <div className="space-y-2 w-full">
      <div className="flex items-center gap-1.5">
        <FiTruck className="text-gray-400" />
        <p className="text-sm text-gray-400">Delivery Options</p>
      </div>

      <div className="relative">
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full bg-[#31333a] border border-gray-700/30 rounded-lg p-3 flex items-center justify-between text-left focus:outline-none focus:ring-1 focus:ring-Red/30"
          whileTap={{ scale: 0.98 }}
        >
          {selected ? (
            <div className="flex flex-col">
              <span className="text-white text-sm font-medium">
                {selected.name}
              </span>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="text-xs text-gray-400">
                  {selected.deliveryTime}
                </span>
                <span className="text-xs text-gray-400">
                  {selected.cost === 0 ? "Free" : `${selected.cost} USDT`}
                </span>
                {selected.rating && (
                  <span className="text-xs text-gray-400">
                    ★ {selected.rating}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <span className="text-gray-400 text-sm">
              {/* {logisticsProviderLoading
                ? "Loading options..." */}
              Select delivery option
            </span>
          )}
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <FiChevronDown className="text-gray-400" />
          </motion.div>
        </motion.button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: 10, height: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute z-20 bottom-full mb-1 w-full bg-[#31333a] border border-gray-700/30 rounded-lg shadow-lg overflow-hidden"
            >
              <div className="max-h-[240px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
                <div className="py-1">
                  <AnimatePresence>
                    {
                      //   logisticsProviderLoading ? (
                      //   <motion.div
                      //     initial={{ opacity: 0 }}
                      //     animate={{ opacity: 1 }}
                      //     exit={{ opacity: 0 }}
                      //     className="p-3 text-center text-gray-400"
                      //   >
                      //     Loading delivery options...
                      //   </motion.div>
                      // ) :
                      providers.length > 0 ? (
                        providers.map((provider, index) => (
                          <motion.button
                            key={provider.id}
                            onClick={() => handleSelectProvider(provider)}
                            className={`w-full p-3 text-left hover:bg-gray-700/20 transition-colors flex items-center justify-between ${
                              selected?.id === provider.id
                                ? "bg-gray-700/20"
                                : ""
                            }`}
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                            transition={{ duration: 0.2, delay: index * 0.05 }}
                            whileHover={{
                              backgroundColor: "rgba(255,255,255,0.05)",
                            }}
                          >
                            <div className="flex flex-col">
                              <span className="text-white text-sm font-medium">
                                {provider.name}
                              </span>
                              <div className="flex items-center gap-3 mt-0.5">
                                <span className="text-xs text-gray-400">
                                  {provider.deliveryTime}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {provider.cost === 0
                                    ? "Free"
                                    : `${provider.cost} USDT`}
                                </span>
                                {provider.rating && (
                                  <span className="text-xs text-gray-400">
                                    ★ {provider.rating}
                                  </span>
                                )}
                              </div>
                            </div>
                            {selected?.id === provider.id && (
                              <FiCheck className="text-Red" />
                            )}
                          </motion.button>
                        ))
                      ) : (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="p-3 text-center text-gray-400"
                        >
                          No delivery options available
                        </motion.div>
                      )
                    }
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default LogisticsSelector;
