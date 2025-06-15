import { FC } from "react";
import {
  OrderDetails,
  TradeDetails,
  TradeTransactionInfo,
} from "../../../utils/types";
import BaseStatus from "./BaseStatus";
import StatusAlert from "./StatusAlert";
import { BsShieldExclamation } from "react-icons/bs";

interface CancelledStatusProps {
  tradeDetails?: TradeDetails;
  orderDetails?: OrderDetails;
  transactionInfo?: TradeTransactionInfo;
  onContactSeller?: () => void;
  // onOrderDispute?: () => void;
}

const CancelledStatus: FC<CancelledStatusProps> = ({
  tradeDetails,
  //   orderDetails,
  transactionInfo,
  onContactSeller,
  //   onOrderDispute,
}) => {
  return (
    <BaseStatus
      statusTitle="Order Cancelled"
      statusDescription="This order has been cancelled and is no longer active."
      statusAlert={
        <StatusAlert
          icon={<BsShieldExclamation size={20} className="text-red-600" />}
          message="This order has been concluded, and the assets are no longer locked by Desemnart. Do not blindly trust strangers or release funds without confirming."
          verificationMessage="To ensure the safety of your funds, please verify the real name of the payer: Femi Cole"
          type="warning"
        />
      }
      tradeDetails={tradeDetails}
      //   orderDetails={orderDetails}
      transactionInfo={transactionInfo}
      contactLabel="Contact Support"
      onContact={onContactSeller}
      actionButtons={null}
    />
  );
};

export default CancelledStatus;
