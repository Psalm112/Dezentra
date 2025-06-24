import { http, createConfig, fallback } from "wagmi";
import { celo, celoAlfajores } from "wagmi/chains";
import { coinbaseWallet, metaMask, walletConnect } from "wagmi/connectors";

const rpcEndpoints = {
  [celo.id]: ["https://forno.celo.org", "https://rpc.ankr.com/celo"],
  [celoAlfajores.id]: ["https://alfajores-forno.celo-testnet.org"],
};
export const USDT_ADDRESSES = {
  [celo.id]: import.meta.env.VITE_USDT_CONTRACT_ADDRESS_MAINNET!,
  [celoAlfajores.id]: import.meta.env.VITE_USDT_CONTRACT_ADDRESS_TESTNET!,
} as const;

export const ESCROW_ADDRESSES = {
  [celo.id]: import.meta.env.VITE_ESCROW_CONTRACT_MAINNET!,
  [celoAlfajores.id]: import.meta.env.VITE_ESCROW_CONTRACT_TESTNET!,
} as const;

// export const TARGET_CHAIN =
//   process.env.NODE_ENV === "production" ? celo : celoAlfajores;
export const TARGET_CHAIN = celoAlfajores;
export const wagmiConfig = createConfig({
  chains: [celo, celoAlfajores],
  connectors: [
    metaMask({
      dappMetadata: {
        name: "Dezenmart",
        url: window.location.origin,
      },
    }),
    coinbaseWallet({
      appName: "Dezenmart",
      appLogoUrl: `${window.location.origin}/images/logo-full.png`,
    }),
    ...(import.meta.env.VITE_WALLETCONNECT_PROJECT_ID
      ? [
          walletConnect({
            projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID,
            metadata: {
              name: "Dezenmart",
              description:
                "Decentralized marketplace for secure crypto payments",
              url: window.location.origin,
              icons: [`${window.location.origin}/images/logo-full.png`],
            },
            showQrModal: true,
          }),
        ]
      : []),
  ],
  transports: {
    [celo.id]: fallback(
      rpcEndpoints[celoAlfajores.id].map((url) =>
        http(undefined, {
          batch: true,
          retryCount: 3,
          retryDelay: 1000,
        })
      )
    ),
    [celoAlfajores.id]: fallback(
      rpcEndpoints[celoAlfajores.id].map((url) =>
        http(undefined, {
          batch: true,
          retryCount: 3,
          retryDelay: 1000,
        })
      )
    ),
  },
});
