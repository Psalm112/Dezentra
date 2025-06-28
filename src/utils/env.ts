const requiredEnvVars = [
  "VITE_API_URL",
  "VITE_ESCROW_CONTRACT_AVALANCHE_FUJI",
  "VITE_USDT_CONTRACT_ADDRESS_AVALANCHE_FUJI",
  "VITE_WALLETCONNECT_PROJECT_ID",
  "VITE_INFURA_KEY",
  "VITE_APP_NAME",
  "VITE_APP_VERSION",
  "VITE_ESCROW_CONTRACT_BASE_SEPOLIA",
  "VITE_USDT_CONTRACT_ADDRESS_BASE_SEPOLIA",
  "VITE_ESCROW_CONTRACT_SEPOLIA",
  "VITE_USDT_CONTRACT_ADDRESS_SEPOLIA",
  "VITE_ESCROW_CONTRACT_ARB_SEPOLIA",
  "VITE_USDT_CONTRACT_ADDRESS_ARB_SEPOLIA",
] as const;

export function validateEnv() {
  const missing = requiredEnvVars.filter((key) => !import.meta.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }
}
