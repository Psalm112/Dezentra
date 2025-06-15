import { FC, useState } from "react";
import { motion } from "framer-motion";

interface PaymentMethodProps {
  onMethodChange: (method: string) => void;
}

const PaymentMethod: FC<PaymentMethodProps> = ({ onMethodChange }) => {
  const [activeMethod, setActiveMethod] = useState<string>("crypto");

  const handleMethodChange = (method: string) => {
    setActiveMethod(method);
    onMethodChange(method);
  };

  return (
    <motion.div
      className="mt-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <div className="flex">
        <motion.button
          className={`py-4 px-4 font-medium relative ${
            activeMethod === "crypto" ? "text-Red" : "text-[#545456]"
          }`}
          onClick={() => handleMethodChange("crypto")}
          whileHover={{ backgroundColor: "rgba(255,255,255,0.05)" }}
          whileTap={{ scale: 0.98 }}
        >
          With Crypto
          {activeMethod === "crypto" && (
            <motion.div
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-Red"
              layoutId="activePaymentMethod"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 0.3 }}
            />
          )}
        </motion.button>

        <motion.button
          className={`py-4 px-4 font-medium relative ${
            activeMethod === "fiat" ? "text-Red" : "text-[#545456]"
          }`}
          onClick={() => handleMethodChange("fiat")}
          whileHover={{ backgroundColor: "rgba(255,255,255,0.05)" }}
          whileTap={{ scale: 0.98 }}
        >
          With Fiat
          {activeMethod === "fiat" && (
            <motion.div
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-Red"
              layoutId="activePaymentMethod"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 0.3 }}
            />
          )}
        </motion.button>
      </div>
    </motion.div>
  );
};

export default PaymentMethod;
