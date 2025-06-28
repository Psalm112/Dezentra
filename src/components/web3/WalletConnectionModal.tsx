import React, { useMemo, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useConnect } from "wagmi";
import { SiCoinbase } from "react-icons/si";
import {
  HiDevicePhoneMobile,
  HiQuestionMarkCircle,
  HiExclamationTriangle,
  HiXMark,
  HiArrowPath,
  HiShieldCheck,
  HiGlobeAlt,
} from "react-icons/hi2";
import Modal from "../common/Modal";
import Button from "../common/Button";
import WalletEducationModal from "./WalletEducationModal";
import { useWeb3 } from "../../context/Web3Context";
import { useSnackbar } from "../../context/SnackbarContext";
import { useCurrencyConverter } from "../../utils/hooks/useCurrencyConverter";
import { metamaskLogo } from "../../pages";
import {
  TARGET_CHAIN,
  SUPPORTED_CHAINS,
  getChainMetadata,
} from "../../utils/config/web3.config";

interface WalletConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const WalletConnectionModal: React.FC<WalletConnectionModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { showSnackbar } = useSnackbar();
  const { connectors, connect, isPending, reset } = useConnect();
  const { wallet } = useWeb3();
  const { userCountry, loading: currencyLoading } = useCurrencyConverter();

  const [showEducation, setShowEducation] = useState(false);
  const [connectingWallet, setConnectingWallet] = useState<string | null>(null);
  const [connectionTimeout, setConnectionTimeout] = useState(false);
  const [walletConnectLoading, setWalletConnectLoading] = useState(false);

  useEffect(() => {
    const walletConnectProjectId = import.meta.env
      .VITE_WALLETCONNECT_PROJECT_ID;
    if (
      !walletConnectProjectId &&
      connectors.some((c) => c.name.toLowerCase().includes("walletconnect"))
    ) {
      console.warn("WalletConnect enabled but no project ID configured");
    }
  }, [connectors]);

  const availableConnectors = useMemo(() => {
    return connectors.filter((connector) => {
      if (connector.name.toLowerCase().includes("walletconnect")) {
        const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;
        return !!projectId;
      }
      return connector.ready !== false;
    });
  }, [connectors]);

  const supportedNetworks = useMemo(() => {
    return SUPPORTED_CHAINS.map((chain) => {
      const metadata = getChainMetadata(chain.id);
      return {
        id: chain.id,
        name: metadata?.shortName || chain.name,
        isTarget: chain.id === TARGET_CHAIN.id,
      };
    }).slice(0, 4);
  }, []);

  useEffect(() => {
    if (wallet.isConnected && connectingWallet) {
      const cleanup = () => {
        setConnectingWallet(null);
        setConnectionTimeout(false);
        setWalletConnectLoading(false);
      };

      cleanup();
      onClose();
      showSnackbar(
        "Wallet connected successfully! Ready for cross-chain shopping.",
        "success"
      );
    }
  }, [wallet.isConnected, connectingWallet, onClose, showSnackbar]);

  // connection timeout with cleanup
  useEffect(() => {
    if (!connectingWallet) return;

    const timeoutId = setTimeout(() => {
      setConnectionTimeout(true);
    }, 15000);

    return () => clearTimeout(timeoutId);
  }, [connectingWallet]);

  // WalletConnect loading state
  useEffect(() => {
    if (!connectingWallet?.toLowerCase().includes("walletconnect")) return;

    setWalletConnectLoading(true);
    const timer = setTimeout(() => setWalletConnectLoading(false), 3000);
    return () => clearTimeout(timer);
  }, [connectingWallet]);

  const handleClose = useCallback(() => {
    if (!connectingWallet) {
      onClose();
    }
  }, [connectingWallet, onClose]);

  const handleConnect = useCallback(
    async (connector: any) => {
      try {
        setConnectingWallet(connector.name);
        setConnectionTimeout(false);

        if (connector.name.toLowerCase().includes("walletconnect")) {
          setWalletConnectLoading(true);
        }

        await connect({ connector });
      } catch (error: any) {
        console.error("Connection failed:", error);
        setConnectingWallet(null);
        setConnectionTimeout(false);
        setWalletConnectLoading(false);

        // error handling
        if (error.message?.includes("User rejected")) {
          showSnackbar("Connection cancelled", "info");
        } else if (error.message?.includes("Project ID")) {
          showSnackbar("Wallet service temporarily unavailable", "error");
        } else if (error.message?.includes("Already processing")) {
          showSnackbar("Connection already in progress", "info");
        } else {
          showSnackbar("Failed to connect wallet. Please try again.", "error");
        }
      }
    },
    [connect, showSnackbar]
  );

  const handleCancelConnection = useCallback(() => {
    reset();
    setConnectingWallet(null);
    setConnectionTimeout(false);
    setWalletConnectLoading(false);
  }, [reset]);

  const handleRetryConnection = useCallback(() => {
    setConnectionTimeout(false);
    const connector = connectors.find((c) => c.name === connectingWallet);
    if (connector) {
      handleConnect(connector);
    }
  }, [connectors, connectingWallet, handleConnect]);

  const getWalletIcon = useCallback((name: string) => {
    const normalizedName = name.toLowerCase();
    switch (normalizedName) {
      case "metamask":
        return <img src={metamaskLogo} alt="MetaMask" className="w-8 h-8" />;
      case "coinbase wallet":
        return <SiCoinbase className="w-8 h-8 text-blue-500" />;
      case "walletconnect":
        return <HiDevicePhoneMobile className="w-8 h-8 text-blue-400" />;
      default:
        return <HiDevicePhoneMobile className="w-8 h-8 text-gray-400" />;
    }
  }, []);

  const getWalletDescription = useCallback((name: string) => {
    const normalizedName = name.toLowerCase();
    if (normalizedName.includes("walletconnect")) {
      return "Connect mobile wallets via QR code";
    }
    if (normalizedName === "metamask") {
      return "Most popular crypto wallet extension";
    }
    if (normalizedName === "coinbase wallet") {
      return "Secure wallet from Coinbase exchange";
    }
    return "Secure crypto wallet connection";
  }, []);

  const getConnectionMessage = useCallback(() => {
    if (!connectingWallet) return null;

    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );

    if (connectingWallet.toLowerCase().includes("walletconnect")) {
      return {
        title: "Connecting to WalletConnect",
        message:
          "Scan QR code with your mobile wallet or wait for the connection to establish.",
        loading: walletConnectLoading,
      };
    }

    if (connectionTimeout) {
      return {
        title: "Connection Taking Too Long?",
        message: isMobile
          ? "Ensure your wallet app is open and connected to a supported network (Avalanche Fuji, Base Sepolia, Ethereum Sepolia, or Arbitrum Sepolia)."
          : "Check that your wallet extension is active and connected to a supported network. Try refreshing the page if the issue persists.",
        timeout: true,
      };
    }

    return {
      title: `Connecting to ${connectingWallet}`,
      message: isMobile
        ? "Check your wallet app for the connection request"
        : "Look for a connection popup in your wallet extension",
      loading: true,
    };
  }, [connectingWallet, connectionTimeout, walletConnectLoading]);

  const connectionMessage = getConnectionMessage();

  if (showEducation) {
    return (
      <WalletEducationModal
        isOpen={isOpen}
        onClose={() => setShowEducation(false)}
        onBack={() => setShowEducation(false)}
      />
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Connect Your Wallet"
      maxWidth="md:max-w-lg"
      showCloseButton={!connectingWallet}
    >
      <div className="space-y-6">
        {/* Connection Status */}
        <AnimatePresence>
          {connectionMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`p-4 rounded-lg border transition-all duration-200 ${
                connectionMessage.timeout
                  ? "bg-Red/10 border-Red/30"
                  : "bg-Blue/10 border-Blue/20"
              }`}
            >
              <div className="flex items-start gap-3">
                {connectionMessage.loading && (
                  <div className="w-5 h-5 border-2 border-Blue border-t-transparent rounded-full animate-spin flex-shrink-0 mt-0.5" />
                )}
                {connectionMessage.timeout && (
                  <HiExclamationTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-Red" />
                )}
                <div className="flex-1">
                  <h4 className="font-medium mb-1 text-white">
                    {connectionMessage.title}
                  </h4>
                  <p className="text-sm text-gray-300">
                    {connectionMessage.message}
                  </p>

                  {connectionMessage.timeout && (
                    <div className="flex gap-2 mt-3">
                      <Button
                        title="Retry Connection"
                        icon={<HiArrowPath className="w-4 h-4" />}
                        onClick={handleRetryConnection}
                        className="bg-Red hover:bg-Red/80 text-white text-sm px-3 py-1.5 transition-all duration-200"
                      />
                      <Button
                        title="Cancel"
                        icon={<HiXMark className="w-4 h-4" />}
                        onClick={handleCancelConnection}
                        className="bg-Dark hover:bg-Dark/80 text-white text-sm px-3 py-1.5 transition-all duration-200"
                      />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Introduction */}
        {!connectingWallet && (
          <div className="text-center space-y-4">
            <p className="text-gray-300">
              Connect your wallet to shop across multiple blockchains
            </p>

            {/* Cross-chain benefits */}
            <div className="flex items-center justify-center gap-2 text-sm text-Blue bg-Blue/10 rounded-lg p-3 border border-Blue/20">
              <HiGlobeAlt className="w-4 h-4 flex-shrink-0" />
              <span>
                Cross-chain payments • {userCountry || "Local currency"} •
                Secure escrow
              </span>
            </div>

            {/* Supported networks preview */}
            <div className="flex items-center justify-center gap-1 text-xs text-gray-400">
              <span>Supports:</span>
              {supportedNetworks.map((network, index) => (
                <span
                  key={network.id}
                  className={network.isTarget ? "text-Red font-medium" : ""}
                >
                  {network.name}
                  {index < supportedNetworks.length - 1 && ", "}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Wallet Options */}
        <div className="space-y-3">
          {availableConnectors.map((connector) => (
            <motion.div
              key={connector.id}
              whileHover={!connectingWallet ? { scale: 1.01 } : {}}
              whileTap={!connectingWallet ? { scale: 0.99 } : {}}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            >
              <button
                onClick={() => handleConnect(connector)}
                disabled={!!connectingWallet}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-200 ${
                  connectingWallet === connector.name
                    ? "bg-Blue/20 border-Blue/50 text-white shadow-lg shadow-Blue/10"
                    : connectingWallet
                    ? "bg-Dark/50 border-gray-700/30 text-gray-500 cursor-not-allowed"
                    : "bg-Dark hover:bg-Dark/80 border-gray-700/50 text-white hover:border-Blue/30 hover:shadow-lg hover:shadow-Blue/5"
                }`}
              >
                {getWalletIcon(connector.name)}
                <div className="flex-1 text-left">
                  <h3 className="font-medium">{connector.name}</h3>
                  <p className="text-sm opacity-75">
                    {getWalletDescription(connector.name)}
                  </p>
                </div>
                {connectingWallet === connector.name ? (
                  <div className="w-5 h-5 border-2 border-Blue border-t-transparent rounded-full animate-spin" />
                ) : connectingWallet ? (
                  <div className="w-2 h-2 bg-gray-500 rounded-full" />
                ) : (
                  <div className="w-2 h-2 bg-Red rounded-full animate-pulse" />
                )}
              </button>
            </motion.div>
          ))}
        </div>

        {/* Cancel Connection Button */}
        {connectingWallet && !connectionTimeout && (
          <Button
            title="Cancel Connection"
            icon={<HiXMark className="w-4 h-4" />}
            onClick={handleCancelConnection}
            className="flex items-center justify-center w-full bg-Dark hover:bg-Dark/80 text-white py-2.5 transition-all duration-200"
          />
        )}

        {/* Help Section */}
        {!connectingWallet && (
          <div className="border-t border-gray-700/50 pt-4 space-y-3">
            <Button
              title="New to crypto wallets? Learn the basics"
              icon={<HiQuestionMarkCircle className="w-4 h-4" />}
              onClick={() => setShowEducation(true)}
              className="flex items-center justify-center w-full bg-transparent border border-Blue/30 text-gray-300 hover:bg-Blue/5 hover:text-white hover:border-Blue/50 transition-all duration-200"
            />

            <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
              <HiShieldCheck className="w-3 h-3" />
              <span>
                Your wallet stays secure - we never access your private keys
              </span>
            </div>
          </div>
        )}

        {/* Error Display */}
        <AnimatePresence>
          {wallet.error && !connectingWallet && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-3 bg-Red/10 border border-Red/30 rounded-lg"
            >
              <p className="text-Red text-sm">{wallet.error}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  );
};

export default WalletConnectionModal;
