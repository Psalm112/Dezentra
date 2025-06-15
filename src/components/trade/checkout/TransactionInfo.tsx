import { FC } from "react";
import { motion } from "framer-motion";

interface TransactionInfoProps {
  sellerName: string;
  rating: number;
  completedOrders: number;
  completionRate: number;
  avgPaymentTime: string;
  //   isBuy: boolean;
}

const TransactionInfo: FC<TransactionInfoProps> = ({
  sellerName,
  rating,
  completedOrders,
  completionRate,
  avgPaymentTime,
  //   isBuy,
}) => {
  return (
    <motion.div
      className="mt-10 bg-[#292B30] rounded-lg p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      <h3 className="text-lg font-medium mb-4">Transaction Info</h3>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-[#AEAEB2]">Seller's Name</span>
          <span>{sellerName}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[#AEAEB2]">Good Rating %</span>
          <span>{rating}%</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[#AEAEB2]">Completed Order(s) in 30 Days</span>
          <span>{completedOrders} Order(s)</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[#AEAEB2]">30-Day Order Completion Rate</span>
          <span>{completionRate}%</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[#AEAEB2]">Avg. Payment Time</span>
          <span>{avgPaymentTime}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default TransactionInfo;
