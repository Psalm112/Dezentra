import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Container from "../components/common/Container";
import {
  TradeDetails,
  TradeTransactionInfo,
  TradeStatusType,
} from "../utils/types";
import TradeStatus from "../components/trade/status/TradeStatus";
import { toast } from "react-toastify";
import LoadingSpinner from "../components/common/LoadingSpinner";
// import { useOrderData } from "../utils/hooks/useOrderData";

const ViewTradeDetail = () => {
  const { tradeId } = useParams<{ tradeId: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [tradeStatus, setTradeStatus] = useState<TradeStatusType>("pending");
  // const {
  //   getOrderById,
  //   formattedCurrentOrder: orderDetails,
  //   loading,
  //   error,
  //   changeOrderStatus,
  //   raiseDispute,
  // } = useOrderData();
  // const [isProcessing, setIsProcessing] = useState(false);

  // Mock data - future: from API
  const tradeDetails: TradeDetails = {
    productName: "IPHONE 16",
    productId: "trade1",
    amount: 1600000,
    quantity: 2,
    orderTime: "2025-01-24 10:34:22",
    orderNo: "23435461580011",
    paymentMethod: "CRYPTO",
    tradeType: "SELL",
    sellerId: "608021b86eda53ead327e0ea",
    buyerId: "60804386704fcfe10f451cf",
  };

  const transactionInfo: TradeTransactionInfo = {
    buyerName: "Femi Cole",
    sellerName: "John Doe",
    goodRating: 88,
    completedOrders: 456,
    completionRate: 99,
    avgPaymentTime: 20,
  };

  useEffect(() => {
    const fetchTradeDetails = async () => {
      try {
        // if (tradeId) {
        //   await getOrderById(tradeId);
        // }
        // fetch from API
        // const response = await fetch(`${API_URL}/trades/${tradeId}`);
        // const data = await response.json();
        // setTradeDetails(data);

        setTimeout(() => {
          setIsLoading(false);

          if (location.search.includes("status=")) {
            const statusParam = new URLSearchParams(location.search).get(
              "status"
            );
            if (
              statusParam &&
              ["cancelled", "pending", "release", "completed"].includes(
                statusParam
              )
            ) {
              setTradeStatus(statusParam as TradeStatusType);
            }
          }
        }, 800);
      } catch (error) {
        console.error("Error fetching trade details:", error);
        toast.error("Failed to load trade details");
        setIsLoading(false);
      }
    };

    fetchTradeDetails();
  }, [tradeId]);

  const handleContactSeller = () => {
    toast.info("Opening chat with seller...");
  };

  const handleContactBuyer = () => {
    toast.info("Opening chat with buyer...");
  };

  // const handleOrderDispute = (): Promise<void> => {
  //   toast.info("Dispute request has been sent");
  //   return
  // };

  const handleReleaseNow = () => {
    if (!tradeId) return;
    // setIsProcessing(true);

    // Simulate API call
    setTimeout(() => {
      // setTradeStatus("completed");
      navigate(`/trades/viewtrades/${tradeId}?status=release`, {
        replace: true,
      });
      // setIsProcessing(false);
      toast.success("Release successful!");
    }, 1500);
  };

  // const handleConfirmDelivery = async () => {
  //   if (!tradeId) return;

  //   // setIsProcessing(true);
  //   try {
  //     // await changeOrderStatus(tradeId, "completed");
  //     setTradeStatus("completed");
  //     navigate(`/trades/viewtrades/${tradeId}?status=completed`, {
  //       replace: true,
  //     });
  //     toast.success("Order has been completed successfully!");
  //   } catch (error) {
  //     toast.error("Failed to complete the order. Please try again.");
  //     console.log(error);
  //   } finally {
  //     //   setIsProcessing(false);
  //   }
  // };

  if (isLoading) {
    return (
      <Container>
        <div className="flex flex-col items-center justify-center h-[70vh]">
          <LoadingSpinner />
          <p className="mt-4 text-lg">Loading trade details...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="py-6">
        {/* Demo buttons */}
        {/* <motion.div
          className="mb-8 flex flex-wrap gap-2 justify-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <button
            className={`px-4 py-2 rounded transition-colors ${
              tradeStatus === "cancelled"
                ? "bg-Red"
                : "bg-gray-700 hover:bg-gray-600"
            }`}
            onClick={() => {
              setTradeStatus("cancelled");
              navigate(`/trades/viewtrades/${tradeId}?status=cancelled`, {
                replace: true,
              });
            }}
            disabled={isProcessing}
          >
            Show Cancelled
          </button>
          <button
            className={`px-4 py-2 rounded transition-colors ${
              tradeStatus === "pending"
                ? "bg-Red"
                : "bg-gray-700 hover:bg-gray-600"
            }`}
            onClick={() => {
              setTradeStatus("pending");
              navigate(`/trades/viewtrades/${tradeId}?status=pending`, {
                replace: true,
              });
            }}
            disabled={isProcessing}
          >
            Show Pending
          </button>
          <button
            className={`px-4 py-2 rounded transition-colors ${
              tradeStatus === "release"
                ? "bg-Red"
                : "bg-gray-700 hover:bg-gray-600"
            }`}
            onClick={() => {
              setTradeStatus("release");
              navigate(`/trades/viewtrades/${tradeId}?status=release`, {
                replace: true,
              });
            }}
            disabled={isProcessing}
          >
            Show Release
          </button>
          <button
            className={`px-4 py-2 rounded transition-colors ${
              tradeStatus === "completed"
                ? "bg-Red"
                : "bg-gray-700 hover:bg-gray-600"
            }`}
            onClick={() => {
              setTradeStatus("completed");
              navigate(`/trades/viewtrades/${tradeId}?status=completed`, {
                replace: true,
              });
            }}
            disabled={isProcessing}
          >
            Show Completed
          </button>
        </motion.div> */}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <TradeStatus
            status={tradeStatus}
            tradeDetails={tradeDetails}
            transactionInfo={transactionInfo}
            onContactSeller={handleContactSeller}
            onContactBuyer={handleContactBuyer}
            // onOrderDispute={handleOrderDispute}
            onReleaseNow={handleReleaseNow}
            orderId={tradeId}
            // navigatePath=""
            showTimer
          />
        </motion.div>
      </div>
    </Container>
  );
};

export default ViewTradeDetail;
