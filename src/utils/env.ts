const requiredEnvVars = [
  "VITE_API_URL",
  "VITE_ESCROW_CONTRACT_TESTNET",
  "VITE_USDT_CONTRACT_ADDRESS_TESTNET",
  "VITE_WALLETCONNECT_PROJECT_ID",
] as const;

export function validateEnv() {
  const missing = requiredEnvVars.filter((key) => !import.meta.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }
}
