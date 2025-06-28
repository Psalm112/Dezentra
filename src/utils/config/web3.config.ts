import { http, createConfig, fallback } from "wagmi";
import {
  baseSepolia,
  sepolia,
  arbitrumSepolia,
  avalancheFuji,
} from "wagmi/chains";
import { coinbaseWallet, metaMask, walletConnect } from "wagmi/connectors";
import { ChainMetadata } from "../types/web3.types";
import { createClient } from "viem";

// RPC endpoints with fallbacks
const rpcEndpoints = {
  [avalancheFuji.id]: [
    "https://api.avax-test.network/ext/bc/C/rpc",
    "https://avalanche-fuji-c-chain-rpc.publicnode.com",
    "https://rpc.ankr.com/avalanche_fuji",
  ],
  [baseSepolia.id]: [
    "https://sepolia.base.org",
    "https://base-sepolia-rpc.publicnode.com",
    "https://rpc.notadegen.com/base/sepolia",
  ],
  [sepolia.id]: [
    "https://ethereum-sepolia-rpc.publicnode.com",
    "https://sepolia.infura.io/v3/" +
      (import.meta.env.VITE_INFURA_PROJECT_ID || ""),
    "https://rpc.sepolia.org",
    "https://rpc.ankr.com/eth_sepolia",
  ],
  [arbitrumSepolia.id]: [
    "https://sepolia-rollup.arbitrum.io/rpc",
    "https://arbitrum-sepolia.publicnode.com",
    "https://rpc.ankr.com/arbitrum_sepolia",
  ],
} as const;

// Contract addresses
export const USDT_ADDRESSES = {
  [avalancheFuji.id]: import.meta.env
    .VITE_USDT_CONTRACT_ADDRESS_AVALANCHE_FUJI!,
  [baseSepolia.id]: import.meta.env.VITE_USDT_CONTRACT_ADDRESS_BASE_SEPOLIA!,
  [sepolia.id]: import.meta.env.VITE_USDT_CONTRACT_ADDRESS_SEPOLIA!,
  [arbitrumSepolia.id]: import.meta.env.VITE_USDT_CONTRACT_ADDRESS_ARB_SEPOLIA!,
} as const;

export const ESCROW_ADDRESSES = {
  [avalancheFuji.id]: import.meta.env.VITE_ESCROW_CONTRACT_AVALANCHE_FUJI!,
  [baseSepolia.id]: import.meta.env.VITE_ESCROW_CONTRACT_BASE_SEPOLIA!,
  [sepolia.id]: import.meta.env.VITE_ESCROW_CONTRACT_SEPOLIA!,
  [arbitrumSepolia.id]: import.meta.env.VITE_ESCROW_CONTRACT_ARB_SEPOLIA!,
} as const;

// CCIP Router addresses
export const CCIP_ROUTER_ADDRESSES = {
  [avalancheFuji.id]: "0xF694E193200268f9a4868e4Aa017A0118C9a8177",
  [baseSepolia.id]: "0xD3b06cEbF099CE7DA4AcCf578aaebFDBd6e88a93",
  [sepolia.id]: "0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59",
  [arbitrumSepolia.id]: "0x2a9C5afB0d0e4BAb2BCdaE109EC4b0c4Be15a165",
} as const;

// CCIP Chain selectors
export const CCIP_CHAIN_SELECTORS = {
  [avalancheFuji.id]: "14767482510784806043",
  [baseSepolia.id]: "10344971235874465080",
  [sepolia.id]: "16015286601757825753",
  [arbitrumSepolia.id]: "3478487238524512106",
} as const;

// Chain metadata
export const CHAIN_METADATA: ChainMetadata = {
  [avalancheFuji.id]: {
    name: "Avalanche Fuji",
    shortName: "AVAX",
    icon: "/images/avalanche-logo.svg",
    color: "#e84142",
    nativeCurrency: "AVAX",
    blockExplorer: "https://testnet.snowtrace.io",
  },
  [baseSepolia.id]: {
    name: "Base Sepolia",
    shortName: "BASE",
    icon: "https://bridge.base.org/icons/base.svg",
    color: "#0052ff",
    nativeCurrency: "ETH",
    blockExplorer: "https://sepolia.basescan.org",
  },
  [sepolia.id]: {
    name: "Ethereum Sepolia",
    shortName: "ETH",
    icon: "/images/ethereum-logo.svg",
    color: "#627eea",
    nativeCurrency: "ETH",
    blockExplorer: "https://sepolia.etherscan.io",
  },
  [arbitrumSepolia.id]: {
    name: "Arbitrum Sepolia",
    shortName: "ARB",
    icon: "/images/arbitrum-logo.svg",
    color: "#28a0f0",
    nativeCurrency: "ETH",
    blockExplorer: "https://sepolia.arbiscan.io",
  },
} as const;

// Primary chain for hackathon - Avalanche Fuji
export const TARGET_CHAIN = avalancheFuji;

// Supported chains
export const SUPPORTED_CHAINS = [
  avalancheFuji,
  baseSepolia,
  sepolia,
  arbitrumSepolia,
] as const;

// Cross-chain compatible pairs
export const CROSS_CHAIN_PAIRS: Record<number, number[]> = {
  [avalancheFuji.id]: [baseSepolia.id, sepolia.id, arbitrumSepolia.id],
  [baseSepolia.id]: [avalancheFuji.id, sepolia.id, arbitrumSepolia.id],
  [sepolia.id]: [avalancheFuji.id, baseSepolia.id, arbitrumSepolia.id],
  [arbitrumSepolia.id]: [avalancheFuji.id, baseSepolia.id, sepolia.id],
} as const;

// Utility functions
export const getDestinationChains = (currentChainId: number) => {
  const pairs = CROSS_CHAIN_PAIRS[currentChainId];
  return SUPPORTED_CHAINS.filter((chain) => pairs?.includes(chain.id));
};

export const isCrossChainSupported = (
  sourceChainId: number,
  destinationChainId: number
): boolean => {
  const pairs = CROSS_CHAIN_PAIRS[sourceChainId];
  return Boolean(pairs?.includes(destinationChainId));
};

export const getChainSelector = (chainId: number): string | undefined => {
  return CCIP_CHAIN_SELECTORS[chainId as keyof typeof CCIP_CHAIN_SELECTORS];
};

export const getChainMetadata = (chainId: number) => {
  return CHAIN_METADATA[chainId as keyof typeof CHAIN_METADATA];
};

// Performance configuration
export const PERFORMANCE_CONFIG = {
  CACHE_DURATION: 30000,
  POLLING_INTERVAL: 8000,
  BATCH_SIZE: 512,
  BATCH_WAIT: 8,
  RETRY_COUNT: 2,
  RETRY_DELAY: 1000,
  TIMEOUT: 15000,
} as const;

// Wagmi configuration
export const wagmiConfig = createConfig({
  chains: SUPPORTED_CHAINS as any,
  connectors: [
    metaMask({
      dappMetadata: {
        name: "Dezentra - Cross-Chain Marketplace",
        url: window.location.origin,
        iconUrl: `${window.location.origin}/favicon.ico`,
      },
    }),
    coinbaseWallet({
      appName: "Dezentra",
      appLogoUrl: `${window.location.origin}/images/logo-full.png`,
      darkMode: false,
    }),
    ...(import.meta.env.VITE_WALLETCONNECT_PROJECT_ID
      ? [
          walletConnect({
            projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID,
            metadata: {
              name: "Dezentra",
              description:
                "Cross-chain decentralized marketplace for secure crypto payments",
              url: window.location.origin,
              icons: [`${window.location.origin}/images/logo-full.png`],
            },
            showQrModal: false,
            qrModalOptions: {
              themeMode: "dark",
              themeVariables: {
                "--wcm-z-index": "9999",
              },
            },
          }),
        ]
      : []),
  ],
  transports: Object.fromEntries(
    SUPPORTED_CHAINS.map((chain) => [
      chain.id,
      fallback(
        rpcEndpoints[chain.id as keyof typeof rpcEndpoints]
          .filter(Boolean)
          .map((url) =>
            http(url, {
              batch: {
                batchSize: PERFORMANCE_CONFIG.BATCH_SIZE,
                wait: PERFORMANCE_CONFIG.BATCH_WAIT,
              },
              retryCount: PERFORMANCE_CONFIG.RETRY_COUNT,
              retryDelay: PERFORMANCE_CONFIG.RETRY_DELAY,
              timeout: PERFORMANCE_CONFIG.TIMEOUT,
            })
          )
      ),
    ])
  ),
  batch: {
    multicall: {
      batchSize: PERFORMANCE_CONFIG.BATCH_SIZE,
      wait: PERFORMANCE_CONFIG.BATCH_WAIT,
    },
  },
  pollingInterval: PERFORMANCE_CONFIG.POLLING_INTERVAL,
});

// Gas limits
export const GAS_LIMITS = {
  APPROVE: 100000n,
  BUY_TRADE: 800000n,
  BUY_CROSS_CHAIN_TRADE: 1200000n,
  CONFIRM_PURCHASE: 200000n,
  CONFIRM_DELIVERY: 200000n,
  CONFIRM_CROSS_CHAIN_PURCHASE: 300000n,
  CONFIRM_CROSS_CHAIN_DELIVERY: 300000n,
  CREATE_TRADE: 600000n,
  RAISE_DISPUTE: 300000n,
  RAISE_CROSS_CHAIN_DISPUTE: 400000n,
  CANCEL_PURCHASE: 250000n,
  CANCEL_CROSS_CHAIN_PURCHASE: 350000n,
  REGISTER_BUYER: 100000n,
  REGISTER_SELLER: 100000n,
  REGISTER_LOGISTICS_PROVIDER: 100000n,
} as const;

// Cross-chain fee estimates (in wei)
export const CROSS_CHAIN_FEES = {
  [avalancheFuji.id]: {
    [baseSepolia.id]: "1000000000000000000", // 1 AVAX
    [sepolia.id]: "1200000000000000000", // 1.2 AVAX
    [arbitrumSepolia.id]: "800000000000000000", // 0.8 AVAX
  },
  [baseSepolia.id]: {
    [avalancheFuji.id]: "500000000000000", // 0.0005 ETH
    [sepolia.id]: "400000000000000", // 0.0004 ETH
    [arbitrumSepolia.id]: "300000000000000", // 0.0003 ETH
  },
  [sepolia.id]: {
    [avalancheFuji.id]: "600000000000000", // 0.0006 ETH
    [baseSepolia.id]: "400000000000000", // 0.0004 ETH
    [arbitrumSepolia.id]: "350000000000000", // 0.00035 ETH
  },
  [arbitrumSepolia.id]: {
    [avalancheFuji.id]: "450000000000000", // 0.00045 ETH
    [baseSepolia.id]: "300000000000000", // 0.0003 ETH
    [sepolia.id]: "350000000000000", // 0.00035 ETH
  },
} as const;

export const getCrossChainFee = (
  sourceChainId: number,
  destinationChainId: number
): string => {
  const fees = CROSS_CHAIN_FEES[sourceChainId as keyof typeof CROSS_CHAIN_FEES];
  if (!fees) return "1000000000000000";
  return (fees as any)[destinationChainId] || "1000000000000000";
};

// Contract interaction timeouts
export const TIMEOUTS = {
  TRANSACTION_CONFIRMATION: 300000, // 5 minutes
  CROSS_CHAIN_MESSAGE: 600000, // 10 minutes
  BALANCE_REFRESH: 30000, // 30 seconds
  ALLOWANCE_REFRESH: 15000, // 15 seconds
} as const;

export const CHAIN_IDS = {
  AVALANCHE_FUJI: 43113,
  BASE_SEPOLIA: 84532,
  SEPOLIA: 11155111,
  ARBITRUM_SEPOLIA: 421614,
} as const;

export const SUPPORTED_CHAIN_IDS = SUPPORTED_CHAINS.map((chain) => chain.id);
