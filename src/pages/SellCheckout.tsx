import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import CheckoutLayout from "../components/trade/checkout/CheckoutLayout";
import ProductInfo from "../components/trade/checkout/ProductInfo";
import PaymentMethod from "../components/trade/checkout/PaymentMethod";
import TransactionInfo from "../components/trade/checkout/TransactionInfo";
import { Product } from "../utils/types";

const SellCheckout = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(190);
  const [paymentMethod, setPaymentMethod] = useState<string>("crypto");

  useEffect(() => {
    const fetchProduct = async () => {
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
        setIsLoading(false);
      }, 600);
    };

    fetchProduct();
  }, [productId]);

  const handleSell = () => {
    // sell logic
    // console.log("Sell initiated for:", product);
    // console.log("Payment amount:", paymentAmount);
    // console.log("Payment method:", paymentMethod);

    // success message and redirect
    setTimeout(() => {
      navigate("/trades/viewtrades");
    }, 1000);
  };

  if (isLoading || !product) {
    return (
      <CheckoutLayout title="Sell Car">
        <div className="flex justify-center items-center min-h-[50vh]">
          <motion.div
            className="w-16 h-16 border-4 border-Red border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </div>
      </CheckoutLayout>
    );
  }

  return (
    <CheckoutLayout title={`Sell ${product.name}`} to="/trades/viewtrades">
      <div className="max-w-4xl mx-auto">
        <ProductInfo product={product} />

        <PaymentMethod onMethodChange={setPaymentMethod} />

        <motion.div
          className="mt-6 bg-[#292B30] rounded-lg p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="flex justify-between items-center">
            <span className="text-white">
              <span className="text-red-400">Available: 2 cars</span> |{" "}
              <span className="text-green-400">
                Available for sale: 200 Cars
              </span>
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
            />
          </div>

          <motion.button
            className="w-full bg-Red text-white py-4 rounded-md mt-6 font-medium"
            onClick={handleSell}
            whileHover={{ backgroundColor: "#e02d37" }}
            whileTap={{ scale: 0.98 }}
          >
            SELL
          </motion.button>

          <p className="text-sm text-[#AEAEB2] mt-4">
            Please, kindly wait for the counterparty to make payment. The Token
            for this sale will be transferred from your account.
          </p>
        </motion.div>
        <motion.div
          className="mt-6 bg-[#292B30] rounded-lg p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="mt-6 p-4 rounded-md">
            <h4 className="font-medium mb-3">Remarks</h4>
            <p className="text-sm text-[#AEAEB2]">
              You're welcome 👍
              <br />
              <br />
              Let's stay safe from the government.
              <br />
              I pay only round figures please. I don't pay extras on top like
              20, 30, 40.
              <br />
              Please understand, round up number b4 u open trade. I DON'T CANCEL
              TRADE PLSS TAKE NOTE.
              <br />
              Drop active number please release fast. NO NUMBER NO PAYMENT
              <br />
              Attention for number so I can call if u 4get too release don't
              have any reason to call if u release coin Always remember to leave
              a positive feedback.
              <br />
              🙂 Thank and happy trading 🙂
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

export default SellCheckout;
