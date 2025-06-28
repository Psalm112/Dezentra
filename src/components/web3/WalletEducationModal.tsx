import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiWallet,
  HiShieldCheck,
  HiCurrencyDollar,
  HiArrowLeft,
  HiArrowRight,
  HiPlay,
  HiGlobeAlt,
  HiBoltSlash,
  HiCheckBadge,
} from "react-icons/hi2";
import Modal from "../common/Modal";
import Button from "../common/Button";
import { WalletEducationStep } from "../../utils/types/web3.types";
import {
  TARGET_CHAIN,
  SUPPORTED_CHAINS,
  getChainMetadata,
} from "../../utils/config/web3.config";

interface WalletEducationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
}

const educationSteps: WalletEducationStep[] = [
  {
    id: "what-is-wallet",
    title: "What is a Crypto Wallet?",
    description:
      "A crypto wallet is your digital identity for blockchain transactions. It's like having a secure bank account that works across different networks, giving you full control over your funds and transactions.",
    icon: <HiWallet className="w-12 h-12 text-Red" />,
  },
  {
    id: "cross-chain-benefits",
    title: "Why Cross-Chain Shopping?",
    description:
      "Shop from sellers on any supported blockchain network. Your wallet automatically handles different networks like Avalanche, Ethereum, Base, and Arbitrum - giving you access to global products with local convenience.",
    icon: <HiGlobeAlt className="w-12 h-12 text-Blue" />,
  },
  {
    id: "security-first",
    title: "Bank-Level Security",
    description:
      "Your wallet uses military-grade encryption and smart contracts for escrow protection. Every transaction is verified on the blockchain, making it more secure than traditional online payments.",
    icon: <HiShieldCheck className="w-12 h-12 text-Green" />,
  },
  {
    id: "seamless-payments",
    title: "How Payments Work",
    description:
      "Pay with stablecoins (digital dollars) that hold their value. Funds are held in secure escrow until you confirm delivery, protecting both buyers and sellers in every transaction.",
    icon: <HiCurrencyDollar className="w-12 h-12 text-Yellow" />,
  },
];

const WalletEducationModal: React.FC<WalletEducationModalProps> = ({
  isOpen,
  onClose,
  onBack,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = useCallback(() => {
    if (currentStep < educationSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const isLastStep = currentStep === educationSteps.length - 1;
  const isFirstStep = currentStep === 0;

  // pro tips with cross-chain focus
  const getProTip = useCallback(() => {
    const tips = [
      "Most wallets like MetaMask support multiple networks - you can switch between them easily.",
      "Your wallet address is the same across all networks, but your balance might be different on each.",
      "Cross-chain transactions use bridge technology to move value between different blockchains securely.",
      "Stablecoins like USDT maintain $1 value, making them perfect for international shopping without currency risk.",
    ];
    return tips[currentStep] || tips[0];
  }, [currentStep]);

  // Network statistics for education
  const networkStats = {
    supported: SUPPORTED_CHAINS.length,
    primary: getChainMetadata(TARGET_CHAIN.id)?.name || TARGET_CHAIN.name,
    features: [
      "Instant Settlement",
      "Low Fees",
      "Global Access",
      "Secure Escrow",
    ],
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Understanding Cross-Chain Wallets"
      maxWidth="md:max-w-lg"
    >
      <div className="space-y-6">
        {/* Progress Bar */}
        <div className="flex items-center gap-2">
          {educationSteps.map((_, index) => (
            <div
              key={index}
              className={`flex-1 h-2 rounded-full transition-all duration-300 ${
                index <= currentStep
                  ? "bg-gradient-to-r from-Red to-Blue shadow-sm"
                  : "bg-Dark"
              }`}
            />
          ))}
        </div>

        {/* Step Content  */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="text-center space-y-6"
          >
            <motion.div
              className="flex justify-center"
              initial={{ scale: 0.8, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            >
              <div className="w-20 h-20 bg-gradient-to-br from-Red/20 to-Blue/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/10">
                {educationSteps[currentStep].icon}
              </div>
            </motion.div>

            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-xl font-bold text-white">
                {educationSteps[currentStep].title}
              </h3>
              <p className="text-gray-300 leading-relaxed max-w-md mx-auto text-sm">
                {educationSteps[currentStep].description}
              </p>
            </motion.div>

            {/* Step-specific additional content */}
            {currentStep === 1 && (
              <motion.div
                className="grid grid-cols-2 gap-2 text-xs"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <div className="bg-Blue/10 border border-Blue/20 rounded-lg p-2">
                  <div className="font-medium text-Blue">
                    {networkStats.supported} Networks
                  </div>
                  <div className="text-gray-400">Supported</div>
                </div>
                <div className="bg-Red/10 border border-Red/20 rounded-lg p-2">
                  <div className="font-medium text-Red">
                    {networkStats.primary}
                  </div>
                  <div className="text-gray-400">Primary</div>
                </div>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                className="flex flex-wrap justify-center gap-2 text-xs"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {networkStats.features.map((feature, index) => (
                  <div
                    key={feature}
                    className="flex items-center gap-1 bg-Green/10 border border-Green/20 rounded-full px-2 py-1"
                  >
                    <HiCheckBadge className="w-3 h-3 text-Green" />
                    <span className="text-Green">{feature}</span>
                  </div>
                ))}
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            title={isFirstStep ? "Back" : "Previous"}
            icon={<HiArrowLeft className="w-4 h-4" />}
            iconPosition="start"
            onClick={isFirstStep ? onBack : prevStep}
            className="bg-gray-700 hover:bg-gray-600 text-white transition-all duration-200 hover:scale-105"
          />

          <div className="flex items-center gap-2">
            <div className="text-sm text-gray-400">
              {currentStep + 1} of {educationSteps.length}
            </div>
            {/* Mini step indicators */}
            <div className="flex gap-1">
              {educationSteps.map((_, index) => (
                <div
                  key={index}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    index === currentStep ? "bg-Red" : "bg-gray-600"
                  }`}
                />
              ))}
            </div>
          </div>

          {isLastStep ? (
            <Button
              title="Start Shopping"
              icon={<HiPlay className="w-4 h-4" />}
              onClick={onBack}
              className="bg-gradient-to-r from-Red to-Blue hover:from-Red/80 hover:to-Blue/80 text-white transition-all duration-200 hover:scale-105"
            />
          ) : (
            <Button
              title="Next"
              icon={<HiArrowRight className="w-4 h-4" />}
              onClick={nextStep}
              className="bg-Red hover:bg-Red/80 text-white transition-all duration-200 hover:scale-105"
            />
          )}
        </div>

        {/* Pro Tips */}
        <div className="border-t border-Red/20 pt-4">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-Red/10 to-Blue/10 border border-Red/20 rounded-lg p-4"
          >
            <div className="flex items-start gap-2">
              <div className="text-lg">💡</div>
              <div>
                <h4 className="font-medium text-Red mb-1">Pro Tip</h4>
                <p className="text-sm text-Red/80 leading-relaxed">
                  {getProTip()}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Quick stats footer */}
        <div className="text-center text-xs text-gray-500 border-t border-gray-700/50 pt-3">
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-1">
              <HiBoltSlash className="w-3 h-3" />
              <span>Low Fees</span>
            </div>
            <div className="flex items-center gap-1">
              <HiShieldCheck className="w-3 h-3" />
              <span>Secure</span>
            </div>
            <div className="flex items-center gap-1">
              <HiGlobeAlt className="w-3 h-3" />
              <span>Global</span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default WalletEducationModal;
