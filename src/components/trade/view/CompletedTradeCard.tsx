import { useState, FC, useMemo } from "react";
import { motion } from "framer-motion";
import Button from "../../common/Button";
import TradeCardBase from "./TradeCardBase";
import TradeDetailRow from "./TradeDetailRow";
import { FaCopy } from "react-icons/fa";
import { LuMessageSquare } from "react-icons/lu";
import { Order } from "../../../utils/types";
import { useCurrency } from "../../../context/CurrencyContext";

interface CompletedTradeCardProps {
  trade: Order & {
    formattedUsdtAmount: string;
    formattedCeloAmount: string;
    formattedFiatAmount: string;
    formattedDate: string;
  };
}

const CompletedTradeCard: FC<CompletedTradeCardProps> = ({ trade }) => {
  const [copied, setCopied] = useState(false);
  const { secondaryCurrency } = useCurrency();

  // Early return if trade data is incomplete
  // if (!trade || !trade.product) {
  //   return (
  //     <TradeCardBase className="mt-8 px-6 md:px-12 py-2">
  //       <div className="py-4 text-center text-gray-400">
  //         <p>Trade data unavailable</p>
  //       </div>
  //     </TradeCardBase>
  //   );
  // }

  const secondaryPrice = useMemo(() => {
    switch (secondaryCurrency) {
      case "USDT":
        return trade.formattedUsdtAmount || "0.00";
      default:
        return trade.formattedFiatAmount || "0.00";
    }
  }, [secondaryCurrency, trade]);

  const copyOrderId = (id: string) => {
    if (!id) return;
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const handleContactSeller = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  const handleCopyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    copyOrderId(trade?._id || "");
  };

  const getProductName = () => {
    return trade?.product?.name?.toUpperCase() || "UNKNOWN PRODUCT";
  };

  const getSellerId = () => {
    if (typeof trade?.seller === "object" && trade.seller) {
      return trade.seller._id;
    }
    return trade?.seller || "";
  };

  return (
    <TradeCardBase className="mt-8 px-6 md:px-12 py-2">
      <div className="py-4 flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="w-fit flex flex-col gap-2">
          <div className="w-full flex gap-4">
            <motion.h3
              className="font-medium text-xl text-white"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              {getProductName()}
            </motion.h3>
            <motion.span
              className="bg-green-500/20 text-white text-xs px-3 py-1 rounded-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              COMPLETED
            </motion.span>
          </div>
          <span className="text-gray-400 text-sm">
            {trade.formattedDate || "Date unavailable"}
          </span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          onClick={handleContactSeller}
        >
          <Button
            title="Contact Seller"
            className="bg-transparent hover:bg-gray-700 text-white text-sm px-4 py-2 border border-Red rounded-2xl transition-colors flex items-center gap-x-2 justify-center"
            path={getSellerId() ? `/chat/${getSellerId()}` : "#"}
            icon={<LuMessageSquare className="w-5 h-5 text-Red" />}
            iconPosition="start"
          />
        </motion.div>
      </div>

      <div className="border-t border-gray-700 py-10">
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex justify-between items-start">
            <span className="text-gray-400 text-sm">Amount</span>
            <span className="flex flex-col gap-2 text-right">
              <span className="text-red-500 text-xl font-bold">
                {trade.formattedCeloAmount || "0.00"}
              </span>
              <span className="text-gray-400 text-sm">{secondaryPrice}</span>
            </span>
          </div>

          <div className="space-y-2">
            <TradeDetailRow
              label="Total Quantity"
              value={trade?.quantity?.toString() || "1"}
            />
            <TradeDetailRow
              label="Order Time"
              value={trade.formattedDate || "Date unavailable"}
            />
            <TradeDetailRow
              label="Status"
              value={
                <span className="text-green-400/20 capitalize">
                  {trade?.status || "completed"}
                </span>
              }
            />
            <TradeDetailRow
              label="Order No."
              value={
                <div className="flex items-center">
                  <span className="mr-2">
                    {trade?._id?.slice(-12) || "N/A"}
                  </span>
                  {trade?._id && (
                    <motion.button
                      onClick={handleCopyClick}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <FaCopy className="text-gray-400 hover:text-white transition-colors" />
                    </motion.button>
                  )}
                </div>
              }
              bottomNote={
                copied && (
                  <motion.p
                    className="text-green-400 text-center mt-2 text-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    Code copied to clipboard!
                  </motion.p>
                )
              }
            />
          </div>
        </motion.div>
      </div>
    </TradeCardBase>
  );
};

export default CompletedTradeCard;
