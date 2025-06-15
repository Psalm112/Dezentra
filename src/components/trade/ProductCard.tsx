import { FC } from "react";
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
  return (
    <motion.div
      className="grid grid-cols-1 xs:grid-cols-[2fr_3fr] h-full items-center gap-6 md:gap-10 p-6 md:px-[10%] lg:px-[15%] md:py-10 bg-[#292B30] mt-8 rounded-lg"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      whileHover={{
        scale: 1.01,
        transition: { duration: 0.2 },
      }}
      layout
    >
      <motion.img
        src={
          product.images && product.images.length > 0
            ? product.images[0]
            : "https://placehold.co/300x300?text=No+Image"
        }
        alt={product.description}
        className="w-[60%] md:w-full h-auto mx-auto md:mx-0 rounded-md lg:row-span-2"
        loading="lazy"
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 300, damping: 15 }}
      />

      <div className="flex flex-col w-full text-left">
        <h3 className="font-normal text-2xl md:text-3xl text-white">
          {product.name}
        </h3>
        <span className="flex items-center gap-2 text-sm text-[#AEAEB2] mb-4">
          By{" "}
          {typeof product.seller === "object"
            ? product.seller.name
            : product.seller}
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
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="text-center xs:col-span-2 mx-auto xs:w-[80%] w-full lg:w-full lg:col-start-2"
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 15,
        }}
      >
        <Button
          title={
            actionType === "buy" ? (isSellTab ? "SELL" : "BUY") : "VIEW DETAILS"
          }
          className="flex justify-between items-center w-full bg-Red border-0 rounded text-white px-6 py-2 w-full transition-colors hover:bg-[#e02d37]"
          path={`/trades/buy/${product._id}`}
          icon={<FaArrowRightLong />}
          // onClick={handleButtonClick}
        />
      </motion.div>
    </motion.div>
  );
};

export default ProductCard;
