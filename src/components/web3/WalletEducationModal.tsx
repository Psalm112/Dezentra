import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HiWallet,
  HiShieldCheck,
  HiCurrencyDollar,
  HiArrowLeft,
  HiArrowRight,
  HiPlay,
} from "react-icons/hi2";
import Modal from "../common/Modal";
import Button from "../common/Button";
import { WalletEducationStep } from "../../utils/types/web3.types";

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
      "A crypto wallet is like a digital bank account that lets you store, send, and receive digital money. Think of it as your personal vault that only you can access.",
    icon: <HiWallet className="w-12 h-12 text-Red" />,
  },
  {
    id: "why-secure",
    title: "Why Are Wallets Secure?",
    description:
      "Your wallet uses advanced encryption - like having a secret key that only you know. No one else, including us, can access your funds without your permission.",
    icon: <HiShieldCheck className="w-12 h-12 text-Red" />,
  },
  {
    id: "how-payments-work",
    title: "How Do Crypto Payments Work?",
    description:
      "When you buy something, your wallet sends digital dollars (USDT) directly to our secure escrow. It's like paying with a debit card, but even more secure.",
    icon: <HiCurrencyDollar className="w-12 h-12 text-Red" />,
  },
];

const WalletEducationModal: React.FC<WalletEducationModalProps> = ({
  isOpen,
  onClose,
  onBack,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = () => {
    if (currentStep < educationSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isLastStep = currentStep === educationSteps.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Understanding Crypto Wallets"
      maxWidth="md:max-w-lg"
    >
      <div className="space-y-6">
        {/* Progress Bar */}
        <div className="flex items-center gap-2">
          {educationSteps.map((_, index) => (
            <div
              key={index}
              className={`flex-1 h-2 rounded-full transition-all duration-300 ${
                index <= currentStep ? "bg-Red shadow-sm" : "bg-Dark"
              }`}
            />
          ))}
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="text-center space-y-6"
          >
            <motion.div
              className="flex justify-center"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <div className="w-16 h-16 bg-Red/20 rounded-full flex items-center justify-center">
                {educationSteps[currentStep].icon}
              </div>
            </motion.div>

            <div className="space-y-3">
              <h3 className="text-xl font-bold text-white">
                {educationSteps[currentStep].title}
              </h3>
              <p className="text-gray-300 leading-relaxed max-w-md mx-auto">
                {educationSteps[currentStep].description}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            title="Back"
            icon={<HiArrowLeft className="w-4 h-4" />}
            iconPosition="start"
            onClick={isFirstStep ? onBack : prevStep}
            className="bg-gray-700 hover:bg-gray-600 text-white transition-colors"
          />

          <div className="text-sm text-gray-400">
            {currentStep + 1} of {educationSteps.length}
          </div>

          {isLastStep ? (
            <Button
              title="Get Started"
              icon={<HiPlay className="w-4 h-4" />}
              onClick={onBack}
              className="bg-Red hover:bg-Red/80 text-white transition-colors"
            />
          ) : (
            <Button
              title="Next"
              icon={<HiArrowRight className="w-4 h-4" />}
              onClick={nextStep}
              className="bg-Red hover:bg-Red/80 text-white transition-colors"
            />
          )}
        </div>

        {/* Pro Tips */}
        <div className="border-t border-Red/20 pt-4">
          <div className="bg-Red/10 border border-Red/20 rounded-lg p-4">
            <h4 className="font-medium text-Red mb-2">💡 Pro Tip</h4>
            <p className="text-sm text-Red/80">
              {currentStep === 0 &&
                "Most people already have a wallet app on their phone - like MetaMask or Coinbase Wallet."}
              {currentStep === 1 &&
                "Your wallet generates a unique 'address' - like an account number that others can send money to."}
              {currentStep === 2 &&
                "Transactions are recorded on a public ledger, making them more transparent than traditional payments."}
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default WalletEducationModal;
