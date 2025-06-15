import { FC, ReactNode, useState, useCallback, useMemo, memo } from "react";
import { motion } from "framer-motion";
import {
  OrderDetails,
  TradeDetails,
  TradeTransactionInfo,
} from "../../../utils/types";
import { FaCopy } from "react-icons/fa";
import { LuMessageSquare } from "react-icons/lu";
import Button from "../../common/Button";
import { IoChevronBack } from "react-icons/io5";
import TradeDetailRow from "../view/TradeDetailRow";

interface BaseStatusProps {
  statusTitle: string;
  statusDescription?: string;
  statusAlert?: ReactNode;
  orderDetails?: OrderDetails;
  tradeDetails?: TradeDetails;
  transactionInfo?: TradeTransactionInfo;
  contactLabel?: string;
  onContact?: () => void;
  actionButtons?: ReactNode;
  showTimer?: boolean;
  timeRemaining?: { minutes: number; seconds: number };
}

const BaseStatus: FC<BaseStatusProps> = memo(
  ({
    statusTitle,
    statusDescription,
    statusAlert,
    orderDetails,
    tradeDetails,
    transactionInfo,
    contactLabel = "Contact Seller",
    onContact,
    actionButtons,
    showTimer,
    timeRemaining,
  }) => {
    const [copied, setCopied] = useState(false);

    const derivedData = useMemo(() => {
      const productName =
        tradeDetails?.productName ||
        orderDetails?.product?.name ||
        "Unknown Product";

      const orderId = tradeDetails?.orderNo || orderDetails?._id || "";

      const amount =
        tradeDetails?.amount || orderDetails?.product?.price || "0";

      const quantity = (() => {
        const qty = tradeDetails?.quantity || orderDetails?.quantity;
        return qty !== undefined ? qty.toString() : "0";
      })();

      const orderTime =
        tradeDetails?.orderTime || orderDetails?.formattedDate || "Unknown";

      const tradeType = tradeDetails?.tradeType || "BUY";

      const paymentMethod = tradeDetails?.paymentMethod || "CRYPTO";

      return {
        productName,
        orderId,
        amount,
        quantity,
        orderTime,
        tradeType,
        paymentMethod,
      };
    }, [
      tradeDetails?.productName,
      tradeDetails?.orderNo,
      tradeDetails?.amount,
      tradeDetails?.quantity,
      tradeDetails?.orderTime,
      tradeDetails?.tradeType,
      tradeDetails?.paymentMethod,
      orderDetails?.product?.name,
      orderDetails?.product?.price,
      orderDetails?._id,
      orderDetails?.quantity,
      orderDetails?.formattedDate,
    ]);

    const copyOrderId = useCallback((id: string) => {
      navigator.clipboard.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }, []);

    const handleGoBack = useCallback(() => {
      window.history.back();
    }, []);

    const TimerComponent = useMemo(() => {
      if (!showTimer || !timeRemaining) return null;

      return (
        <motion.div
          className="flex gap-2 items-center self-end sm:self-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {onContact && (
            <Button
              title={contactLabel}
              className="bg-transparent hover:bg-gray-700 text-white text-sm px-4 py-2 border border-Red rounded-2xl transition-colors flex items-center gap-x-2 justify-center"
              onClick={onContact}
              icon={<LuMessageSquare className="w-5 h-5 text-Red" />}
              iconPosition="start"
            />
          )}
          <div className="flex gap-1">
            <div className="bg-Red text-white text-xl font-bold rounded px-2 py-1 min-w-[36px] text-center">
              {String(timeRemaining.minutes).padStart(2, "0")}
            </div>
            <span className="text-white text-xl">:</span>
            <div className="bg-Red text-white text-xl font-bold rounded px-2 py-1 min-w-[36px] text-center">
              {String(timeRemaining.seconds).padStart(2, "0")}
            </div>
          </div>
        </motion.div>
      );
    }, [showTimer, timeRemaining, onContact, contactLabel]);

    const ContactButton = useMemo(() => {
      if (showTimer || !onContact) return null;

      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="self-end sm:self-auto"
        >
          <Button
            title={contactLabel}
            className="bg-transparent hover:bg-gray-700 text-white text-sm px-4 py-2 border border-Red rounded-2xl transition-colors flex items-center gap-x-2 justify-center"
            onClick={onContact}
            icon={<LuMessageSquare className="w-5 h-5 text-Red" />}
            iconPosition="start"
          />
        </motion.div>
      );
    }, [showTimer, onContact, contactLabel]);

    const TransactionInfoSection = useMemo(
      () => (
        <motion.div
          className="bg-[#292B30] rounded-lg overflow-hidden shadow-lg mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <div className="py-4 px-6 md:px-12">
            <div className="mb-4">
              <h3 className="text-white text-lg font-medium">
                Transaction Info
              </h3>
            </div>
            <div className="space-y-2">
              <TradeDetailRow
                label="Seller's Name"
                value={transactionInfo?.sellerName || "Unknown"}
              />
              <TradeDetailRow
                label="Good Rating %"
                value={`${transactionInfo?.goodRating || 0}%`}
              />
              <TradeDetailRow
                label="Completed Order(s) in 30 Days"
                value={`${transactionInfo?.completedOrders || 0} Order(s)`}
              />
              <TradeDetailRow
                label="30-Day Order Completion Rate"
                value={`${transactionInfo?.completionRate || 0}%`}
              />
              <TradeDetailRow
                label="Avg. Payment Time"
                value={`${transactionInfo?.avgPaymentTime || 0} Minute(s)`}
              />
            </div>
          </div>
        </motion.div>
      ),
      [transactionInfo]
    );

    return (
      <div className="w-full mx-auto">
        <motion.div
          className="flex items-center mb-8 justify-between flex-col sm:flex-row gap-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="w-full">
            <motion.button
              className="flex items-center text-gray-400 hover:text-white mb-4"
              whileHover={{ x: -3 }}
              transition={{ type: "spring", stiffness: 400 }}
              onClick={handleGoBack}
            >
              <IoChevronBack className="w-5 h-5" />
            </motion.button>
            <motion.h1
              className="text-2xl font-medium text-white"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              {statusTitle}
            </motion.h1>
            {statusDescription && (
              <motion.p
                className="text-gray-400 text-sm mt-2 w-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {statusDescription}
              </motion.p>
            )}
          </div>

          {TimerComponent}
          {ContactButton}
        </motion.div>

        {statusAlert && (
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {statusAlert}
          </motion.div>
        )}

        <motion.div
          className="bg-[#292B30] rounded-lg overflow-hidden shadow-lg mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <div className="py-4 px-6 md:px-12">
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <div className="w-fit flex flex-col gap-2">
                <div className="w-full flex gap-4 items-center">
                  <motion.h3
                    className="font-medium text-xl text-white"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    {derivedData.productName}
                  </motion.h3>
                  <motion.span
                    className={`${
                      derivedData.tradeType === "BUY"
                        ? "bg-green-500"
                        : "bg-red-500"
                    } h-fit text-white text-xs px-3 py-1 rounded-full`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    {derivedData.tradeType}
                  </motion.span>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-700 py-8">
              <motion.div
                className="space-y-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Amount</span>
                  <span className="text-red-500 text-xl font-bold">
                    {derivedData.amount}
                  </span>
                </div>

                <div className="space-y-2">
                  <TradeDetailRow
                    label="Total Quantity"
                    value={derivedData.quantity}
                  />
                  <TradeDetailRow
                    label="Order Time"
                    value={derivedData.orderTime}
                  />
                  <TradeDetailRow
                    label="Order No."
                    value={
                      <div className="flex items-center">
                        <span className="mr-2">{derivedData.orderId}</span>
                        <motion.button
                          onClick={() => copyOrderId(derivedData.orderId)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <FaCopy className="text-gray-400 hover:text-white transition-colors" />
                        </motion.button>
                      </div>
                    }
                    bottomNote={
                      copied && (
                        <motion.p
                          className="w-full text-xs text-green-400 text-right mt-2 mb-1"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          Order number copied to clipboard!
                        </motion.p>
                      )
                    }
                  />
                  <TradeDetailRow
                    label="Payment Method"
                    value={derivedData.paymentMethod}
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {TransactionInfoSection}

        {actionButtons && <div className="my-4">{actionButtons}</div>}
      </div>
    );
  }
);

BaseStatus.displayName = "BaseStatus";

export default BaseStatus;
