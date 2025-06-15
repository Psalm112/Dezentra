import { FC, memo } from "react";
import CancelledStatus from "./CancelledStatus";
import PendingPaymentStatus from "./PendingPaymentStatus";
import FundsReleaseStatus from "./FundsReleaseStatus";
import CompletedStatus from "./CompletedStatus";
import {
  OrderDetails,
  StatusProps,
  TradeDetails,
  TradeTransactionInfo,
} from "../../../utils/types";
import { ErrorBoundary } from "react-error-boundary";

interface TradeStatusProps extends StatusProps {
  orderDetails?: OrderDetails;
  navigatePath?: string;
  showTimer?: boolean;
}

const ErrorFallback = memo(({ error }: { error: Error }) => (
  <div className="p-4 bg-[#292B30] rounded-lg text-Red">
    <p className="font-medium mb-2">
      Something went wrong displaying the order status.
    </p>
    <p className="text-sm text-gray-400">{error.message}</p>
  </div>
));

ErrorFallback.displayName = "ErrorFallback";

const EmptyState = memo(() => (
  <div className="p-4 bg-[#292B30] rounded-lg text-center text-gray-400">
    Order information is not available.
  </div>
));

EmptyState.displayName = "EmptyState";

const TradeStatus: FC<TradeStatusProps> = memo(
  ({
    status,
    orderDetails,
    tradeDetails,
    transactionInfo,
    onContactSeller,
    onContactBuyer,
    onOrderDispute,
    onConfirmDelivery,
    onReleaseNow,
    orderId,
    navigatePath,
    showTimer = false,
  }) => {
    if (!tradeDetails && !orderDetails) {
      return <EmptyState />;
    }

    // defaults for transaction info
    const safeTransactionInfo: TradeTransactionInfo = transactionInfo || {
      buyerName: "Unknown",
      sellerName: "Unknown",
      goodRating: 0,
      completedOrders: 0,
      completionRate: 0,
      avgPaymentTime: 0,
    };

    return (
      <ErrorBoundary fallbackRender={ErrorFallback}>
        {renderStatusComponent(
          status,
          orderDetails,
          tradeDetails,
          safeTransactionInfo,
          onContactSeller,
          onContactBuyer,
          onOrderDispute,
          onConfirmDelivery,
          onReleaseNow,
          orderId,
          navigatePath,
          showTimer
        )}
      </ErrorBoundary>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.status === nextProps.status &&
      prevProps.orderDetails?._id === nextProps.orderDetails?._id &&
      prevProps.orderDetails?.status === nextProps.orderDetails?.status &&
      prevProps.orderId === nextProps.orderId
    );
  }
);

const renderStatusComponent = (
  status: string,
  orderDetails?: OrderDetails,
  tradeDetails?: TradeDetails,
  transactionInfo?: TradeTransactionInfo,
  onContactSeller?: () => void,
  onContactBuyer?: () => void,
  onOrderDispute?: (reason: string) => Promise<void>,
  onConfirmDelivery?: () => void,
  onReleaseNow?: () => void,
  orderId?: string,
  navigatePath?: string,
  showTimer?: boolean
) => {
  const commonProps = {
    tradeDetails,
    orderDetails,
    transactionInfo,
    onContactSeller,
    orderId,
    showTimer,
  };

  switch (status) {
    case "cancelled":
      return <CancelledStatus {...commonProps} />;

    case "pending":
      return (
        <PendingPaymentStatus
          {...commonProps}
          onOrderDispute={onOrderDispute}
          onReleaseNow={onReleaseNow}
          navigatePath={navigatePath}
        />
      );

    case "release":
      return (
        <FundsReleaseStatus
          {...commonProps}
          onOrderDispute={onOrderDispute}
          onConfirmDelivery={onConfirmDelivery}
        />
      );

    case "completed":
      return (
        <CompletedStatus
          orderDetails={orderDetails}
          tradeDetails={tradeDetails}
          onContactBuyer={onContactBuyer}
        />
      );

    default:
      return (
        <PendingPaymentStatus
          {...commonProps}
          onOrderDispute={onOrderDispute}
          onReleaseNow={onReleaseNow}
          navigatePath={navigatePath}
        />
      );
  }
};

TradeStatus.displayName = "TradeStatus";

export default TradeStatus;
