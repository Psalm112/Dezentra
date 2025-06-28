import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiGlobeAlt,
  HiArrowsRightLeft,
  HiExclamationTriangle,
  HiCheckCircle,
  HiChevronDown,
} from "react-icons/hi2";
import Button from "../common/Button";
import { useNetworkSwitch } from "../../utils/hooks/useNetworkSwitch";
import { useWeb3 } from "../../context/Web3Context";
import {
  SUPPORTED_CHAINS,
  TARGET_CHAIN,
  getChainMetadata,
  CHAIN_METADATA,
} from "../../utils/config/web3.config";
import { useSnackbar } from "../../context/SnackbarContext";

interface NetworkSwitcherProps {
  selectedChainId?: number;
  onChainSelect?: (chainId: number) => void;
  showCurrentNetwork?: boolean;
  variant?: "dropdown" | "grid" | "inline";
  size?: "sm" | "md" | "lg";
  className?: string;
  disabled?: boolean;
}

const NetworkSwitcher: React.FC<NetworkSwitcherProps> = ({
  selectedChainId,
  onChainSelect,
  showCurrentNetwork = true,
  variant = "dropdown",
  size = "md",
  className = "",
  disabled = false,
}) => {
  const {
    wallet,
    chainId: currentChainId,
    isCorrectNetwork,
    networkStatus,
  } = useWeb3();
  const { showSnackbar } = useSnackbar();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [switchingToChain, setSwitchingToChain] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const { switchNetwork, isSwitching } = useNetworkSwitch({
    onSuccess: (chainId) => {
      onChainSelect?.(chainId);
      setIsDropdownOpen(false);
      setSwitchingToChain(null);
      //   showSnackbar(
      //     `Successfully switched to ${getChainMetadata(chainId)?.name}`,
      //     "success"
      //   );
    },
    onError: (error) => {
      setSwitchingToChain(null);

      // error handling
      const errorMessage = error.message.toLowerCase();
      let userMessage = "Failed to switch network";

      if (
        errorMessage.includes("user rejected") ||
        errorMessage.includes("rejected") ||
        errorMessage.includes("cancelled") ||
        errorMessage.includes("user denied")
      ) {
        userMessage = "Network switch cancelled";
      } else if (errorMessage.includes("unsupported")) {
        userMessage = "Network not supported by your wallet";
      } else if (errorMessage.includes("timeout")) {
        userMessage = "Network switch timed out. Please try again.";
      } else if (
        errorMessage.includes("scheme does not have a registered handler")
      ) {
        userMessage = "Wallet connection issue. Please refresh and try again.";
      } else if (errorMessage.includes("resource unavailable")) {
        userMessage = "Network temporarily unavailable. Please try again.";
      }

      showSnackbar(userMessage, "error");
    },
  });

  const currentChain = useMemo(() => {
    return currentChainId ? getChainMetadata(currentChainId) : null;
  }, [currentChainId]);

  const targetChainId = selectedChainId || currentChainId || TARGET_CHAIN.id;
  //   const isOnCorrectNetwork = currentChainId === targetChainId;
  const needsSwitch = !isCorrectNetwork;

  // network switch
  const handleNetworkSwitch = useCallback(
    async (chainId: number, retryCount = 0) => {
      if (chainId === currentChainId) {
        onChainSelect?.(chainId);
        setIsDropdownOpen(false);
        return;
      }

      if (
        switchingToChain === chainId ||
        isSwitching ||
        networkStatus === "switching"
      ) {
        return;
      }

      // Check wallet connection first
      if (!wallet.isConnected) {
        showSnackbar("Please connect your wallet first", "error");
        return;
      }

      // Clear any existing retry timeout
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }

      try {
        setSwitchingToChain(chainId);

        // delay to prevent rapid successive calls
        await new Promise((resolve) => setTimeout(resolve, 50));

        await switchNetwork(chainId);
      } catch (error: any) {
        console.error("Network switch failed:", error);

        // retry logic for specific errors
        const shouldRetry =
          retryCount < 2 &&
          (error.message.includes("resource unavailable") ||
            error.message.includes("timeout") ||
            error.message.includes("network error"));

        if (shouldRetry) {
          const retryDelay = Math.pow(2, retryCount) * 1000;
          retryTimeoutRef.current = setTimeout(() => {
            handleNetworkSwitch(chainId, retryCount + 1);
          }, retryDelay);
        } else {
          setSwitchingToChain(null);
        }
      }
    },
    [
      currentChainId,
      switchNetwork,
      onChainSelect,
      switchingToChain,
      isSwitching,
      networkStatus,
      wallet.isConnected,
      showSnackbar,
    ]
  );

  useEffect(() => {
    if (networkStatus === "connected" || networkStatus === "wrong-network") {
      setSwitchingToChain(null);
    }
  }, [networkStatus]);

  // Auto-close dropdown when network changes
  useEffect(() => {
    if (!wallet.isConnected || networkStatus === "switching") {
      setIsDropdownOpen(false);
      if (networkStatus !== "switching") {
        setSwitchingToChain(null);
      }
    }
  }, [wallet.isConnected, networkStatus]);

  const handleDropdownToggle = useCallback(() => {
    if (disabled || isSwitching || networkStatus === "switching") return;

    // Check wallet connection before opening dropdown
    if (!wallet.isConnected) {
      showSnackbar("Please connect your wallet first", "error");
      return;
    }

    setIsDropdownOpen((prev) => !prev);
  }, [disabled, isSwitching, networkStatus, wallet.isConnected, showSnackbar]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isDropdownOpen]);

  const getNetworkStatusIndicator = () => {
    switch (networkStatus) {
      case "switching":
        return (
          <div
            className={`${iconSizes[size]} border-2 border-Red border-t-transparent rounded-full animate-spin`}
          />
        );
      case "wrong-network":
        return (
          <HiExclamationTriangle
            className={`${iconSizes[size]} text-yellow-400`}
          />
        );
      case "connected":
        return currentChain?.icon ? (
          <img
            src={currentChain.icon}
            alt={currentChain.shortName}
            className={`${iconSizes[size]} rounded-full`}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
            loading="lazy"
          />
        ) : (
          <HiGlobeAlt className={`${iconSizes[size]} text-green-400`} />
        );
      default:
        return <HiGlobeAlt className={`${iconSizes[size]} text-gray-400`} />;
    }
  };

  // Close dropdown when wallet disconnects or network changes
  useEffect(() => {
    if (!wallet.isConnected) {
      setIsDropdownOpen(false);
      setSwitchingToChain(null);
    }
  }, [wallet.isConnected]);

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      setIsDropdownOpen(false);
    }
  }, []);

  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-2",
    lg: "text-base px-4 py-3",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  if (variant === "inline" && showCurrentNetwork) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {currentChain && (
          <div className="flex items-center gap-2">
            {currentChain.icon ? (
              <img
                src={currentChain.icon}
                alt={currentChain.shortName}
                className={`${iconSizes[size]} rounded-full`}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                }}
                loading="lazy"
              />
            ) : (
              <div
                className={`${iconSizes[size]} rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold text-white`}
              >
                {currentChain.shortName.charAt(0)}
              </div>
            )}
            <span className="text-gray-300 font-medium">
              {currentChain.name}
            </span>
          </div>
        )}

        {needsSwitch && (
          <Button
            title="Switch Network"
            icon={<HiArrowsRightLeft className={iconSizes[size]} />}
            onClick={() => handleNetworkSwitch(TARGET_CHAIN.id)}
            disabled={
              disabled || isSwitching || switchingToChain === TARGET_CHAIN.id
            }
            className={`bg-Red hover:bg-Red/80 text-white ${sizeClasses[size]} transition-all duration-200`}
          />
        )}
      </div>
    );
  }

  if (variant === "grid") {
    return (
      <div className={`space-y-3 ${className}`}>
        <h4 className="text-sm font-medium text-gray-400 flex items-center gap-2">
          <HiGlobeAlt className={iconSizes[size]} />
          Select Network
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {SUPPORTED_CHAINS.map((chain) => {
            const metadata = CHAIN_METADATA[chain.id];
            const isActive = currentChainId === chain.id;
            const isSelected = targetChainId === chain.id;
            const isPrimary = chain.id === TARGET_CHAIN.id;
            const isSwitchingToThis = switchingToChain === chain.id;

            return (
              <button
                key={chain.id}
                onClick={() => handleNetworkSwitch(chain.id)}
                disabled={disabled || isSwitching || isSwitchingToThis}
                className={`p-3 rounded-lg border transition-all duration-200 ${
                  isSelected
                    ? "border-Red bg-Red/20 text-Red"
                    : isActive
                    ? "border-green-500 bg-green-500/20 text-green-300"
                    : "border-gray-700/50 bg-gray-800/50 text-gray-400 hover:border-gray-600"
                } disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-Red/50`}
              >
                <div className="flex items-center gap-2">
                  {metadata?.icon ? (
                    <img
                      src={metadata.icon}
                      alt={metadata.shortName}
                      className={`${iconSizes[size]} rounded-full`}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                      }}
                      loading="lazy"
                    />
                  ) : (
                    <div
                      className={`${iconSizes[size]} rounded-full bg-gray-500 flex items-center justify-center text-xs font-bold text-white`}
                    >
                      {metadata?.shortName?.charAt(0) || "?"}
                    </div>
                  )}
                  <div className="flex-1 text-left">
                    <div className="font-medium">{metadata?.name}</div>
                    <div className="text-xs opacity-75">
                      {metadata?.shortName}
                    </div>
                  </div>
                  {isActive && (
                    <HiCheckCircle
                      className={`${iconSizes[size]} text-green-500`}
                    />
                  )}
                  {isSwitchingToThis && (
                    <div
                      className={`${iconSizes[size]} border-2 border-Red border-t-transparent rounded-full animate-spin`}
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Dropdown variant (default)
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={handleDropdownToggle}
        onKeyDown={handleKeyDown}
        disabled={disabled || isSwitching}
        className={`flex items-center gap-2 bg-Dark border border-Red/20 rounded-lg hover:border-Red/40 transition-all duration-200 ${sizeClasses[size]} disabled:opacity-50 disabled:cursor-not-allowed w-full justify-between focus:outline-none focus:ring-2 focus:ring-Red/50`}
        aria-label="Select network"
        aria-expanded={isDropdownOpen}
        aria-haspopup="listbox"
      >
        <div className="flex items-center gap-2">
          {currentChain?.icon ? (
            <img
              src={currentChain.icon}
              alt={currentChain.shortName}
              className={`${iconSizes[size]} rounded-full`}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
              }}
              loading="lazy"
            />
          ) : (
            <HiGlobeAlt className={`${iconSizes[size]} text-gray-400`} />
          )}
          <span className="text-white font-medium">
            {currentChain?.name || "Select Network"}
          </span>
          {networkStatus === "wrong-network" && (
            <HiExclamationTriangle
              className={`${iconSizes[size]} text-yellow-400`}
            />
          )}
        </div>

        {isSwitching ? (
          <div
            className={`${iconSizes[size]} border-2 border-Red border-t-transparent rounded-full animate-spin`}
          />
        ) : (
          <HiChevronDown
            className={`${iconSizes[size]} text-gray-400 transition-transform ${
              isDropdownOpen ? "rotate-180" : ""
            }`}
          />
        )}
      </button>

      <AnimatePresence>
        {isDropdownOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute top-full mt-2 left-0 right-0 bg-[#1a1c20] border border-Red/30 rounded-lg shadow-xl z-50 overflow-hidden"
            role="listbox"
            aria-label="Network options"
          >
            {SUPPORTED_CHAINS.map((chain, index) => {
              const metadata = CHAIN_METADATA[chain.id];
              const isActive = currentChainId === chain.id;
              const isPrimary = chain.id === TARGET_CHAIN.id;
              const isSwitchingToThis = switchingToChain === chain.id;

              return (
                <motion.button
                  key={chain.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05, ease: "easeOut" }}
                  onClick={() => handleNetworkSwitch(chain.id)}
                  disabled={disabled || isSwitching || isSwitchingToThis}
                  className={`w-full px-3 py-2.5 text-left hover:bg-Red/10 transition-all duration-200 flex items-center gap-3 ${
                    isActive
                      ? "bg-Red/20 text-white border-l-2 border-Red"
                      : "text-gray-300"
                  } disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:bg-Red/10`}
                  role="option"
                  aria-selected={isActive}
                >
                  {metadata?.icon ? (
                    <img
                      src={metadata.icon}
                      alt={metadata.shortName}
                      className={`${iconSizes[size]} rounded-full flex-shrink-0`}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = "none";
                      }}
                      loading="lazy"
                    />
                  ) : (
                    <div
                      className={`${iconSizes[size]} rounded-full bg-gray-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0`}
                    >
                      {metadata?.shortName?.charAt(0) || "?"}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{metadata?.name}</div>
                    <div className="text-xs opacity-75">
                      {metadata?.shortName}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isPrimary && (
                      <span className="text-xs text-Red/60 bg-Red/20 px-2 py-0.5 rounded-full">
                        PRIMARY
                      </span>
                    )}
                    {isSwitchingToThis ? (
                      <div
                        className={`${iconSizes[size]} border-2 border-Red border-t-transparent rounded-full animate-spin`}
                      />
                    ) : isActive ? (
                      <HiCheckCircle
                        className={`${iconSizes[size]} text-green-500`}
                      />
                    ) : null}
                  </div>
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NetworkSwitcher;
