import React, { useMemo, useState, useEffect } from "react";
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
} from "react-icons/hi2";
import Modal from "../common/Modal";
import Button from "../common/Button";
import WalletEducationModal from "./WalletEducationModal";
import { useWeb3 } from "../../context/Web3Context";
import { useSnackbar } from "../../context/SnackbarContext";
import { useCurrencyConverter } from "../../utils/hooks/useCurrencyConverter";
import { metamaskLogo } from "../../pages";

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

  const availableConnectors = useMemo(() => {
    return connectors.filter((connector) => {
      if (connector.name.toLowerCase().includes("walletconnect")) {
        return !!import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;
      }
      return true;
    });
  }, [connectors]);

  // Handle successful connection
  useEffect(() => {
    if (wallet.isConnected && connectingWallet) {
      setConnectingWallet(null);
      setConnectionTimeout(false);
      onClose();
      showSnackbar("Wallet connected successfully!", "success");
    }
  }, [wallet.isConnected, connectingWallet, onClose, showSnackbar]);

  // Connection timeout
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (connectingWallet) {
      timeoutId = setTimeout(() => {
        setConnectionTimeout(true);
      }, 15000);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [connectingWallet]);

  // Handle WalletConnect loading
  useEffect(() => {
    const walletConnectConnector = connectors.find((c) =>
      c.name.toLowerCase().includes("walletconnect")
    );

    if (
      walletConnectConnector &&
      connectingWallet === walletConnectConnector.name
    ) {
      setWalletConnectLoading(true);
      const timer = setTimeout(() => setWalletConnectLoading(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [connectingWallet, connectors]);

  const handleClose = () => {
    if (!connectingWallet) {
      onClose();
    }
  };

  const handleConnect = async (connector: any) => {
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

      if (error.message?.includes("User rejected")) {
        showSnackbar("Connection cancelled", "info");
      } else if (error.message?.includes("Project ID")) {
        showSnackbar("Wallet service temporarily unavailable", "error");
      } else {
        showSnackbar("Failed to connect wallet. Please try again.", "error");
      }
    }
  };

  const handleCancelConnection = () => {
    reset();
    setConnectingWallet(null);
    setConnectionTimeout(false);
    setWalletConnectLoading(false);
  };

  const handleRetryConnection = () => {
    setConnectionTimeout(false);
    const connector = connectors.find((c) => c.name === connectingWallet);
    if (connector) {
      handleConnect(connector);
    }
  };

  const getWalletIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case "metamask":
        return <img src={metamaskLogo} alt="Metamask" className="w-8 h-8" />;
      case "coinbase wallet":
        return <SiCoinbase className="w-8 h-8 text-blue-500" />;
      case "walletconnect":
        return <HiDevicePhoneMobile className="w-8 h-8 text-blue-400" />;
      default:
        return <HiDevicePhoneMobile className="w-8 h-8 text-gray-400" />;
    }
  };

  const getConnectionMessage = () => {
    if (!connectingWallet) return null;

    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );

    if (connectingWallet.toLowerCase().includes("walletconnect")) {
      return {
        title: "Connecting to WalletConnect",
        message:
          "This may take a moment. Please be patient or try other wallet options.",
        loading: walletConnectLoading,
      };
    }

    if (connectionTimeout) {
      return {
        title: "Connection Taking Too Long?",
        message: isMobile
          ? "Make sure your wallet app is running and hasn't crashed. Close and reopen your wallet app, then try again. Also ensure your wallet is connected to the Celo network."
          : "Make sure your wallet extension is running and hasn't crashed. Refresh your browser or restart the wallet extension, then try again. Also ensure your wallet is connected to the Celo network.",
        timeout: true,
      };
    }

    return {
      title: `Connecting to ${connectingWallet}`,
      message: isMobile
        ? "Check your wallet app for connection request"
        : "Check your wallet extension for connection request",
      loading: true,
    };
  };

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
                  : "bg-Red/5 border-Red/20"
              }`}
            >
              <div className="flex items-start gap-3">
                {connectionMessage.loading && (
                  <div className="w-5 h-5 border-2 border-Red border-t-transparent rounded-full animate-spin flex-shrink-0 mt-0.5" />
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
              Choose your preferred wallet to start shopping with crypto
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-Red bg-Red/10 rounded-lg p-3 border border-Red/20">
              <HiShieldCheck className="w-4 h-4 flex-shrink-0" />
              <span>
                Secure payments in {userCountry || "your local currency"} • No
                fees • Instant settlement
              </span>
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
                    ? "bg-Red/20 border-Red/50 text-white shadow-lg shadow-Red/10"
                    : connectingWallet
                    ? "bg-Dark/50 border-gray-700/30 text-gray-500 cursor-not-allowed"
                    : "bg-Dark hover:bg-Dark/80 border-gray-700/50 text-white hover:border-Red/30 hover:shadow-lg hover:shadow-Red/5"
                }`}
              >
                {getWalletIcon(connector.name)}
                <div className="flex-1 text-left">
                  <h3 className="font-medium">{connector.name}</h3>
                  <p className="text-sm opacity-75">
                    {connector.name.toLowerCase().includes("walletconnect")
                      ? "Connect with mobile wallet apps"
                      : connector.name === "MetaMask"
                      ? "Popular browser extension wallet"
                      : "Secure wallet from Coinbase exchange"}
                  </p>
                </div>
                {connectingWallet === connector.name ? (
                  <div className="w-5 h-5 border-2 border-Red border-t-transparent rounded-full animate-spin" />
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
              title="New to wallets? Learn the basics"
              icon={<HiQuestionMarkCircle className="w-4 h-4" />}
              onClick={() => setShowEducation(true)}
              className="flex items-center justify-center w-full bg-transparent border border-Red/30 text-gray-300 hover:bg-Red/5 hover:text-white hover:border-Red/50 transition-all duration-200"
            />

            <p className="text-xs text-gray-500 text-center">
              Your wallet stays secure - we never store your private keys
            </p>
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
