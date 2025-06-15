import { FC } from "react";
import { motion } from "framer-motion";
import { Product } from "../../utils/types";
import Button from "../common/Button";
interface IncomingOrderCardProps {
  product: Product;
  // onAccept: () => void;
  onReject: () => void;
}

const IncomingOrderCard: FC<IncomingOrderCardProps> = ({
  product,
  // onAccept,
  onReject,
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
        <div className="flex justify-between items-center">
          <h3 className="font-normal text-2xl md:text-3xl text-white">
            {product.name}
          </h3>
          {/* <span className="bg-yellow-500 text-black text-xs px-2 py-1 rounded-full">
            {product.status}
          </span> */}
        </div>

        <p className="text-xl font-bold text-white my-2">
          {product.price} cUSD
        </p>

        <div className="flex justify-between text-sm text-white mb-2">
          <span className="font-semibold">Quantity:</span>
          {/* <span>{product.quantity}</span> */}
        </div>
        <div className="flex justify-between text-sm text-white mb-2">
          <span className="font-semibold">Min. Cost:</span>
          <span>{product.price}</span>
        </div>
        <div className="flex justify-between text-sm text-white mb-2">
          <span className="font-semibold">Description:</span>
          <span>{product.description}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 xs:col-span-2 mx-auto xs:w-[80%] w-full lg:w-full lg:col-start-2">
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
        >
          <Button
            title="REJECT"
            className="flex justify-center items-center w-full bg-transparent border border-Red rounded text-Red px-6 py-2 transition-colors hover:bg-[#3a0a0d] hover:text-white"
            path=""
            onClick={onReject}
          />
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
        >
          <Button
            title="ACCEPT"
            className="flex justify-center items-center w-full bg-Red border-0 rounded text-white px-6 py-2 transition-colors hover:bg-[#e02d37]"
            path={`/trades/sell/${product._id}`}

            // onClick={onAccept}
          />
        </motion.div>
      </div>
    </motion.div>
  );
};

export default IncomingOrderCard;
