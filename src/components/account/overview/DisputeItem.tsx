import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { RiVerifiedBadgeFill } from "react-icons/ri";
import Button from "../../common/Button";
import { FaArrowRightLong } from "react-icons/fa6";
import { useCurrency } from "../../../context/CurrencyContext";
import { Order } from "../../../utils/types";

interface DisputeItemProps {
  order: Order & {
    formattedDate?: string;
    formattedUsdtPrice?: string;
    formattedCeloPrice?: string;
    formattedFiatPrice?: string;
    formattedUsdtAmount?: string;
    formattedCeloAmount?: string;
    formattedFiatAmount?: string;
    usdtPrice?: number;
    celoPrice?: number;
    fiatPrice?: number;
  };
  disputeStatus: string;
}

const DisputeItem: React.FC<DisputeItemProps> = React.memo(
  ({ order, disputeStatus }) => {
    const { secondaryCurrency } = useCurrency();

    const secondaryPrice = useMemo(() => {
      switch (secondaryCurrency) {
        case "USDT":
          return {
            unit: order.formattedUsdtPrice,
            total: order.formattedUsdtAmount,
          };
        default:
          return {
            unit: order.formattedFiatPrice,
            total: order.formattedFiatAmount,
          };
      }
    }, [secondaryCurrency, order]);

    const formattedDate = useMemo(() => {
      if (order.formattedDate) return order.formattedDate;
      return order.dispute?.createdAt
        ? new Date(order.dispute.createdAt).toLocaleDateString()
        : new Date(order.createdAt).toLocaleDateString();
    }, [order]);

    const getStatusStyle = useMemo(() => {
      const statusStyles = {
        pending: "bg-yellow-800/30 text-yellow-300",
        "in review": "bg-blue-800/30 text-blue-300",
        resolved: "bg-green-800/30 text-green-300",
        rejected: "bg-red-800/30 text-red-300",
      };

      return (
        statusStyles[
          disputeStatus.toLowerCase() as keyof typeof statusStyles
        ] || "bg-[#543A2E] text-orange-300"
      );
    }, [disputeStatus]);

    const sellerName = useMemo(
      () =>
        typeof order?.seller === "object"
          ? order?.seller?.name
          : order?.seller || "Unknown Vendor",
      [order?.seller]
    );

    const productImage = useMemo(
      () =>
        order?.product?.images?.[0] ||
        "https://placehold.co/300x300?text=No+Image",
      [order?.product?.images]
    );

    return (
      <motion.div
        className="grid grid-cols-1 xs:grid-cols-[2fr_3fr] h-full items-center gap-6 md:gap-10 p-6 md:px-[10%] lg:px-[15%] md:py-10 bg-[#292B30] mt-8 rounded-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        whileHover={{ scale: 1.01 }}
      >
        <motion.img
          src={productImage}
          alt={order?.product?.name || "Unknown Product"}
          className="w-full h-auto mx-auto md:mx-0 rounded-md lg:row-span-2 object-cover aspect-square"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          loading="lazy"
        />

        <div className="flex flex-col w-full text-left">
          <h3 className="font-normal text-2xl md:text-3xl text-white truncate">
            {order?.product?.name || "Unknown Product"}
          </h3>
          <span className="flex items-center gap-2 text-sm text-[#AEAEB2] mb-4">
            By {sellerName}
            <RiVerifiedBadgeFill className="text-[#4FA3FF] text-xs" />
          </span>

          <div className="flex justify-between text-sm text-white mb-2">
            <span>Unit Price:</span>
            <div className="text-right">
              <div className="text-white font-medium">
                {order.formattedCeloPrice}
              </div>
              <div className="text-[#AEAEB2] text-xs">
                {secondaryPrice.unit}
              </div>
            </div>
          </div>

          {order?.quantity && order?.quantity > 1 && (
            <div className="flex justify-between text-sm text-white mb-2">
              <span>Total ({order?.quantity} items):</span>
              <div className="text-right">
                <div className="text-white font-medium">
                  {order.formattedCeloAmount}
                </div>
                <div className="text-[#AEAEB2] text-xs">
                  {secondaryPrice.total}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between text-sm text-white mb-2">
            <span>Dispute Raised:</span>
            <span>{formattedDate}</span>
          </div>
          <div className="flex justify-between text-sm text-white mb-2">
            <span>Dispute Status:</span>
            <span className={`px-2 py-1 rounded text-xs ${getStatusStyle}`}>
              {disputeStatus}
            </span>
          </div>
        </div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="text-center xs:col-span-2 mx-auto xs:w-[80%] w-full lg:w-full lg:col-start-2"
        >
          <Button
            title="View Dispute"
            className="flex justify-between items-center w-full bg-Red border-0 rounded text-white px-6 py-2 w-full transition-colors hover:bg-[#e02d37]"
            path=""
            icon={<FaArrowRightLong />}
          />
        </motion.div>
      </motion.div>
    );
  }
);

DisputeItem.displayName = "DisputeItem";

export default DisputeItem;
