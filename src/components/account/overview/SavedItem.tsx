import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { RiVerifiedBadgeFill } from "react-icons/ri";
import Button from "../../common/Button";
import { useNavigate } from "react-router-dom";
import { WatchlistItem } from "../../../utils/types";
import { useCurrency } from "../../../context/CurrencyContext";
import { useCurrencyConverter } from "../../../utils/hooks/useCurrencyConverter";

interface SavedItemProps {
  item: WatchlistItem;
  index: number;
  onRemove: (productId: string, showNotification?: boolean) => Promise<boolean>;
}

const SavedItem: React.FC<SavedItemProps> = React.memo(
  ({ item, index, onRemove }) => {
    const navigate = useNavigate();
    const { secondaryCurrency } = useCurrency();
    const { convertPrice, formatPrice } = useCurrencyConverter();

    const formattedPrices = useMemo(() => {
      const price = item.product?.price;
      if (!price) return null;

      const celoPrice = convertPrice(price, "USDT", "CELO");
      const fiatPrice = convertPrice(price, "USDT", "FIAT");

      return {
        celo: formatPrice(celoPrice, "CELO"),
        secondary:
          secondaryCurrency === "USDT"
            ? formatPrice(price, "USDT")
            : formatPrice(fiatPrice, "FIAT"),
      };
    }, [item.product?.price, convertPrice, formatPrice, secondaryCurrency]);

    const productImage = useMemo(
      () =>
        item.product?.images?.[0] ||
        "https://placehold.co/300x300?text=No+Image",
      [item.product?.images]
    );

    const savedDate = useMemo(
      () => new Date(item.createdAt).toLocaleDateString(),
      [item.createdAt]
    );

    const viewProductDetails = () => {
      navigate(`/product/${item.product._id}`);
    };

    const handleRemoveFromWatchlist = async (e: React.MouseEvent) => {
      e.stopPropagation();
      await onRemove(item.product._id, false);
    };

    return (
      <motion.div
        className="grid grid-cols-1 xs:grid-cols-[2fr_3fr] h-full items-center gap-6 md:gap-10 p-6 md:px-[10%] lg:px-[15%] md:py-10 bg-[#292B30] mt-8 rounded-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 * index }}
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

        <div className="flex flex-col w-full text-left">
          <h3 className="font-normal text-2xl md:text-3xl text-white">
            {item.product?.name || "Unknown Product"}
          </h3>
          <span className="flex items-center gap-2 text-[12px] text-[#AEAEB2] mb-4">
            By {item.product?.seller || "Unknown Vendor"}
            <RiVerifiedBadgeFill className="text-[#4FA3FF] text-xs" />
          </span>

          <div className="flex justify-between text-sm text-white mb-2">
            <span>Price:</span>
            {formattedPrices ? (
              <div className="text-right">
                <div className="text-white font-medium">
                  {formattedPrices.celo}
                </div>
                <div className="text-[#AEAEB2] text-xs">
                  {formattedPrices.secondary}
                </div>
              </div>
            ) : (
              <span>N/A</span>
            )}
          </div>
          <div className="flex justify-between text-sm text-white mb-2">
            <span>Saved:</span>
            <span>{savedDate}</span>
          </div>
        </div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          className="text-center xs:col-span-2 mx-auto xs:w-[80%] w-full lg:w-full lg:col-start-2"
        >
          <div className="grid grid-cols-2 gap-2">
            <Button
              title="View Product"
              className="flex justify-center items-center w-full bg-Red border-0 rounded text-white px-4 py-2 transition-colors hover:bg-[#e02d37]"
              onClick={viewProductDetails}
            />
            <Button
              title="Remove"
              className="flex justify-center items-center w-full bg-[#3A3B3F] border-0 rounded text-white px-4 py-2 transition-colors hover:bg-[#4A4B4F]"
              onClick={handleRemoveFromWatchlist}
            />
          </div>
        </motion.div>
      </motion.div>
    );
  }
);

SavedItem.displayName = "SavedItem";

export default SavedItem;
