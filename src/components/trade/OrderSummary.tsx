import { FC } from "react";
import { motion } from "framer-motion";
import { Product } from "../../utils/types";
import { RiVerifiedBadgeFill } from "react-icons/ri";
interface OrderSummaryModalProps {
  product: Product;
  onClose: () => void;
  onConfirm: () => void;
}

const OrderSummaryModal: FC<OrderSummaryModalProps> = ({
  product,
  onClose,
  onConfirm,
}) => {
  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-[#212428] rounded-lg max-w-lg w-full p-6"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Order Summary</h2>
          <button className="text-[#AEAEB2] hover:text-white" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="flex items-center mb-6">
          <img
            src={product.images[0]}
            alt={product.description}
            className="w-20 h-20 object-cover rounded-md mr-4"
          />
          <div>
            <h3 className="text-xl font-medium">{product.name}</h3>
            <p className="text-[#AEAEB2] text-sm">{product.description}</p>
            <p className="text-lg font-bold mt-1">{product.price}</p>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-[#AEAEB2]">Quantity:</span>
            {/* <span>{product.quantity}</span> */}
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#AEAEB2]">Min. Cost:</span>
            {/* <span>{product.minCost}</span> */}
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#AEAEB2]">Seller:</span>
            <span className="flex items-center">
              {typeof product.seller === "object"
                ? product.seller.name
                : product.seller}
              <RiVerifiedBadgeFill className="text-[#4FA3FF] text-xs ml-1" />
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#AEAEB2]">Platform Fee:</span>
            <span>₦50</span>
          </div>

          <div className="border-t border-[#292B30] my-3 pt-3">
            <div className="flex justify-between font-medium">
              <span>Total:</span>
              <span>{product.price}</span>
            </div>
          </div>

          <div className="bg-[#292B30] p-3 rounded-md text-sm text-[#AEAEB2]">
            <p className="mb-2">By confirming this order:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>You agree to the P2P trading terms and conditions</li>
              <li>Funds will be held in escrow until delivery is confirmed</li>
              <li>You have 30 minutes to complete payment</li>
            </ul>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <motion.button
            className="py-3 px-4 rounded-md border border-[#AEAEB2] text-[#AEAEB2] font-medium"
            onClick={onClose}
            whileHover={{ backgroundColor: "rgba(255,255,255,0.05)" }}
            whileTap={{ scale: 0.98 }}
          >
            Cancel
          </motion.button>
          <motion.button
            className="py-3 px-4 rounded-md bg-Red text-white font-medium"
            onClick={onConfirm}
            whileHover={{ backgroundColor: "#e02d37" }}
            whileTap={{ scale: 0.98 }}
          >
            Confirm Purchase
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default OrderSummaryModal;
