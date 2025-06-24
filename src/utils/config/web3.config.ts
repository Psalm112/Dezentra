import { http, createConfig, fallback } from "wagmi";
import {
  baseSepolia,
  sepolia,
  arbitrumSepolia,
  avalancheFuji,
} from "wagmi/chains";
import { coinbaseWallet, metaMask, walletConnect } from "wagmi/connectors";

// RPC endpoints for better reliability
const rpcEndpoints = {
  [baseSepolia.id]: [
    "https://sepolia.base.org",
    "https://base-sepolia-rpc.publicnode.com",
  ],
  [sepolia.id]: [
    "https://ethereum-sepolia-rpc.publicnode.com",
    "https://sepolia.infura.io/v3/" +
      (import.meta.env.VITE_INFURA_PROJECT_ID || ""),
    "https://rpc.sepolia.org",
  ],
  [arbitrumSepolia.id]: [
    "https://sepolia-rollup.arbitrum.io/rpc",
    "https://arbitrum-sepolia.publicnode.com",
  ],
  [avalancheFuji.id]: [
    "https://api.avax-test.network/ext/bc/C/rpc",
    "https://avalanche-fuji-c-chain-rpc.publicnode.com",
  ],
};

// USDT contract addresses for each supported chain
export const USDT_ADDRESSES = {
  [baseSepolia.id]: import.meta.env.VITE_USDT_CONTRACT_ADDRESS_BASE_SEPOLIA!,
  [sepolia.id]: import.meta.env.VITE_USDT_CONTRACT_ADDRESS_SEPOLIA!,
  [arbitrumSepolia.id]: import.meta.env.VITE_USDT_CONTRACT_ADDRESS_ARB_SEPOLIA!,
  [avalancheFuji.id]: import.meta.env
    .VITE_USDT_CONTRACT_ADDRESS_AVALANCHE_FUJI!,
} as const;

// Escrow contract addresses for each supported chain
export const ESCROW_ADDRESSES = {
  [baseSepolia.id]: import.meta.env.VITE_ESCROW_CONTRACT_BASE_SEPOLIA!,
  [sepolia.id]: import.meta.env.VITE_ESCROW_CONTRACT_SEPOLIA!,
  [arbitrumSepolia.id]: import.meta.env.VITE_ESCROW_CONTRACT_ARB_SEPOLIA!,
  [avalancheFuji.id]: import.meta.env.VITE_ESCROW_CONTRACT_AVALANCHE_FUJI!,
} as const;

// CCIP Router addresses for each chain
export const CCIP_ROUTER_ADDRESSES = {
  [baseSepolia.id]: "0xD3b06cEbF099CE7DA4AcCf578aaebFDBd6e88a93",
  [sepolia.id]: "0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59",
  [arbitrumSepolia.id]: "0x2a9C5afB0d0e4BAb2BCdaE109EC4b0c4Be15a165",
  [avalancheFuji.id]: "0xF694E193200268f9a4868e4Aa017A0118C9a8177",
} as const;

// CCIP Chain selectors for cross-chain operations
export const CCIP_CHAIN_SELECTORS = {
  [baseSepolia.id]: "10344971235874465080",
  [sepolia.id]: "16015286601757825753",
  [arbitrumSepolia.id]: "3478487238524512106",
  [avalancheFuji.id]: "14767482510784806043",
} as const;

// Chain metadata for display purposes
export const CHAIN_METADATA = {
  [baseSepolia.id]: {
    name: "Base Sepolia",
    shortName: "BASE",
    icon: "https://bridge.base.org/icons/base.svg",
    color: "#0052ff",
  },
  [sepolia.id]: {
    name: "Ethereum Sepolia",
    shortName: "ETH",
    icon: "https://ethereum.org/static/655ede01eb7c29458fcd8429c6c6b4fa/71c57/eth-diamond-black.png",
    color: "#627eea",
  },
  [arbitrumSepolia.id]: {
    name: "Arbitrum Sepolia",
    shortName: "ARB",
    icon: "https://arbitrum.io/wp-content/uploads/2021/01/cropped-Arbitrum_Symbol_-_Full_color_-_White_background-32x32.png",
    color: "#28a0f0",
  },
  [avalancheFuji.id]: {
    name: "Avalanche Fuji",
    shortName: "AVAX",
    icon: "https://cryptologos.cc/logos/avalanche-avax-logo.png",
    color: "#e84142",
  },
} as const;

// Default chain - Avalanche Fuji for hackathon
export const TARGET_CHAIN = avalancheFuji;

// Supported chains for the application
export const SUPPORTED_CHAINS = [
  avalancheFuji,
  baseSepolia,
  sepolia,
  arbitrumSepolia,
];

// Get destination chains (excluding current chain)
export const getDestinationChains = (currentChainId: number) => {
  return SUPPORTED_CHAINS.filter((chain) => chain.id !== currentChainId);
};

// Check if cross-chain operation is supported
export const isCrossChainSupported = (
  sourceChainId: number,
  destinationChainId: number
): boolean => {
  const supportedChainIds = SUPPORTED_CHAINS.map((chain) => chain.id);
  return (
    supportedChainIds.includes(sourceChainId as any) &&
    supportedChainIds.includes(destinationChainId as any)
  );
};

// Get chain selector for CCIP
export const getChainSelector = (chainId: number): string | undefined => {
  return CCIP_CHAIN_SELECTORS[chainId as keyof typeof CCIP_CHAIN_SELECTORS];
};

// Wagmi configuration
export const wagmiConfig = createConfig({
  chains: SUPPORTED_CHAINS as any,
  connectors: [
    metaMask({
      dappMetadata: {
        name: "Dezenmart - Cross-Chain Marketplace",
        url: window.location.origin,
      },
    }),
    coinbaseWallet({
      appName: "Dezenmart",
      appLogoUrl: window.location.origin + "/images/logo-full.png",
    }),
    ...(import.meta.env.VITE_WALLETCONNECT_PROJECT_ID
      ? [
          walletConnect({
            projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID,
            metadata: {
              name: "Dezenmart",
              description:
                "Cross-chain decentralized marketplace for secure crypto payments",
              url: window.location.origin,
              icons: [window.location.origin + "/images/logo-full.png"],
            },
            showQrModal: true,
          }),
        ]
      : []),
  ],
  transports: Object.fromEntries(
    SUPPORTED_CHAINS.map((chain) => [
      chain.id,
      fallback(
        rpcEndpoints[chain.id as keyof typeof rpcEndpoints]
          .filter((url) => url) // Remove empty URLs
          .map((url) =>
            http(url, {
              batch: {
                batchSize: 10,
                wait: 16,
              },
              retryCount: 3,
              retryDelay: 2000,
              timeout: 30000,
            })
          )
      ),
    ])
  ),
});

// Gas limits for different operations
export const GAS_LIMITS = {
  APPROVE: 100000n,
  BUY_TRADE: 800000n,
  BUY_TRADE_CROSS_CHAIN: 1200000n,
  CONFIRM_PURCHASE: 200000n,
  CONFIRM_DELIVERY: 200000n,
  CREATE_TRADE: 600000n,
  RAISE_DISPUTE: 300000n,
  CANCEL_PURCHASE: 250000n,
} as const;

// Fee estimates for cross-chain operations (in wei)
export const CROSS_CHAIN_FEES = {
  [baseSepolia.id]: {
    [sepolia.id]: "500000000000000", // 0.0005 ETH
    [arbitrumSepolia.id]: "300000000000000", // 0.0003 ETH
    [avalancheFuji.id]: "800000000000000", // 0.0008 ETH
  },
  [sepolia.id]: {
    [baseSepolia.id]: "500000000000000",
    [arbitrumSepolia.id]: "400000000000000",
    [avalancheFuji.id]: "900000000000000",
  },
  [arbitrumSepolia.id]: {
    [baseSepolia.id]: "300000000000000",
    [sepolia.id]: "400000000000000",
    [avalancheFuji.id]: "700000000000000",
  },
  [avalancheFuji.id]: {
    [baseSepolia.id]: "800000000000000",
    [sepolia.id]: "900000000000000",
    [arbitrumSepolia.id]: "700000000000000",
  },
} as const;

// Get estimated cross-chain fee
export const getCrossChainFee = (
  sourceChainId: number,
  destinationChainId: number
): string => {
  const fees = CROSS_CHAIN_FEES[sourceChainId as keyof typeof CROSS_CHAIN_FEES];
  if (!fees) return "1000000000000000"; // Default 0.001 ETH
  return (fees as any)[destinationChainId] || "1000000000000000";
};
