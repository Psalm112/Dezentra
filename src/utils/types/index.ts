//user
export interface UserProfile {
  milestones: {
    sales: number;
    purchases: number;
  };
  _id: string;
  googleId: string;
  email: string;
  name: string;
  profileImage: File | string;
  isMerchant: boolean;
  rating: number;
  totalPoints: number;
  availablePoints: number;
  referralCount: number;
  isReferralCodeUsed: boolean;
  referralCode: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
  address?: string;
  dateOfBirth?: string;
  phoneNumber?: string;
}

//product
export interface ProductVariant {
  quantity: number;
  [key: string]: any;
}
export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  seller: string | { _id: string; name: string };
  images: string[];
  isSponsored: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  stock: number | string;
  type: ProductVariant[];
  logisticsCost: string[];
  logisticsProviders: string[];
}
//review
export interface Review {
  _id: string;
  reviewer:
    | {
        _id: string;
        name: string;
        profileImage: string;
      }
    | string;
  reviewed:
    | {
        _id: string;
        name: string;
        profileImage: string;
      }
    | string;
  order:
    | {
        _id: string;
        product: string;
      }
    | string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

//trade and order

export interface Order {
  _id: string;
  product: {
    _id: string;
    name: string;
    price: number;
    images: string[];
    tradeId: string;
    logisticsCost: string[];
    logisticsProviders: string[];
  };
  buyer:
    | {
        _id: string;
        name: string;
        profileImage: string;
      }
    | string;
  seller:
    | {
        _id: string;
        name: string;
        profileImage: string;
        rating?: number;
      }
    | string;
  amount: number;
  status: OrderStatus;
  dispute?: {
    raisedBy: string;
    reason: string;
    resolved: boolean;
    createdAt?: string;
    updatedAt?: string;
  };
  sellerWalletAddress: string;
  createdAt: string;
  quantity: number;
  updatedAt: string;
  logisticsProviderWalletAddress: string[];
  purchaseId: string;
}

export interface OrderStatusUpdate {
  _id: string;
  product: string;
  buyer: string;
  seller: string;
  amount: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface BuyTradeParams {
  seller: string;
  productCost: string | number;
  logisticsProvider: string;
  logisticsCost: string | number;
  useUSDT: boolean;
  orderId: string;
}
export interface CreateTradeParams {
  productCost: number;
  logisticsProvider: string[];
  logisticsCost: number[];
  useUSDT: boolean;
  totalQuantity: string;
}

export interface TradeResponse {
  status: "success" | "error";
  message: string;
  data: any;
}
export interface LogisticsProvider {
  address: string;
  name: string;
  location: string;
  cost: number; // in USDT
}

// export type NotificationType = "update" | "funds" | "buyer" | "system";

// export interface Notification {
//   id: string;
//   type: NotificationType;
//   message: string;
//   isRead: boolean;
//   timestamp: Date;
//   icon?: string;
//   link?: string;
// }

export type TabType = "1" | "2" | "3" | "4" | "5";
export type TradeTab = "buy" | "sell" | "active" | "completed";

export interface TabOption {
  id: TabType;
  label: string;
}

export interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  options: TabOption[];
}

//referrals

export interface ReferralInfo {
  referralCode: string;
  referralCount: number;
}
export interface RewardItem {
  id: string;
  name: string;
  action?: "from" | "to";
  type: string;
  points: number;
  date: string;
  status?: string;
}

export interface ReferralHistoryProps {
  history: RewardItem[];
  // onInviteFriends: () => void;
}

export interface ReferralData
  extends Omit<ReferralHistoryProps, "onInviteFriends"> {
  activePoints: number;
  usedPoints: number;
  promoCode: string;
}

// watchlist/favourites

export interface WatchlistItem {
  _id: string;
  user: string;
  product: {
    _id: string;
    name: string;
    price: number;
    seller: string;
    images: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface WatchlistCheck {
  isWatchlist: boolean;
}

//rewards

export interface Reward {
  _id: string;
  userId: string;
  actionType: string;
  points: number;
  referenceId: string;
  createdAt: string;
  updatedAt: string;
}

export interface RewardSummary {
  milestones: {
    sales: number;
    purchases: number;
  };
  _id: string;
  totalPoints: number;
  availablePoints: number;
}

//notifications
export interface Notification {
  _id: string;
  recipient: string;
  type: string;
  message: string;
  read: boolean;
  metadata: {
    orderId?: string;
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
}

export interface NotificationCount {
  count: number;
}

export interface MarkReadResponse {
  success: boolean;
  acknowledged: boolean;
  modifiedCount: number;
  upsertedId: null | string;
  upsertedCount: number;
  matchedCount: number;
}

//order and trade
export type TradeStatusType = "cancelled" | "pending" | "release" | "completed";

export type OrderStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "completed"
  | "disputed"
  | "refunded"
  | "delivery_confirmed";

export interface TradeDetails {
  productName: string;
  productId: string;
  amount: number;
  quantity: number;
  orderTime: string;
  orderNo: string;
  sellerId: string;
  buyerId: string;
  paymentMethod?: string;
  tradeType: "BUY" | "SELL";
}
export interface OrderDetails extends Order {
  formattedDate: string;
  formattedAmount: string;
}

export interface TradeTransactionInfo {
  buyerName: string;
  sellerName: string;
  goodRating: number;
  completedOrders: number;
  completionRate: number;
  avgPaymentTime: number;
}

export interface StatusProps {
  status: TradeStatusType;
  tradeDetails?: TradeDetails;
  transactionInfo?: TradeTransactionInfo;
  onContactSeller?: () => void;
  onContactBuyer?: () => void;
  onOrderDispute?: (reason: string) => Promise<void>;
  onReleaseNow?: () => void;
  onConfirmDelivery?: () => void;
  orderId?: string;
}

export interface pendingTransactionProps {
  type: "escrow" | "delivery";
  contractAddress?: string;
  amount?: string;
  tradeId?: string;
}

//chat
export interface Message {
  _id: string;
  sender: string | UserProfile;
  recipient: string | UserProfile;
  content: string;
  read: boolean;
  order?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  user: {
    _id: string;
    name: string;
    profileImage: string;
  };
  lastMessage: Message;
  unreadCount: number;
}

export interface SendMessageParams {
  recipient: string;
  content: string;
  order?: string;
}

export interface MarkReadParams {
  messageIds: string[];
}
