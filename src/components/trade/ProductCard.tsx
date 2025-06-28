import { FC, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { Product } from "../../utils/types";
import { RiVerifiedBadgeFill } from "react-icons/ri";
import Button from "../common/Button";
import { FaArrowRightLong } from "react-icons/fa6";

interface ProductCardProps {
  product: Product;
  // onBuyClick?: () => void;
  actionType?: "buy" | "view";
  isSellTab?: boolean;
}

const ProductCard: FC<ProductCardProps> = ({
  product,
  // onBuyClick,
  actionType = "buy",
  isSellTab = false,
}) => {
  const imageUrl = useMemo(() => {
    return product.images && product.images.length > 0
      ? product.images[0]
      : "https://placehold.co/300x300?text=No+Image";
  }, [product.images]);

  const sellerName = useMemo(() => {
    return typeof product.seller === "object"
      ? product.seller.name
      : product.seller;
  }, [product.seller]);

  const buttonTitle = useMemo(() => {
    return actionType === "buy" ? (isSellTab ? "SELL" : "BUY") : "VIEW DETAILS";
  }, [actionType, isSellTab]);

  const buttonPath = useMemo(() => {
    return `/trades/buy/${product._id}`;
  }, [product._id]);

  const motionVariants = useMemo(
    () => ({
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      hover: { scale: 1.01 },
      imageHover: { scale: 1.05 },
      buttonHover: { scale: 1.05 },
      buttonTap: { scale: 0.95 },
    }),
    []
  );

  const transition = useMemo(
    () => ({
      duration: 0.5,
      ease: [0.25, 0.1, 0.25, 1],
    }),
    []
  );

  const imageTransition = useMemo(
    () => ({
      type: "spring" as const,
      stiffness: 300,
      damping: 15,
    }),
    []
  );

  const buttonTransition = useMemo(
    () => ({
      type: "spring" as const,
      stiffness: 400,
      damping: 15,
    }),
    []
  );

  return (
    <motion.div
      className="grid grid-cols-1 xs:grid-cols-[2fr_3fr] h-full items-center gap-6 md:gap-10 p-6 md:px-[10%] lg:px-[15%] md:py-10 bg-[#292B30] mt-8 rounded-lg"
      initial={motionVariants.initial}
      animate={motionVariants.animate}
      transition={transition}
      whileHover={motionVariants.hover}
      layout
    >
      <motion.img
        src={imageUrl}
        alt={product.description}
        className="w-[60%] md:w-full h-auto mx-auto md:mx-0 rounded-md lg:row-span-2"
        loading="lazy"
        whileHover={motionVariants.imageHover}
        transition={imageTransition}
      />

      <div className="flex flex-col w-full text-left">
        <h3 className="font-normal text-2xl md:text-3xl text-white">
          {product.name}
        </h3>
        <span className="flex items-center gap-2 text-sm text-[#AEAEB2] mb-4">
          By {sellerName}
          <RiVerifiedBadgeFill className="text-[#4FA3FF] text-xs" />
        </span>

        <p className="text-xl font-bold text-white mb-2">
          {product.price} cUSD
        </p>

        <div className="text-right text-sm text-[rgb(174, 174, 178)] mb-3">
          {/* {product.orders} Orders | {product.rating}% */}
        </div>

        <div className="flex justify-between text-sm text-white mb-2">
          <span className="font-semibold">Quantity:</span>
          {/* <span>{product.quantity}</span> */}
        </div>
        <div className="flex justify-between text-sm text-white mb-2">
          <span className="font-semibold">Min. Cost:</span>
          {/* <span>{product.minCost}</span> */}
        </div>
        <div className="flex justify-between text-sm text-white mb-2">
          <span className="font-semibold">Description:</span>
          <span>{product.description}</span>
        </div>
      </div>

      <motion.div
        whileHover={motionVariants.buttonHover}
        whileTap={motionVariants.buttonTap}
        className="text-center xs:col-span-2 mx-auto xs:w-[80%] w-full lg:w-full lg:col-start-2"
        transition={buttonTransition}
      >
        <Button
          title={buttonTitle}
          className="flex justify-between items-center w-full bg-Red border-0 rounded text-white px-6 py-2 w-full transition-colors hover:bg-[#e02d37]"
          path={buttonPath}
          icon={<FaArrowRightLong />}
          // onClick={handleButtonClick}
        />
      </motion.div>
    </motion.div>
  );
};

export default ProductCard;
