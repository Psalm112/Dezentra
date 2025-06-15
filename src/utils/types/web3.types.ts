export interface WalletState {
  isConnected: boolean;
  address?: string;
  balance?: string;
  chainId?: number;
  isConnecting: boolean;
  error?: string;
}

export interface PaymentTransaction {
  hash: string;
  amount: string;
  token: string;
  to: string;
  from: string;
  status: "pending" | "confirmed" | "failed";
  timestamp: number;
  gasUsed?: string;
  gasPrice?: string;
  purchaseId?: string;
}

export interface EscrowPayment {
  orderId: string;
  amount: string;
  escrowAddress: string;
  buyerAddress: string;
  sellerAddress: string;
  status: "pending" | "escrowed" | "released" | "disputed";
}

export interface Web3ContextType {
  wallet: WalletState;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchToCorrectNetwork: () => Promise<void>;
  sendPayment: (params: PaymentParams) => Promise<PaymentTransaction>;
  getUSDTBalance: () => Promise<string>;
  getCurrentAllowance: () => Promise<number>;
  isCorrectNetwork: boolean;
}

export interface PaymentParams {
  to: string;
  amount: string;
  orderId: string;
}

export interface WalletEducationStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action?: string;
}

export interface BuyTradeParams {
  tradeId: string;
  quantity: string;
  logisticsProvider: string;
}

export interface TradeDetails {
  seller: string;
  productCost: bigint;
  escrowFee: bigint;
  totalQuantity: bigint;
  remainingQuantity: bigint;
  active: boolean;
  logisticsProviders: string[];
  logisticsCosts: bigint[];
}

export interface PaymentOrderDetails {
  _id: string;
  product: {
    _id: string;
    name: string;
    price: number;
    tradeId: string;
    logisticsCost: string[];
    logisticsProviders: string[];
  };
  amount: number;
  quantity: number;
  logisticsProviderWalletAddress: string;
  escrowAddress?: string;
}
