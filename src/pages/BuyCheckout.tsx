import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import CheckoutLayout from "../components/trade/checkout/CheckoutLayout";
import ProductInfo from "../components/trade/checkout/ProductInfo";
import PaymentMethod from "../components/trade/checkout/PaymentMethod";
import TransactionInfo from "../components/trade/checkout/TransactionInfo";
import { Product } from "../utils/types";
import { toast } from "react-toastify";
import LoadingSpinner from "../components/common/LoadingSpinner";

const BuyCheckout = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>();
  const [product, setProduct] = useState<Product | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(190);
  const [paymentMethod, setPaymentMethod] = useState<string>("crypto");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // const { placeOrder, loading } = useOrderData();
  // const {
  //   product,
  //   formattedProduct,
  //   loading: loadingProduct,
  //   error,
  //   fetchProductById,
  // } = useProductData();
  // Fetch product data
  // useEffect(() => {
  //   if (productId) {
  //     fetchProductById(productId);
  //   }

  //   // Cleanup
  //   return () => {};
  // }, [productId, fetchProductById]);
  // const handleRetry = () => {
  //   if (productId) {
  //     fetchProductById(productId);
  //   }

  //   // Cleanup
  //   return () => {};
  // };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        // API call
        setTimeout(() => {
          // Sample data
          const productData: Product = {
            _id: "68082f7a7d3f057ab0fafd5c",
            name: "Wood Carving",
            description: "Neat carved wood art works",
            price: 20000,
            category: "Art Work",
            seller: "680821b06eda53ead327e0ea",
            images: [
              "images-1745366906480-810449189.jpeg",
              "images-1745366906494-585992412.jpeg",
            ],
            isSponsored: false,
            isActive: true,
            createdAt: "2025-04-23T00:08:26.519Z",
            updatedAt: "2025-04-23T00:08:26.519Z",
            type: [],
            stock: 100,
            logisticsCost: [],
            logisticsProviders: [],
          };

          setProduct(productData);
          setLoadingProduct(false);
        }, 600);
      } catch (error) {
        console.error("Error fetching product:", error);
        toast.error("Failed to load product details");
        setLoadingProduct(false);
      }
    };

    fetchProduct();
  }, [productId]);

  const handleBuy = async () => {
    if (!product) return;

    setIsSubmitting(true);

    try {
      // const result = await placeOrder({
      //   product: productId as string,
      //   seller: product.seller,
      //   amount: paymentAmount,
      // });
      setLoading(true);
      // if (result) {
      //   navigate(`/orders/${result._id}?status=pending`);
      // }
      navigate(`/trades/viewtrades/${product._id}?status=pending`);
    } catch (error) {
      console.error("Order creation error:", error);
      setError(error);
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  if (loadingProduct || !product) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-Dark min-h-screen flex items-center justify-center">
        <div className="bg-[#292B30] p-8 rounded-xl shadow-lg">
          <h2 className="text-Red text-xl font-bold mb-4">
            Error Loading Product
          </h2>
          <p className="text-white mb-6">{error}</p>
          <button
            // onClick={handleRetry}
            className={`${
              loadingProduct ? "bg-Red/20" : "bg-Red"
            } text-white py-2 px-6 rounded-md hover:bg-[#d52a33] transition-colors`}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <CheckoutLayout title={`Buy ${product.name}`} to="/trades/viewtrades">
      <div className="max-w-4xl mx-auto">
        <ProductInfo product={product} />

        <PaymentMethod onMethodChange={setPaymentMethod} />
        {paymentMethod === "fiat" && <></>}

        <motion.div
          className="mt-6 bg-[#292B30] rounded-lg p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="flex justify-between items-center">
            <span className="text-red-400">
              I will buy: {paymentAmount} usdt
            </span>
            <div className="flex space-x-2">
              <button className="bg-[#212428] px-3 py-1 rounded-md">
                USDT
              </button>
              <button className="bg-Red text-white px-3 py-1 rounded-md">
                ALL
              </button>
            </div>
          </div>

          <div className="mt-6">
            <input
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(Number(e.target.value))}
              className="w-full bg-[#212428] text-white p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-Red"
              aria-label="Payment amount"
            />
          </div>

          <motion.button
            className={`w-full text-white py-4 rounded-md mt-6 font-medium 
              ${
                isSubmitting
                  ? "bg-gray-600 cursor-not-allowed"
                  : "bg-Red hover:bg-[#e02d37]"
              }`}
            onClick={handleBuy}
            disabled={isSubmitting || loading}
            whileHover={
              !isSubmitting && !loading
                ? { backgroundColor: "#e02d37" }
                : undefined
            }
            whileTap={!isSubmitting && !loading ? { scale: 0.98 } : undefined}
          >
            {isSubmitting || loading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Processing...
              </div>
            ) : (
              "BUY NOW"
            )}
          </motion.button>

          <p className="text-sm text-[#AEAEB2] mt-4 text-center">
            If there is a risk, the withdrawals may be delayed by up to 24
            hours.
          </p>
        </motion.div>

        <motion.div
          className="mt-6 bg-[#292B30] rounded-lg p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="mt-6 p-4 rounded-md">
            <h4 className="font-medium mb-3">Advertiser Terms</h4>
            <p className="text-sm text-[#AEAEB2]">
              If you are seeing my ad, I'm active.
              <br />
              If there is kobo in your amount, make sure you pay it fully.
              <br />
              No telling payers to cancel time.
              <br />
              Please leave me a review.
              <br />
              Thanks. Don't pay with flutter wave or pocket app.
            </p>
          </div>
        </motion.div>

        <TransactionInfo
          sellerName="Femi Cole"
          rating={88}
          completedOrders={456}
          completionRate={99}
          avgPaymentTime="20 Minute(s)"
        />
      </div>
    </CheckoutLayout>
  );
};

export default BuyCheckout;
