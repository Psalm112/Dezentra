import { FC, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { OrderDetails, TradeDetails } from "../../../utils/types";
import { FaCheck, FaCopy, FaStar } from "react-icons/fa";
import { IoChevronBack, IoChevronDown, IoChevronUp } from "react-icons/io5";
import { LuMessageSquare } from "react-icons/lu";
import Button from "../../common/Button";
import { useReviewData } from "../../../utils/hooks/useReview";
import { BsShieldExclamation } from "react-icons/bs";

interface CompletedStatusProps {
  orderDetails?: OrderDetails;
  tradeDetails?: TradeDetails;
  onContactBuyer?: () => void;
  //   onViewFAQ?: () => void;
}

const CompletedStatus: FC<CompletedStatusProps> = ({
  orderDetails,
  tradeDetails,
  onContactBuyer,
}) => {
  // const details = tradeDetails || (orderDetails as unknown as TradeDetails);
  const [showFaq, setShowFaq] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [hoveredRating, setHoveredRating] = useState(0);
  const { submitReview, loading } = useReviewData();
  const [copied, setCopied] = useState(false);

  if (!tradeDetails && !orderDetails) {
    return <div>Order/Trade information not available</div>;
  }

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      alert("Please select a rating");
      return;
    }
    const productId = tradeDetails
      ? tradeDetails.productId
      : orderDetails?.product?._id || "";
    const orderId = tradeDetails
      ? tradeDetails?.orderNo
      : orderDetails?._id || "";
    await submitReview({
      reviewed: productId,
      order: orderId,
      rating,
      comment,
    });

    setRating(0);
    setComment("");
    setShowReviewForm(false);
  };

  const copyOrderId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    // console.log(
    //   tradeDetails
    //     ? tradeDetails.amount.toString()
    //     : orderDetails?.product.price.toString()
    // );
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };
  return (
    <>
      <motion.div
        className="bg-green-50 border border-green-200 text-green-800 rounded-md p-4 flex items-center justify-between mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-2">
          <FaCheck className="text-green-500" />
          <span>Your payment is complete</span>
        </div>
        {/* <button className="text-gray-500 hover:text-gray-700">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M15 5L5 15M5 5L15 15"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button> */}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center mb-8 justify-between flex-col sm:flex-row gap-4"
      >
        <div className="w-full">
          <motion.button
            className="flex items-center text-gray-400 hover:text-white mb-4"
            whileHover={{ x: -3 }}
            transition={{ type: "spring", stiffness: 400 }}
            onClick={() => window.history.back()}
          >
            <IoChevronBack className="w-5 h-5" />
          </motion.button>
          <motion.h1
            className="text-2xl font-medium text-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            Completed
          </motion.h1>
          <div>
            <motion.p
              className="text-gray-400 text-sm mt-2 w-full inline"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              This order has concluded and the assets are no longer locked in
              Desemnart escrow system.
            </motion.p>
            &nbsp;
            <motion.p
              className="text-Red text-sm mt-2 w-full inline"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Do not trust strangers or release funds without confirming.
            </motion.p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="self-end sm:self-auto"
        >
          <Button
            title="Contact Seller"
            className="bg-transparent hover:bg-gray-700 text-white text-sm px-4 py-2 border border-Red rounded-2xl transition-colors flex items-center gap-x-2 justify-center"
            onClick={onContactBuyer}
            icon={<LuMessageSquare className="w-5 h-5 text-Red" />}
            iconPosition="start"
          />
        </motion.div>
      </motion.div>

      {/* alert */}
      <motion.div
        className="rounded-lg p-4 flex items-center gap-3 text-white-200 bg-Red/10 mb-6"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="text-red-500">
          <BsShieldExclamation size={18} />
        </div>
        <div className="w-full">
          <p className="text-sm">
            This order has concluded and the assets are no longer locked in
            Desemnart escrow system. Do not trust strangers or release funds
            without confirming.
          </p>
        </div>
      </motion.div>

      {/* Order details */}
      <motion.div
        className="bg-[#292B30] rounded-lg overflow-hidden shadow-lg mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <div className="py-4 px-6 md:px-12">
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="w-fit flex flex-col gap-2">
              <div className="w-full flex gap-4 items-center">
                <motion.h3
                  className="font-medium text-xl text-white"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  {tradeDetails
                    ? tradeDetails.productName
                    : orderDetails?.product.name}
                </motion.h3>
                <motion.span
                  className="bg-green-500 text-white text-xs px-3 py-1 rounded-full"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {tradeDetails ? tradeDetails.tradeType : "BOUGHT"}
                </motion.span>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-700 py-8">
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Amount</span>
                <span className="text-red-500 text-xl font-bold">
                  {tradeDetails
                    ? tradeDetails.amount.toString()
                    : orderDetails?.product.price}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between py-2">
                  <span className="text-gray-400 text-sm">Total Quantity</span>
                  <span className="text-white">
                    {tradeDetails
                      ? tradeDetails.quantity.toString()
                      : orderDetails?.quantity.toString() || "2"}
                  </span>
                </div>

                <div className="flex justify-between py-2">
                  <span className="text-gray-400 text-sm">Order Time</span>
                  <span className="text-white">
                    {tradeDetails
                      ? tradeDetails.orderTime
                      : orderDetails?.formattedDate}
                  </span>
                </div>
                <div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-400 text-sm">Order No.</span>
                    <div className="flex items-center">
                      <span className="text-white mr-2">
                        {tradeDetails
                          ? tradeDetails.orderNo
                          : orderDetails?._id}
                      </span>
                      <motion.button
                        onClick={() =>
                          copyOrderId(
                            tradeDetails
                              ? tradeDetails.orderNo
                              : orderDetails?._id || ""
                          )
                        }
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <FaCopy className="text-gray-400 hover:text-white transition-colors" />
                      </motion.button>
                    </div>
                  </div>
                  {copied && (
                    <motion.p
                      className="w-full text-xs text-green-400 text-right mt-2 mb-1 "
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      Order number copied to clipboard!
                    </motion.p>
                  )}
                </div>

                <div className="flex justify-between py-2">
                  <span className="text-gray-400 text-sm">Payment Method</span>
                  <span className="text-white">
                    {tradeDetails ? tradeDetails.paymentMethod : "CRYPTO"}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
      {/*  Review section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        whileHover={{ scale: 1.01 }}
        className="bg-[#292B30] rounded-lg mb-6 p-4"
      >
        <motion.button
          onClick={() => setShowReviewForm(!showReviewForm)}
          className="flex justify-between items-center w-full text-xl font-bold text-white"
          whileHover={{ color: "#f87171" }}
          transition={{ duration: 0.2 }}
        >
          <span>Leave A Review</span>
          <span>
            {showReviewForm ? (
              <IoChevronUp className="text-gray-400" />
            ) : (
              <IoChevronDown className="text-gray-400" />
            )}
          </span>
        </motion.button>

        <AnimatePresence>
          {showReviewForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <form onSubmit={handleReviewSubmit} className="space-y-4 mt-4">
                <div>
                  <label className="block text-gray-300 mb-2">Rating</label>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <motion.button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(0)}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                      >
                        <FaStar
                          size={24}
                          className={`${
                            (hoveredRating || rating) >= star
                              ? "text-yellow-400"
                              : "text-gray-400"
                          } 
                           cursor-pointer`}
                        />
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="comment" className="block text-gray-300 mb-2">
                    Comment
                  </label>
                  <textarea
                    id="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-800 text-white border border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    rows={4}
                    placeholder="Share your experience with this product and seller"
                  />
                </div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    title="Submit Review"
                    type="submit"
                    className={`max-w-md mx-auto flex items-center justify-center p-3 ${
                      loading ? "bg-Red/20" : "bg-Red"
                    } hover:bg-red-600 text-white w-full`}
                  />
                </motion.div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="bg-[#292B30] rounded-lg p-4 mb-6"
      >
        <motion.button
          className="flex justify-between items-center w-full text-xl font-bold text-white"
          onClick={() => setShowFaq(!showFaq)}
          whileHover={{ color: "#f87171" }}
          transition={{ duration: 0.2 }}
        >
          <span>FAQ</span>
          <span>
            {showFaq ? (
              <IoChevronUp className="text-gray-400" />
            ) : (
              <IoChevronDown className="text-gray-400" />
            )}
          </span>
        </motion.button>

        <AnimatePresence>
          {showFaq && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="mt-4 space-y-4">
                {[
                  {
                    question: "How do I contact the Seller?",
                    answer:
                      'Click on the "Contact Seller" button to open a direct messaging channel.',
                  },
                  {
                    question: "When will I receive my payment?",
                    answer:
                      "Payments are typically processed within 24-48 hours after the order is marked as completed.",
                  },
                  {
                    question: "Can I cancel a completed order?",
                    answer:
                      "Once an order is marked as completed, it cannot be canceled. Please contact support if you have any issues.",
                  },
                  {
                    question: "How are reviews used?",
                    answer:
                      "Reviews help build trust in the marketplace. They're displayed on product pages to help buyers make informed decisions.",
                  },
                ].map((faq, index) => (
                  <motion.div
                    key={index}
                    className={`${
                      index < 3 ? "border-b border-neutral-800" : ""
                    } pb-3`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                  >
                    <h4 className="font-medium text-white mb-2">
                      {faq.question}
                    </h4>
                    <p className="text-gray-300">{faq.answer}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Button
          title="Buy more"
          onClick={() => (window.location.href = "/product")}
          className="bg-Red max-w-md mx-auto flex items-center justify-center p-3 hover:bg-red-600 text-white w-full"
        />
      </motion.div>
    </>
  );
};

export default CompletedStatus;
