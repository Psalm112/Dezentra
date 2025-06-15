import { FC } from "react";
import { motion } from "framer-motion";
import { Product } from "../../../utils/types";
import { RiVerifiedBadgeFill } from "react-icons/ri";

interface ProductInfoProps {
  product: Product;
  className?: string;
}

const ProductInfo: FC<ProductInfoProps> = ({ product, className = "" }) => {
  return (
    <motion.div
      className={`flex flex-col md:flex-row items-center gap-6 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <motion.div
        className="w-full md:w-1/3 "
        whileHover={{ scale: 1.03 }}
        transition={{ type: "spring", stiffness: 300, damping: 15 }}
      >
        <img
          src={product.images[0]}
          alt={product.description}
          className="w-[60%] md:w-full h-auto rounded-lg mx-auto"
          loading="lazy"
        />
      </motion.div>

      <div className="w-full md:w-2/3 space-y-4">
        <div className="flex justify-end items-center ">
          {/* <h2 className="text-2xl md:text-3xl font-medium">{product.name}</h2> */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, type: "spring" }}
            className="text-2xl font-bold"
          >
            {product.price}
          </motion.div>
        </div>

        <div className="flex items-center text-sm text-[#AEAEB2]">
          By{" "}
          {typeof product.seller === "object"
            ? product.seller.name
            : product.seller}
          <RiVerifiedBadgeFill className="text-[#4FA3FF] text-xs ml-1" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 mt-4">
          <div className="flex justify-between text-sm">
            <span className="text-[#AEAEB2]">Quantity:</span>
            {/* <span>{product.quantity}</span> */}
            <span>2</span>
          </div>
          {/* <div className="flex justify-between text-sm">
            <span className="text-[#AEAEB2]">Min. Cost:</span>
            <span>{product.minCost}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#AEAEB2]">Description:</span>
            <span>{product.description}</span>
          </div> */}
          <div className="flex justify-between text-sm">
            <span className="text-[#AEAEB2]">Payment Duration:</span>
            {/* <span>{product.paymentDuration || "18Min(s)"}</span> */}
            <span>18Min(s)</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductInfo;
