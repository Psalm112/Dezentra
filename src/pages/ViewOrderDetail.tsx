import { useState, useEffect, useCallback, useMemo, memo, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Container from "../components/common/Container";
import { TradeStatusType } from "../utils/types";
import TradeStatus from "../components/trade/status/TradeStatus";
import { toast } from "react-toastify";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { useOrderData } from "../utils/hooks/useOrder";
import { useSnackbar } from "../context/SnackbarContext";
import { getStoredOrderId, storeOrderId } from "../utils/helpers";

const ViewOrderDetail = memo(() => {
  const { orderId } = useParams<{ orderId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();

  useEffect(() => {
    if (orderId) {
      storeOrderId(orderId);
    }
  }, [orderId]);

  const initialStatus = useMemo(() => {
    if (location.search.includes("status=")) {
      const statusParam = new URLSearchParams(location.search).get("status");
      if (
        statusParam &&
        ["cancelled", "pending", "release", "completed"].includes(statusParam)
      ) {
        return statusParam as TradeStatusType;
      }
    }
    return "pending" as TradeStatusType;
  }, [location.search]);

  const [orderStatus, setOrderStatus] =
    useState<TradeStatusType>(initialStatus);

  const {
    getOrderById,
    currentOrder: orderDetails,
    loading,
    error,
    changeOrderStatus,
    raiseDispute,
  } = useOrderData();

  const statusMapping = useMemo(
    () => ({
      pending: "pending" as TradeStatusType,
      accepted: "release" as TradeStatusType,
      rejected: "cancelled" as TradeStatusType,
      completed: "completed" as TradeStatusType,
      disputed: "cancelled" as TradeStatusType,
      refunded: "pending" as TradeStatusType,
    }),
    []
  );

  const transactionInfo = useMemo(() => {
    if (!orderDetails?.buyer || !orderDetails?.seller) {
      return {
        buyerName: "Unknown Buyer",
        sellerName: "Unknown Seller",
        goodRating: 0,
        completedOrders: 0,
        completionRate: 0,
        avgPaymentTime: 0,
      };
    }

    return {
      buyerName:
        typeof orderDetails.buyer === "object"
          ? orderDetails.buyer.name
          : orderDetails.buyer,
      sellerName:
        typeof orderDetails.seller === "object"
          ? orderDetails.seller.name
          : orderDetails.seller,
      goodRating: 0,
      completedOrders: 0,
      completionRate: 0,
      avgPaymentTime: 0,
    };
  }, [orderDetails?.buyer, orderDetails?.seller]);

  useEffect(() => {
    if (orderId) {
      getOrderById(orderId);
    }
  }, [orderId, getOrderById]);

  useEffect(() => {
    if (orderDetails?.status) {
      const key =
        orderDetails.status.toLowerCase() as keyof typeof statusMapping;
      const newStatus = statusMapping[key] || "pending";
      if (newStatus !== orderStatus) {
        setOrderStatus(newStatus);
      }
    }
  }, [orderDetails?.status, statusMapping, orderStatus]);

  const handleContactSeller = useCallback(() => {
    toast.info("Opening chat with seller...");
    const sellerId =
      typeof orderDetails?.seller === "string"
        ? orderDetails.seller
        : orderDetails?.seller?._id;
    if (sellerId) {
      navigate(`/chat/${sellerId}`);
    }
  }, [orderDetails?.seller, navigate]);

  const handleContactBuyer = useCallback(() => {
    toast.info("Opening chat with buyer...");
  }, []);

  const handleOrderDispute = useCallback(
    async (reason: string): Promise<void> => {
      const currentOrderId = orderId || getStoredOrderId();
      if (!currentOrderId) return;

      try {
        const [disputeRes, changeOrderRes] = await Promise.all([
          raiseDispute(currentOrderId, reason, false),
          changeOrderStatus(
            currentOrderId,
            {
              status: "disputed",
            },
            false
          ),
        ]);

        if (disputeRes && changeOrderRes?.status === "disputed") {
          showSnackbar("Dispute has been filed successfully", "success");
          navigate(`/trades/viewtrades/${currentOrderId}?status=cancelled`, {
            replace: true,
          });
        }
      } catch (error) {
        showSnackbar("Failed to file dispute. Please try again.", "error");
        console.error("Dispute error:", error);
      }
    },
    [raiseDispute, changeOrderStatus, navigate]
  );

  const handleReleaseNow = useCallback(async () => {
    const currentOrderId = orderId || getStoredOrderId();
    if (!currentOrderId) return;

    try {
      navigate(`/trades/orders/${currentOrderId}?status=release`, {
        replace: true,
      });
    } catch (error) {
      toast.error("Failed Release. Please try again.");
      console.error("Release error:", error);
    }
  }, [navigate]);

  const handleConfirmDelivery = useCallback(async () => {
    const currentOrderId = orderId || getStoredOrderId();
    if (!currentOrderId) return;

    try {
      await changeOrderStatus(
        currentOrderId,
        {
          status: "completed",
        },
        false
      );
      setOrderStatus("completed");
      navigate(`/trades/viewtrades/${currentOrderId}?status=completed`, {
        replace: true,
      });
      toast.success("Order has been completed successfully!");
    } catch (error) {
      toast.error("Failed to complete the order. Please try again.");
      console.error("Confirm delivery error:", error);
    }
  }, [changeOrderStatus, navigate]);

  const navigatePath = useMemo(() => {
    const currentOrderId = orderId || getStoredOrderId();
    return `/orders/${currentOrderId}?status=release`;
  }, [orderId]);

  if (loading) {
    return (
      <div className="bg-Dark min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center text-white"
        >
          <LoadingSpinner />
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Loading order details...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  if (error || !orderDetails) {
    return (
      <div className="bg-Dark min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center text-white text-center px-4"
        >
          <div className="text-Red text-6xl mb-4">!</div>
          <h2 className="text-xl font-medium mb-2">Order Not Found</h2>
          <p className="text-gray-400 mb-6">
            Sorry, we couldn't find the order you're looking for.
          </p>
          <button
            onClick={() => navigate("/product")}
            className="bg-Red hover:bg-[#e02d37] text-white px-6 py-2 rounded-lg transition-colors"
          >
            Back to Products
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-Dark min-h-screen py-8 text-white">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <TradeStatus
            status={orderStatus}
            orderDetails={orderDetails}
            transactionInfo={transactionInfo}
            onContactSeller={
              orderStatus !== "pending" ? handleContactSeller : undefined
            }
            onContactBuyer={
              orderStatus !== "pending" ? handleContactBuyer : undefined
            }
            onOrderDispute={handleOrderDispute}
            onReleaseNow={handleReleaseNow}
            onConfirmDelivery={handleConfirmDelivery}
            orderId={orderId}
            navigatePath={navigatePath}
          />
        </motion.div>
      </Container>
    </div>
  );
});

ViewOrderDetail.displayName = "ViewOrderDetail";

export default ViewOrderDetail;
