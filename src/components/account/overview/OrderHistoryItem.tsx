import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { RiVerifiedBadgeFill } from "react-icons/ri";
import Button from "../../common/Button";
import { FaArrowRightLong } from "react-icons/fa6";
import { Order } from "../../../utils/types";
import { useNavigate } from "react-router-dom";
import { useCurrency } from "../../../context/CurrencyContext";

interface EnhancedOrder extends Order {
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
  index?: number;
}

const OrderHistoryItem: React.FC<EnhancedOrder> = React.memo((item) => {
  const navigate = useNavigate();
  const { secondaryCurrency } = useCurrency();

  const secondaryPrice = useMemo(() => {
    switch (secondaryCurrency) {
      case "USDT":
        return {
          unit: item.formattedUsdtPrice,
          total: item.formattedUsdtAmount,
        };
      default:
        return {
          unit: item.formattedFiatPrice,
          total: item.formattedFiatAmount,
        };
    }
  }, [secondaryCurrency, item]);

  const formattedDate = useMemo(() => {
    if (item.formattedDate) return item.formattedDate;
    return new Date(item.createdAt).toLocaleDateString();
  }, [item]);

  const getStatusStyle = useMemo(() => {
    const statusStyles = {
      "in escrow": "bg-[#62FF0033] text-[#62FF00]",
      pending: "bg-[#62FF0033] text-[#62FF00]",
      accepted: "bg-blue-800/30 text-blue-300",
      shipped: "bg-[#543A2E] text-orange-300",
      processing: "bg-[#543A2E] text-orange-300",
      delivery_confirmed: "bg-green-800/30 text-green-300",
      completed: "bg-green-800/30 text-green-300",
      cancelled: "bg-red-800/30 text-red-300",
      rejected: "bg-red-800/30 text-red-300",
      disputed: "bg-red-800/30 text-red-300",
      refunded: "bg-yellow-800/30 text-yellow-300",
    };

    return (status: string) =>
      statusStyles[status.toLowerCase() as keyof typeof statusStyles] ||
      "bg-gray-700/30 text-gray-300";
  }, []);

  const sellerName = useMemo(
    () =>
      typeof item.seller === "object"
        ? item.seller?.name
        : item.seller || "Unknown Vendor",
    [item.seller]
  );

  const productImage = useMemo(
    () =>
      item.product?.images?.[0] || "https://placehold.co/300x300?text=No+Image",
    [item.product?.images]
  );

  const viewOrderDetails = () => {
    navigate(`/orders/${item._id}`);
  };

  return (
    <motion.div
      className="grid grid-cols-1 xs:grid-cols-[2fr_3fr] h-full items-center gap-6 md:gap-10 p-6 md:px-[10%] lg:px-[15%] md:py-10 bg-[#292B30] mt-8 rounded-lg"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 * (item.index || 0) }}
      whileHover={{ scale: 1.01 }}
    >
      <motion.img
        src={productImage}
        alt={item.product?.name || "Product"}
        className="w-full h-auto mx-auto md:mx-0 rounded-md lg:row-span-2 object-cover aspect-square"
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        loading="lazy"
      />

      <div className="flex flex-col w-full overflow-hidden">
        <div className="text-white flex flex-col w-full text-left">
          <h3 className="font-normal text-2xl md:text-3xl">
            {item.product?.name || "Unknown Product"}
          </h3>
          <span className="flex items-center gap-2 text-[12px] text-[#AEAEB2]">
            By {sellerName}
            <RiVerifiedBadgeFill className="text-[#4FA3FF] text-xs" />
          </span>
          <h6 className="text-[#AEAEB2] text-[12px] mt-1">
            {item.quantity || 1} {(item.quantity || 1) === 1 ? "item" : "items"}
          </h6>
        </div>

        <div className="flex flex-col text-white mt-4 md:mt-2">
          <div className="text-sm flex justify-between text-white mb-2">
            <span>Unit Price:</span>
            <div className="text-right">
              <div className="text-white font-medium">
                {item.formattedCeloPrice}
              </div>
              <div className="text-[#AEAEB2] text-xs">
                {secondaryPrice.unit}
              </div>
            </div>
          </div>

          <div className="text-sm flex justify-between text-white mb-2">
            <span>Total:</span>
            <div className="text-right">
              <div className="text-white font-medium">
                {item.formattedCeloAmount}
              </div>
              <div className="text-[#AEAEB2] text-xs">
                {secondaryPrice.total}
              </div>
            </div>
          </div>

          <div className="text-sm flex justify-between text-white mb-2">
            <span>Ordered:</span>
            <span>{formattedDate}</span>
          </div>

          <div className="text-sm flex justify-between text-white mb-2">
            <span>Status:</span>
            <span
              className={`px-2 py-1 rounded-md text-xs ${getStatusStyle(
                item.status
              )}`}
            >
              {item.status
                .replace("_", " ")
                .replace(/\b\w/g, (l) => l.toUpperCase())}
            </span>
          </div>
        </div>
      </div>

      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.95 }}
        className="text-center xs:col-span-2 mx-auto xs:w-[80%] w-full lg:w-full lg:col-start-2"
      >
        <Button
          title="View Details"
          className="flex justify-between items-center w-full bg-Red border-0 rounded text-white px-8 md:px-14 py-2 mt-4 md:mt-0 transition-colors hover:bg-[#e02d37]"
          onClick={viewOrderDetails}
          icon={<FaArrowRightLong />}
          iconPosition="end"
        />
      </motion.div>
    </motion.div>
  );
});

OrderHistoryItem.displayName = "OrderHistoryItem";

export default OrderHistoryItem;
