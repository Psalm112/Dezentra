import React, { useMemo } from "react";
import { FaRegHeart, FaHeart } from "react-icons/fa";
// import { RiVerifiedBadgeFill } from "react-icons/ri";
import { Link, useNavigate } from "react-router-dom";
// import { BsCart3 } from "react-icons/bs";
import { Product } from "../../utils/types";
import { useWatchlist } from "../../utils/hooks/useWatchlist";
import { useCurrency } from "../../context/CurrencyContext";
import { useCurrencyConverter } from "../../utils/hooks/useCurrencyConverter";
import { useWeb3 } from "../../context/Web3Context";
import { motion } from "framer-motion";
interface ProductCardProps {
  product: Product & {
    formattedNativePrice: string;
    formattedFiatPrice: string;
    formattedUsdtPrice: string;
  };
  isNew?: boolean;
}
const ProductCard = React.memo(
  ({ product, isNew = false }: ProductCardProps) => {
    const navigate = useNavigate();
    const { _id, name, description, images, isSponsored } = product;
    const { isProductInWatchlist, toggleWatchlist } = useWatchlist();
    const { secondaryCurrency } = useCurrency();
    const { wallet, chainId, isCorrectNetwork } = useWeb3();
    const {
      convertPrice,
      formatPrice,
      nativeToken,
      loading: ratesLoading,
      isUnsupportedNetwork,
    } = useCurrencyConverter({
      chainId,
      isConnected: wallet.isConnected && isCorrectNetwork,
    });

    const isFavorite = isProductInWatchlist(_id);

    // Extract base USDT price from formatted string
    const baseUsdtPrice = useMemo(() => {
      try {
        // Remove currency symbols and parse the numeric value
        const cleanPrice = product.formattedUsdtPrice
          .replace(/[^0-9.,]/g, "")
          .replace(",", "");
        return parseFloat(cleanPrice) || 0;
      } catch (error) {
        console.warn("Failed to parse USDT price:", error);
        return 0;
      }
    }, [product.formattedUsdtPrice]);

    // Calculate prices
    const calculatedPrices = useMemo(() => {
      if (ratesLoading || baseUsdtPrice === 0) {
        return {
          nativePrice: "Loading...",
          fiatPrice: product.formattedFiatPrice,
          showNetworkWarning: isUnsupportedNetwork,
        };
      }

      try {
        const nativePrice = convertPrice(baseUsdtPrice, "USDT", "NATIVE");
        const fiatPrice = convertPrice(baseUsdtPrice, "USDT", "FIAT");

        return {
          nativePrice: formatPrice(nativePrice, "NATIVE"),
          fiatPrice: formatPrice(fiatPrice, "FIAT"),
          showNetworkWarning: isUnsupportedNetwork,
        };
      } catch (error) {
        console.warn("Price calculation failed:", error);
        return {
          nativePrice: `— ${nativeToken.symbol}`,
          fiatPrice: product.formattedFiatPrice,
          showNetworkWarning: isUnsupportedNetwork,
        };
      }
    }, [
      baseUsdtPrice,
      convertPrice,
      formatPrice,
      nativeToken.symbol,
      product.formattedFiatPrice,
      ratesLoading,
      isUnsupportedNetwork,
    ]);

    // Determine secondary price based on user preference
    const secondaryPrice = useMemo(() => {
      return secondaryCurrency === "USDT"
        ? product.formattedUsdtPrice
        : calculatedPrices.fiatPrice;
    }, [
      secondaryCurrency,
      product.formattedUsdtPrice,
      calculatedPrices.fiatPrice,
    ]);

    const imageUrl = useMemo(() => {
      return images && images.length > 0
        ? images[0]
        : "https://placehold.co/300x300?text=No+Image";
    }, [images]);

    const handleToggleFavorite = async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        await toggleWatchlist(_id, false);
      } catch (error) {
        console.warn("Failed to toggle watchlist:", error);
      }
    };

    const navigateToProduct = (e: React.MouseEvent) => {
      e.preventDefault();
      navigate(`/product/${_id}`);
    };

    return (
      <motion.div
        whileHover={{ y: -5 }}
        transition={{ type: "spring", stiffness: 300 }}
        className="h-full"
      >
        <Link
          to={`/product/${_id}`}
          className="bg-[#292B30] rounded-lg relative flex flex-col overflow-hidden h-full shadow-lg hover:shadow-xl transition-shadow duration-300"
        >
          {/* Top section with New tag and favorite */}
          <div className="absolute top-0 left-0 right-0 z-10 flex justify-between p-2 sm:p-3">
            {isNew && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-full p-1.5 sm:p-2 bg-red-500/80 text-white text-xs font-bold"
              >
                New
              </motion.div>
            )}
            <motion.button
              whileTap={{ scale: 0.9 }}
              className={`ml-auto bg-[#1A1B1F]/50 rounded-full p-1.5 sm:p-2 backdrop-blur-md ${
                !isNew ? "mr-0" : ""
              }`}
              aria-label={
                isFavorite ? "Remove from favorites" : "Add to favorites"
              }
              onClick={handleToggleFavorite}
            >
              {isFavorite ? (
                <FaHeart className="text-base sm:text-xl text-Red" />
              ) : (
                <FaRegHeart className="text-base sm:text-xl text-white" />
              )}
            </motion.button>
          </div>

          {/* Network warning indicator */}
          {/* {calculatedPrices.showNetworkWarning && wallet.isConnected && (
            <div className="absolute top-12 left-2 z-10">
              <div className="bg-yellow-500/20 border border-yellow-500/40 rounded-md px-2 py-1">
                <span className="text-yellow-400 text-xs font-medium">
                  Unsupported Network
                </span>
              </div>
            </div>
          )} */}

          {/* Image container */}
          <div className="w-full pt-[100%] relative bg-[#1A1B1F]/30 overflow-hidden">
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <img
                src={imageUrl}
                alt={name}
                className="max-w-full max-h-full object-contain"
                loading="lazy"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "https://placehold.co/300x300?text=No+Image";
                }}
              />
            </motion.div>
          </div>

          {/* Product info */}
          <div className="flex flex-col w-full p-3 sm:p-4 flex-grow">
            {isSponsored && (
              <div className="mb-1">
                <span className="text-Green text-xs font-medium bg-Green/10 px-2 py-0.5 rounded-md border border-Green/20">
                  Sponsored
                </span>
              </div>
            )}

            <h4 className="text-white text-sm sm:text-base md:text-lg font-bold truncate">
              {name}
            </h4>

            <p className="text-white/80 text-xs md:text-sm py-0.5 sm:py-1 line-clamp-1">
              {description}
            </p>

            {/* Price and buy button container */}
            <div className="mt-auto pt-1 sm:pt-2">
              <div className="flex flex-col">
                <span className="text-white text-sm md:text-base font-semibold">
                  {calculatedPrices.nativePrice}
                </span>
                <span className="text-[#AEAEB2] text-xs md:text-sm">
                  {secondaryPrice}
                </span>
                {calculatedPrices.showNetworkWarning && wallet.isConnected && (
                  <span className="text-yellow-400 text-xs mt-1">
                    Switch to supported network for live prices
                  </span>
                )}
              </div>
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }
);
export default ProductCard;
