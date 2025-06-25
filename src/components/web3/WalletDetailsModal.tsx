import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  HiArrowTopRightOnSquare,
  HiClipboardDocument,
  HiArrowsRightLeft,
  HiExclamationTriangle,
  HiChevronDown,
  HiCurrencyDollar,
  HiBanknotes,
  HiGlobeAlt,
} from "react-icons/hi2";
import { FiLogOut } from "react-icons/fi";
import Modal from "../common/Modal";
import Button from "../common/Button";
import { useWeb3 } from "../../context/Web3Context";
import {
  TARGET_CHAIN,
  SUPPORTED_CHAINS,
  getChainMetadata,
  CHAIN_METADATA,
} from "../../utils/config/web3.config";
import { truncateAddress, copyToClipboard } from "../../utils/web3.utils";
import { useSnackbar } from "../../context/SnackbarContext";
import { useCurrencyConverter } from "../../utils/hooks/useCurrencyConverter";
import { useCurrency } from "../../context/CurrencyContext";

interface WalletDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type BalanceDisplayMode = "USDT" | "NATIVE" | "FIAT";

const WalletDetailsModal: React.FC<WalletDetailsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { showSnackbar } = useSnackbar();
  const { secondaryCurrency } = useCurrency();
  const { wallet, disconnectWallet, isCorrectNetwork, switchToCorrectNetwork } =
    useWeb3();

  const {
    userCountry,
    convertPrice,
    formatPrice,
    loading: currencyLoading,
    error: currencyError,
  } = useCurrencyConverter();

  const [balanceMode, setBalanceMode] = useState<BalanceDisplayMode>("FIAT");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Memoized chain metadata
  const currentChainMetadata = useMemo(() => {
    return wallet.chainId ? getChainMetadata(wallet.chainId) : null;
  }, [wallet.chainId]);

  const nativeCurrency = currentChainMetadata?.nativeCurrency || "ETH";
  const blockExplorer = currentChainMetadata?.blockExplorer;

  // Close dropdown on outside click
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

  const handleCopyAddress = () => {
    if (wallet.address) {
      copyToClipboard(wallet.address);
      showSnackbar("Address copied to clipboard", "success");
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    onClose();
  };

  const handleSwitchNetwork = async () => {
    try {
      await switchToCorrectNetwork();
    } catch (error) {
      // Error handled in context
    }
  };

  const getBalanceDisplay = () => {
    if (!wallet.usdtBalance) return "$0.00";
    switch (balanceMode) {
      case "USDT":
        return wallet.usdtBalance.usdt;
      case "NATIVE":
        return wallet.usdtBalance.celo; // This will be updated to show native currency
      case "FIAT":
        return wallet.usdtBalance.fiat;
      default:
        return wallet.usdtBalance.fiat;
    }
  };

  const getBalanceIcon = (mode: BalanceDisplayMode) => {
    switch (mode) {
      case "USDT":
        return <HiCurrencyDollar className="w-4 h-4 text-green-500" />;
      case "NATIVE":
        return currentChainMetadata?.icon ? (
          <img
            src={currentChainMetadata.icon}
            alt={nativeCurrency}
            className="w-4 h-4 rounded-full"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold text-white">
            {nativeCurrency.charAt(0)}
          </div>
        );
      case "FIAT":
        return <HiBanknotes className="w-4 h-4 text-Red" />;
      default:
        return <HiBanknotes className="w-4 h-4 text-Red" />;
    }
  };

  const balanceOptions = useMemo(
    () =>
      [
        {
          mode: "FIAT" as const,
          label: `${userCountry || "USD"}`,
          symbol: "💰",
          priority: 1,
        },
        { mode: "USDT" as const, label: "USDT", symbol: "$", priority: 2 },
        {
          mode: "NATIVE" as const,
          label: nativeCurrency,
          symbol: currentChainMetadata?.shortName || nativeCurrency.charAt(0),
          priority: 3,
        },
      ].sort((a, b) => a.priority - b.priority),
    [userCountry, nativeCurrency, currentChainMetadata]
  );

  // Calculate fiat values
  const usdtNumericValue = wallet.usdtBalance
    ? parseFloat(wallet.usdtBalance.raw || "0")
    : 0;
  const nativeNumericValue = wallet.balance ? parseFloat(wallet.balance) : 0;

  const fiatUsdtValue = convertPrice(usdtNumericValue, "USDT", "FIAT");
  const fiatNativeValue = convertPrice(nativeNumericValue, "CELO", "FIAT"); // Will need to be dynamic
  const totalFiatValue = fiatUsdtValue + fiatNativeValue;

  // Network status component
  const NetworkStatus = () => {
    if (!wallet.chainId) {
      return (
        <div className="p-3 bg-gray-500/10 border border-gray-500/30 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-gray-500 rounded-full" />
            <span className="text-gray-400 font-medium">Not Connected</span>
          </div>
        </div>
      );
    }

    if (!isCorrectNetwork) {
      return (
        <div className="p-3 bg-Red/10 border border-Red/30 rounded-lg">
          <div className="flex items-start gap-2">
            <HiExclamationTriangle className="w-5 h-5 text-Red flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-Red font-medium">Wrong Network</p>
              <p className="text-sm text-Red/80 mt-1">
                Switch to {TARGET_CHAIN.name} for optimal experience
              </p>
              <Button
                title={`Switch to ${TARGET_CHAIN.name}`}
                icon={<HiArrowsRightLeft className="w-4 h-4" />}
                onClick={handleSwitchNetwork}
                className="mt-2 bg-Red hover:bg-Red/80 text-white text-sm px-3 py-1.5 transition-all duration-200"
              />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-green-400 font-medium">
            {currentChainMetadata?.name || "Connected"}
          </span>
          {wallet.chainId !== TARGET_CHAIN.id && (
            <span className="text-xs text-green-400/70 bg-green-500/20 px-2 py-0.5 rounded-full">
              Cross-chain Ready
            </span>
          )}
        </div>
      </div>
    );
  };

  // Supported chains display
  const SupportedChains = () => (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-gray-400 flex items-center gap-2">
        <HiGlobeAlt className="w-4 h-4" />
        Supported Networks
      </h4>
      <div className="grid grid-cols-2 gap-2">
        {SUPPORTED_CHAINS.map((chain) => {
          const metadata = CHAIN_METADATA[chain.id];
          const isActive = wallet.chainId === chain.id;
          const isPrimary = chain.id === TARGET_CHAIN.id;

          return (
            <div
              key={chain.id}
              className={`p-2 rounded-lg text-xs transition-all duration-200 ${
                isActive
                  ? "bg-green-500/20 border border-green-500/40 text-green-300"
                  : isPrimary
                  ? "bg-Red/10 border border-Red/30 text-Red/80"
                  : "bg-gray-800/50 border border-gray-700/50 text-gray-400"
              }`}
            >
              <div className="flex items-center gap-2">
                {metadata?.icon ? (
                  <img
                    src={metadata.icon}
                    alt={metadata.shortName}
                    className="w-3 h-3 rounded-full"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="w-3 h-3 rounded-full bg-gray-500 flex items-center justify-center text-[8px] font-bold text-white">
                    {metadata?.shortName?.charAt(0) || "?"}
                  </div>
                )}
                <span className="font-medium">{metadata?.shortName}</span>
                {isActive && (
                  <div className="w-1 h-1 bg-green-500 rounded-full ml-auto" />
                )}
                {isPrimary && !isActive && (
                  <span className="text-[8px] text-Red/60 ml-auto">
                    PRIMARY
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Wallet Details"
      maxWidth="md:max-w-md"
    >
      <div className="space-y-6">
        {/* Wallet Address */}
        <div className="space-y-3">
          <h3 className="text-lg font-medium text-white">Connected Wallet</h3>
          <div className="flex items-center gap-3 p-3 bg-Dark rounded-lg border border-gray-700/50">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-400">Address</p>
              <p className="font-mono text-white truncate">
                {wallet.address
                  ? truncateAddress(wallet.address)
                  : "Not connected"}
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button
                title=""
                icon={<HiClipboardDocument className="w-4 h-4" />}
                onClick={handleCopyAddress}
                className="bg-[#1a1c20] hover:bg-Red/10 hover:border-Red/30 hover:shadow-md border border-gray-600 text-white p-2 transition-all duration-200"
                disabled={!wallet.address}
              />
              {blockExplorer && (
                <Button
                  title=""
                  icon={<HiArrowTopRightOnSquare className="w-4 h-4" />}
                  path={`${blockExplorer}/address/${wallet.address}`}
                  className="bg-[#1a1c20] hover:bg-Red/10 hover:border-Red/30 hover:shadow-md border border-gray-600 text-white p-2 transition-all duration-200"
                  disabled={!wallet.address}
                />
              )}
            </div>
          </div>
        </div>

        {/* Network Status */}
        <div className="space-y-3">
          <h3 className="text-lg font-medium text-white">Network Status</h3>
          <NetworkStatus />
        </div>

        {/* Supported Networks */}
        <SupportedChains />

        {/* Portfolio Overview */}
        <div className="space-y-3">
          <h3 className="text-lg font-medium text-white">Portfolio Value</h3>
          <div className="p-4 bg-gradient-to-r from-Red/10 to-Red/5 border border-Red/20 rounded-lg">
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-1">Total Balance</p>
              {currencyLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-Red border-t-transparent rounded-full animate-spin" />
                  <span className="text-gray-400">Loading...</span>
                </div>
              ) : (
                <p className="text-2xl font-bold text-white">
                  {secondaryCurrency === "USDT"
                    ? convertPrice(totalFiatValue, "FIAT", "USDT").toFixed(2)
                    : formatPrice(totalFiatValue, "FIAT")}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                in {secondaryCurrency === "USDT" ? "USDT" : userCountry}
              </p>
            </div>
          </div>
        </div>

        {/* Balances */}
        <div className="space-y-3">
          <h3 className="text-lg font-medium text-white">Asset Balances</h3>
          <div className="space-y-3">
            {/* USDT Balance with dropdown */}
            <div className="p-3 bg-Dark rounded-lg border border-gray-700/50">
              <div className="flex flex-wrap gap-2 justify-between items-center">
                <div className="flex items-center gap-2">
                  <HiCurrencyDollar className="w-5 h-5 text-green-500" />
                  <span className="text-gray-300 font-medium">USDT</span>
                </div>
                <div className="relative" ref={dropdownRef}>
                  {wallet.isConnecting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-Red border-t-transparent rounded-full animate-spin" />
                      <span className="text-gray-400">Loading...</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="flex items-center gap-2 font-mono text-white hover:text-gray-300 transition-colors bg-[#1a1c20] hover:bg-Red/10 hover:border-Red/30 border border-gray-600 px-3 py-1.5 rounded-md transition-all duration-200"
                      disabled={!wallet.usdtBalance}
                    >
                      {getBalanceIcon(balanceMode)}
                      <span className="min-w-0">{getBalanceDisplay()}</span>
                      <HiChevronDown
                        className={`w-4 h-4 transition-transform flex-shrink-0 ${
                          isDropdownOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                  )}

                  {isDropdownOpen && wallet.usdtBalance && (
                    <div className="absolute right-0 top-full mt-1 bg-[#1a1c20] border border-Red/30 rounded-lg shadow-xl z-20 min-w-[160px] overflow-hidden">
                      {balanceOptions.map((option) => (
                        <button
                          key={option.mode}
                          onClick={() => {
                            setBalanceMode(option.mode);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2.5 text-left hover:bg-Red/10 transition-colors ${
                            balanceMode === option.mode
                              ? "bg-Red/20 text-white border-l-2 border-Red"
                              : "text-gray-300"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2">
                              {getBalanceIcon(option.mode)}
                              {option.label}
                            </span>
                            {balanceMode === option.mode && (
                              <div className="w-1.5 h-1.5 bg-Red rounded-full" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {wallet.usdtBalance && !currencyLoading && (
                <div className="text-xs text-gray-500 mt-2 space-y-1">
                  <div className="flex justify-between">
                    <span>
                      ≈{" "}
                      {wallet.balance
                        ? `${parseFloat(wallet.balance).toFixed(
                            4
                          )} ${nativeCurrency}`
                        : `0 ${nativeCurrency}`}
                    </span>
                    <span>≈ {formatPrice(fiatUsdtValue, "FIAT")}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Native Currency Balance */}
            <div className="p-3 bg-Dark rounded-lg border border-gray-700/50">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {getBalanceIcon("NATIVE")}
                  <span className="text-gray-300 font-medium">
                    {nativeCurrency}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-mono text-white">
                    {wallet.balance
                      ? `${parseFloat(wallet.balance).toFixed(
                          4
                        )} ${nativeCurrency}`
                      : `0.0000 ${nativeCurrency}`}
                  </span>
                  {!currencyLoading && (
                    <p className="text-xs text-gray-500">
                      ≈ {formatPrice(fiatNativeValue, "FIAT")}
                    </p>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">For transaction fees</p>
            </div>
          </div>
        </div>

        {/* Currency Info */}
        {!currencyLoading && (
          <div className="text-xs text-gray-500 text-center p-2 bg-Red/5 rounded-lg border border-Red/10">
            Prices shown in {userCountry || "USD"} • Cross-chain ready • Updated
            automatically
          </div>
        )}

        {/* Actions */}
        <div className="border-t border-gray-700/50 pt-4">
          <Button
            title="Disconnect Wallet"
            icon={<FiLogOut className="w-4 h-4" />}
            onClick={handleDisconnect}
            className="flex items-center justify-center w-full bg-Red hover:bg-Red/80 text-white py-2.5 transition-all duration-200"
          />
        </div>
      </div>
    </Modal>
  );
};

export default WalletDetailsModal;
