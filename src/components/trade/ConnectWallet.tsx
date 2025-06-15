// "use client";
// import { motion, AnimatePresence } from "framer-motion";
// import { FC, useState, useCallback, useEffect, useMemo, memo } from "react";
// import {
//   FaWallet,
//   FaSpinner,
//   FaGoogle,
//   FaEnvelope,
//   FaPhone,
//   FaFingerprint,
//   FaUserSecret,
//   FaSignOutAlt,
//   FaApple,
//   FaQrcode,
//   FaCopy,
//   FaCheck,
// } from "react-icons/fa";
// import { IoChevronDown } from "react-icons/io5";
// import { SiMetamask } from "react-icons/si";
// import TransactionConfirmation from "./TransactionConfirmation";
// import ConfirmDelivery from "./ConfirmDelivery";
// import { pendingTransactionProps } from "../../utils/types";
// import { useWallet, useWalletStatus } from "../../context/WalletContext";
// import { createDeviceInfo } from "../../utils/device.utils";

// export interface ConnectWalletProps {
//   showAlternatives?: boolean;
//   pendingTransaction?: pendingTransactionProps | null;
//   onTransactionComplete?: (success: boolean) => void;
// }

// // Optimized error message component
// const ErrorMessage = memo(({ error }: { error: string }) => (
//   <motion.div
//     initial={{ opacity: 0, y: -10 }}
//     animate={{ opacity: 1, y: 0 }}
//     exit={{ opacity: 0, y: -10 }}
//     className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-md mb-4 text-sm"
//     role="alert"
//     aria-live="polite"
//   >
//     {error}
//   </motion.div>
// ));

// // Success message component
// const SuccessMessage = memo(({ message }: { message: string }) => (
//   <motion.div
//     initial={{ opacity: 0, y: -10 }}
//     animate={{ opacity: 1, y: 0 }}
//     exit={{ opacity: 0, y: -10 }}
//     className="bg-green-500/10 border border-green-500/30 text-green-400 p-3 rounded-md mb-4 text-sm"
//     role="alert"
//     aria-live="polite"
//   >
//     {message}
//   </motion.div>
// ));

// // Loading spinner with accessibility
// const LoadingSpinner = memo(({ size = "sm" }: { size?: "sm" | "md" | "lg" }) => {
//   const sizeClasses = {
//     sm: "w-4 h-4",
//     md: "w-6 h-6",
//     lg: "w-8 h-8"
//   };

//   return (
//     <FaSpinner
//       className={`animate-spin ${sizeClasses[size]}`}
//       aria-label="Loading"
//     />
//   );
// });

// // Wallet icon with hover animation
// const WalletIcon = memo(() => (
//   <motion.div
//     whileHover={{ scale: 1.05 }}
//     transition={{ type: "spring", stiffness: 400, damping: 10 }}
//     className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 text-red-500 mb-4"
//   >
//     <FaWallet className="text-3xl" />
//   </motion.div>
// ));

// // Enhanced currency dropdown with better UX
// const CurrencyDropdown = memo(
//   ({
//     displayCurrency,
//     setDisplayCurrency,
//     showCurrencyDropdown,
//     setShowCurrencyDropdown,
//     currencyDropdownRef,
//   }: {
//     displayCurrency: "USDT" | "CELO" | "FIAT";
//     setDisplayCurrency: (currency: "USDT" | "CELO" | "FIAT") => void;
//     showCurrencyDropdown: boolean;
//     setShowCurrencyDropdown: (show: boolean) => void;
//     currencyDropdownRef: React.RefObject<HTMLDivElement>;
//   }) => {
//     const currencies = useMemo(() => [
//       { value: "USDT", label: "USDT", primary: true },
//       { value: "CELO", label: "CELO", primary: false },
//       { value: "FIAT", label: "FIAT", primary: false },
//     ] as const, []);

//     return (
//       <div className="relative" ref={currencyDropdownRef}>
//         <button
//           onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
//           className="text-xs px-3 py-1.5 bg-[#35383F] hover:bg-[#3F4249] rounded-md text-gray-300 flex items-center transition-all duration-200 min-w-[70px] justify-between"
//           aria-expanded={showCurrencyDropdown}
//           aria-haspopup="listbox"
//         >
//           <span className="font-medium">{displayCurrency}</span>
//           <motion.div
//             animate={{ rotate: showCurrencyDropdown ? 180 : 0 }}
//             transition={{ duration: 0.2 }}
//           >
//             <IoChevronDown className="w-3 h-3 ml-1" />
//           </motion.div>
//         </button>

//         <AnimatePresence>
//           {showCurrencyDropdown && (
//             <motion.div
//               initial={{ opacity: 0, scale: 0.95, y: -10 }}
//               animate={{ opacity: 1, scale: 1, y: 0 }}
//               exit={{ opacity: 0, scale: 0.95, y: -10 }}
//               transition={{ duration: 0.15 }}
//               className="absolute right-0 mt-2 w-28 bg-[#35383F] rounded-lg shadow-xl z-20 border border-[#3F4249] overflow-hidden"
//               role="listbox"
//             >
//               {currencies.map((currency) => (
//                 <button
//                   key={currency.value}
//                   onClick={() => {
//                     setDisplayCurrency(currency.value);
//                     setShowCurrencyDropdown(false);
//                   }}
//                   className={`block w-full text-left px-3 py-2.5 text-xs transition-colors ${
//                     displayCurrency === currency.value
//                       ? "bg-red-500/20 text-red-400"
//                       : "text-gray-300 hover:bg-[#3F4249]"
//                   }`}
//                   role="option"
//                   aria-selected={displayCurrency === currency.value}
//                 >
//                   <span className="font-medium">{currency.label}</span>
//                   {currency.primary && (
//                     <span className="text-xs text-gray-500 ml-1">(Main)</span>
//                   )}
//                 </button>
//               ))}
//             </motion.div>
//           )}
//         </AnimatePresence>
//       </div>
//     );
//   }
// );

// // Copy button with feedback
// const CopyButton = memo(({ text, label }: { text: string; label: string }) => {
//   const [copied, setCopied] = useState(false);

//   const handleCopy = useCallback(async () => {
//     try {
//       await navigator.clipboard.writeText(text);
//       setCopied(true);
//       setTimeout(() => setCopied(false), 2000);
//     } catch (err) {
//       console.error("Failed to copy:", err);
//     }
//   }, [text]);

//   return (
//     <button
//       onClick={handleCopy}
//       className="ml-2 p-1 text-gray-400 hover:text-red-400 transition-colors"
//       title={`Copy ${label}`}
//       aria-label={`Copy ${label}`}
//     >
//       <motion.div
//         key={copied ? "check" : "copy"}
//         initial={{ scale: 0 }}
//         animate={{ scale: 1 }}
//         transition={{ duration: 0.2 }}
//       >
//         {copied ? (
//           <FaCheck className="w-3 h-3 text-green-400" />
//         ) : (
//           <FaCopy className="w-3 h-3" />
//         )}
//       </motion.div>
//     </button>
//   );
// });

// // Enhanced wallet connection button
// const WalletConnectionButton = memo(({
//   onClick,
//   icon: Icon,
//   children,
//   disabled = false,
//   variant = "secondary",
//   loading = false,
//   className = "",
// }: {
//   onClick: () => void;
//   icon: any;
//   children: React.ReactNode;
//   disabled?: boolean;
//   variant?: "primary" | "secondary";
//   loading?: boolean;
//   className?: string;
// }) => {
//   const baseClasses = "w-full py-3 rounded-lg transition-all duration-200 flex items-center justify-center font-medium disabled:opacity-50 disabled:cursor-not-allowed";
//   const variants = {
//     primary: "bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl",
//     secondary: "bg-[#2A2D35] hover:bg-[#35383F] text-white border border-[#3A3D45] hover:border-[#4A4D55]"
//   };

//   return (
//     <motion.button
//       onClick={onClick}
//       disabled={disabled || loading}
//       className={`${baseClasses} ${variants[variant]} ${className}`}
//       whileHover={!disabled ? { scale: 1.02 } : {}}
//       whileTap={!disabled ? { scale: 0.98 } : {}}
//     >
//       {loading ? (
//         <LoadingSpinner size="sm" />
//       ) : (
//         <Icon className="w-4 h-4 mr-2" />
//       )}
//       {children}
//     </motion.button>
//   );
// });

// const ConnectWallet: FC<ConnectWalletProps> = ({
//   showAlternatives = true,
//   pendingTransaction = null,
//   onTransactionComplete = () => {},
// }) => {
//   const wallet = useWallet();
//   const { isConnected, isConnecting, hasError, account, walletType } = useWalletStatus();

//   // Local state
//   const [activeTab, setActiveTab] = useState<"main" | "email" | "phone">("main");
//   const [email, setEmail] = useState("");
//   const [phone, setPhone] = useState("");
//   const [verificationCode, setVerificationCode] = useState("");
//   const [authMethod, setAuthMethod] = useState<"email" | "phone" | null>(null);
//   const [showDetails, setShowDetails] = useState(false);
//   const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
//   const [localError, setLocalError] = useState<string | null>(null);
//   const [successMessage, setSuccessMessage] = useState<string | null>(null);

//   const currencyDropdownRef = React.useRef<HTMLDivElement>(null);
//   const deviceInfo = useMemo(() => createDeviceInfo(), []);

//   // Memoized values
//   const shortenedAddress = useMemo(
//     () => (account ? `${account.slice(0, 6)}...${account.slice(-4)}` : ""),
//     [account]
//   );

//   const formattedBalance = useMemo(() => {
//     if (!wallet.balances) return "0.00";

//     const balance = wallet.balances[wallet.displayCurrency?.toLowerCase() as keyof typeof wallet.balances] || "0";
//     const numBalance = parseFloat(balance);

//     if (wallet.displayCurrency === "FIAT") {
//       return new Intl.NumberFormat('en-US', {
//         style: 'currency',
//         currency: 'USD',
//         minimumFractionDigits: 2,
//         maximumFractionDigits: 2,
//       }).format(numBalance);
//     }

//     return `${numBalance.toFixed(4)} ${wallet.displayCurrency}`;
//   }, [wallet.balances, wallet.displayCurrency]);

//   const gasBalance = useMemo(() => {
//     if (!wallet.balances?.celo) return "0.00";
//     const balance = parseFloat(wallet.balances.celo);
//     return `${balance.toFixed(4)} CELO`;
//   }, [wallet.balances?.celo]);

//   // Enhanced connection handlers
//   const handleConnect = useCallback(async () => {
//     setLocalError(null);
//     setSuccessMessage(null);

//     try {
//       await wallet.connectRecommended();
//       setSuccessMessage("Wallet connected successfully!");
//     } catch (error: any) {
//       setLocalError(error.message || "Failed to connect wallet");
//     }
//   }, [wallet]);

//   const handleEmailConnect = useCallback(async () => {
//     if (!email.trim()) {
//       setLocalError("Please enter a valid email address");
//       return;
//     }

//     setLocalError(null);
//     try {
//       const result = await wallet.connectWallet("smart", "email");
//       if (result) {
//         setAuthMethod("email");
//       }
//     } catch (error: any) {
//       if (error.message?.includes("verification")) {
//         setAuthMethod("email");
//       } else {
//         setLocalError(error.message || "Failed to connect with email");
//       }
//     }
//   }, [email, wallet]);

//   const handlePhoneConnect = useCallback(async () => {
//     if (!phone.trim()) {
//       setLocalError("Please enter a valid phone number");
//       return;
//     }

//     setLocalError(null);
//     try {
//       const result = await wallet.connectWallet("smart", "phone");
//       if (result) {
//         setAuthMethod("phone");
//       }
//     } catch (error: any) {
//       if (error.message?.includes("verification")) {
//         setAuthMethod("phone");
//       } else {
//         setLocalError(error.message || "Failed to connect with phone");
//       }
//     }
//   }, [phone, wallet]);

//   const verifyCode = useCallback(async () => {
//     if (!verificationCode.trim()) {
//       setLocalError("Please enter the verification code");
//       return;
//     }

//     setLocalError(null);
//     try {
//       if (authMethod === "email") {
//         await wallet.connectWallet("smart", "email");
//       } else if (authMethod === "phone") {
//         await wallet.connectWallet("smart", "phone");
//       }
//       setSuccessMessage("Verification successful!");
//     } catch (error: any) {
//       setLocalError(error.message || "Verification failed");
//     }
//   }, [authMethod, verificationCode, wallet]);

//   const handleDisconnect = useCallback(async () => {
//     try {
//       await wallet.disconnect();
//       setActiveTab("main");
//       setEmail("");
//       setPhone("");
//       setVerificationCode("");
//       setAuthMethod(null);
//       setShowDetails(false);
//       setSuccessMessage("Wallet disconnected successfully");
//     } catch (error: any) {
//       setLocalError(error.message || "Failed to disconnect wallet");
//     }
//   }, [wallet]);

//   const resetToMain = useCallback(() => {
//     setAuthMethod(null);
//     setActiveTab("main");
//     setLocalError(null);
//     setSuccessMessage(null);
//   }, []);

//   // Click outside handler for dropdown
//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (
//         currencyDropdownRef.current &&
//         !currencyDropdownRef.current.contains(event.target as Node)
//       ) {
//         setShowCurrencyDropdown(false);
//       }
//     };

//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   // Clear messages on tab change
//   useEffect(() => {
//     setLocalError(null);
//     setSuccessMessage(null);
//   }, [activeTab]);

//   // Handle pending transactions
//   if (pendingTransaction) {
//     if (
//       pendingTransaction.type === "escrow" &&
//       pendingTransaction.contractAddress &&
//       pendingTransaction.amount
//     ) {
//       return (
//         <TransactionConfirmation
//           contractAddress={pendingTransaction.contractAddress}
//           amount={pendingTransaction.amount}
//           onComplete={onTransactionComplete}
//         />
//       );
//     }

//     if (pendingTransaction.type === "delivery" && pendingTransaction.tradeId) {
//       return (
//         <ConfirmDelivery
//           tradeId={pendingTransaction.tradeId}
//           onComplete={() => onTransactionComplete(true)}
//         />
//       );
//     }
//   }

//   // Connected state - Enhanced UI
//   if (isConnected && account) {
//     return (
//       <motion.div
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.3 }}
//         className="max-w-md mx-auto bg-[#212428] p-6 md:p-8 rounded-xl shadow-2xl border border-[#2A2D35]"
//       >
//         <AnimatePresence>
//           {localError && <ErrorMessage error={localError} />}
//           {successMessage && <SuccessMessage message={successMessage} />}
//         </AnimatePresence>

//         <div className="text-center mb-6">
//           <WalletIcon />
//           <p className="text-gray-400 text-sm mb-2">
//             Connected as{" "}
//             <span className="font-semibold text-white">{shortenedAddress}</span>
//             <CopyButton text={account} label="address" />
//           </p>
//           <h2 className="text-xl font-semibold text-white">Wallet Connected</h2>
//           {walletType && (
//             <p className="text-xs text-gray-500 mt-1 capitalize">
//               via {walletType}
//             </p>
//           )}
//         </div>

//         <AnimatePresence mode="wait">
//           {showDetails ? (
//             <motion.div
//               key="details"
//               initial={{ opacity: 0, height: 0 }}
//               animate={{ opacity: 1, height: "auto" }}
//               exit={{ opacity: 0, height: 0 }}
//               transition={{ duration: 0.3 }}
//               className="space-y-4"
//             >
//               <div className="bg-[#2A2D35] p-4 rounded-lg border border-[#35383F]">
//                 <p className="text-gray-400 text-sm mb-2">Wallet Address</p>
//                 <p className="text-white font-mono text-sm break-all flex items-center">
//                   {account}
//                   <CopyButton text={account} label="address" />
//                 </p>
//               </div>

//               <div className="bg-[#2A2D35] p-4 rounded-lg border border-[#35383F]">
//                 <div className="flex justify-between items-center mb-3">
//                   <p className="text-gray-400 text-sm">Main Balance</p>
//                   <CurrencyDropdown
//                     displayCurrency={wallet.displayCurrency || "USDT"}
//                     setDisplayCurrency={wallet.setDisplayCurrency || (() => {})}
//                     showCurrencyDropdown={showCurrencyDropdown}
//                     setShowCurrencyDropdown={setShowCurrencyDropdown}
//                     currencyDropdownRef={currencyDropdownRef}
//                   />
//                 </div>
//                 <p className="text-white font-bold text-lg">{formattedBalance}</p>
//                 <div className="mt-2 pt-2 border-t border-[#35383F]">
//                   <p className="text-gray-500 text-xs flex justify-between">
//                     <span>Gas Balance:</span>
//                     <span className="text-gray-300">{gasBalance}</span>
//                   </p>
//                 </div>
//               </div>

//               <div className="bg-[#2A2D35] p-4 rounded-lg border border-[#35383F]">
//                 <p className="text-gray-400 text-sm mb-2">Network</p>
//                 <p className="text-white flex items-center">
//                   <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
//                   {wallet.chainId === 42220 ? "Celo Mainnet" : "Celo Alfajores"}
//                   <span className="text-gray-500 text-sm ml-2">
//                     (Chain ID: {wallet.chainId})
//                   </span>
//                 </p>
//               </div>

//               <div className="flex gap-3">
//                 <button
//                   onClick={() => setShowDetails(false)}
//                   className="flex-1 py-3 bg-[#2A2D35] hover:bg-[#35383F] text-white rounded-lg transition-colors border border-[#3A3D45]"
//                 >
//                   Hide Details
//                 </button>
//                 <button
//                   onClick={wallet.refreshBalance}
//                   disabled={wallet.isLoadingBalance}
//                   className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center justify-center"
//                 >
//                   {wallet.isLoadingBalance ? (
//                     <LoadingSpinner size="sm" />
//                   ) : (
//                     "Refresh"
//                   )}
//                 </button>
//               </div>

//               <WalletConnectionButton
//                 onClick={handleDisconnect}
//                 icon={FaSignOutAlt}
//                 variant="primary"
//                 loading={isConnecting}
//                 className="bg-red-500 hover:bg-red-600"
//               >
//                 {isConnecting ? "Disconnecting..." : "Sign Out"}
//               </WalletConnectionButton>
//             </motion.div>
//           ) : (
//             <motion.div
//               key="simple"
//               initial={{ opacity: 0 }}
//               animate={{ opacity: 1 }}
//               exit={{ opacity: 0 }}
//               transition={{ duration: 0.2 }}
//               className="space-y-3"
//             >
//               <div className="bg-[#2A2D35] p-4 rounded-lg border border-[#35383F] text-center">
//                 <div className="flex justify-between items-center mb-2">
//                   <span className="text-gray-400 text-sm">Balance</span>
//                   <CurrencyDropdown
//                     displayCurrency={wallet.displayCurrency || "USDT"}
//                     setDisplayCurrency={wallet.setDisplayCurrency || (() => {})}
//                     showCurrencyDropdown={showCurrencyDropdown}
//                     setShowCurrencyDropdown={setShowCurrencyDropdown}
//                     currencyDropdownRef={currencyDropdownRef}
//                   />
//                 </div>
//                 <p className="text-white font-bold text-xl">{formattedBalance}</p>
//                 <p className="text-gray-500 text-xs mt-1">Gas: {gasBalance}</p>
//               </div>

//               <WalletConnectionButton
//                 onClick={() => setShowDetails(true)}
//                 icon={FaWallet}
//                 variant="secondary"
//               >
//                 View Details
//               </WalletConnectionButton>

//               <WalletConnectionButton
//                 onClick={handleDisconnect}
//                 icon={FaSignOutAlt}
//                 variant="primary"
//                 loading={isConnecting}
//                 className="bg-red-500 hover:bg-red-600"
//               >
//                 {isConnecting ? "Disconnecting..." : "Sign Out"}
//               </WalletConnectionButton>
//             </motion.div>
//           )}
//         </AnimatePresence>
//       </motion.div>
//     );
//   }

//   // Verification step
//   if (authMethod) {
//     return (
//       <motion.div
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.3 }}
//         className="max-w-md mx-auto bg-[#212428] p-6 md:p-8 rounded-xl shadow-2xl border border-[#2A2D35]"
//       >
//         <AnimatePresence>
//           {localError && <ErrorMessage error={localError} />}
//           {successMessage && <SuccessMessage message={successMessage} />}
//         </AnimatePresence>

//         <div className="text-center mb-6">
//           <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/10 text-blue-500 mb-4">
//             {authMethod === "email" ? (
//               <FaEnvelope className="text-3xl" />
//             ) : (
//               <FaPhone className="text-3xl" />
//             )}
//           </div>
//           <h2 className="text-xl font-semibold mb-2 text-white">
//             Verify Your {authMethod === "email" ? "Email" : "Phone"}
//           </h2>
//           <p className="text-gray-400 text-sm">
//             Enter the verification code sent to your{" "}
//             {authMethod === "email" ? "email" : "phone number"}
//           </p>
//         </div>

//         <div className="mb-6">
//           <input
//             type="text"
//             placeholder="Enter verification code"
//             value={verificationCode}
//             onChange={(e) => setVerificationCode(e.target.value)}
//             className="w-full bg-[#2A2D35] border border-[#3A3D45] rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
//             disabled={isConnecting}
//             maxLength={6}
//             autoComplete="one-time-code"
//           />
//         </div>

//         <div className="flex gap-3">
//           <WalletConnectionButton
//             onClick={resetToMain}
//             icon={() => <span>←</span>}
//             variant="secondary"
//             disabled={isConnecting}
//             className="flex-1"
//           >
//             Back
//           </WalletConnectionButton>
//           <WalletConnectionButton
//             onClick={verifyCode}
//             icon={FaCheck}
//             variant="primary"
//             disabled={isConnecting || !verificationCode.trim()}
//             loading={isConnecting}
//             className="flex-1"
//           >
//             {isConnecting ? "Verifying..." : "Verify"}
//           </WalletConnectionButton>
//         </div>
//       </motion.div>
//     );
//   }

//   // Email connection tab
//   if (activeTab === "email") {
//     return (
//       <motion.div
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.3 }}
//         className="max-w-md mx-auto bg-[#212428] p-6 md:p-8 rounded-xl shadow-2xl border border-[#2A2D35]"
//       >
//         <AnimatePresence>
//           {localError && <ErrorMessage error={localError} />}
//           {successMessage && <SuccessMessage message={successMessage} />}
//         </AnimatePresence>

//         <div className="text-center mb-6">
//           <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/10 text-blue-500 mb-4">
//             <FaEnvelope className="text-3xl" />
//           </div>
//           <h2 className="text-xl font-semibold mb-2 text-white">Connect with Email</h2>
//           <p className="text-gray-400 text-sm">
//             We'll send you a secure verification code
//           </p>
//         </div>

//         <div className="mb-6">
//           <input
//             type="email"
//             placeholder="Enter your email address"
//             value={email}
//             onChange={(e) => setEmail(e.target.value)}
//             className="w-full bg-[#2A2D35] border border-[#3A3D45] rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
//             disabled={isConnecting}
//             autoComplete="email"
//           />
//         </div>

//         <div className="flex gap-3">
//           <WalletConnectionButton
//             onClick={() => setActiveTab("main")}
//             icon={() => <span>←</span>}
//             variant="secondary"
//             disabled={isConnecting}
//             className="flex-1"
//           >
//             Back
//           </WalletConnectionButton>
//           <WalletConnectionButton
//             onClick={handleEmailConnect}
//             icon={FaEnvelope}
//             variant="primary"
//             disabled={isConnecting || !email.trim()}
//             loading={isConnecting}
//             className="flex-1"
//           >
//             {isConnecting ? "Sending..." : "Continue"}
//           </WalletConnectionButton>
//         </div>
//       </motion.div>
//     );
//   }

//   // Phone connection tab
//   if (activeTab === "phone") {
//     return (
//       <motion.div
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.3 }}
//         className="max-w-md mx-auto bg-[#212428] p-6 md:p-8 rounded-xl shadow-2xl border border-[#2A2D35]"
//       >
//         <AnimatePresence>
//           {localError && <ErrorMessage error={localError} />}
//           {successMessage && <SuccessMessage message={successMessage} />}
//         </AnimatePresence>

//         <div className="text-center mb-6">
//           <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 text-green-500 mb-4">
//             <FaPhone className="text-3xl" />
//           </div>
//           <h2 className="text-xl font-semibold mb-2 text-white">Connect with Phone</h2>
//           <p className="text-gray-400 text-sm">
//             We'll send you a verification code via SMS
//           </p>
//         </div>

//         <div className="mb-6">
//           <input
//             type="tel"
//             placeholder="Enter your phone number"
//             value={phone}
//             onChange={(e) => setPhone(e.target.value)}
//             className="w-full bg-[#2A2D35] border border-[#3A3D45] rounded-lg p-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
//             disabled={isConnecting}
//             autoComplete="tel"
//           />
//         </div>

//         <div className="flex gap-3">
//           <WalletConnectionButton
//             onClick={() => setActiveTab("main")}
//             icon={() => <span>←</span>}
//             variant="secondary"
//             disabled={isConnecting}
//             className="flex-1"
//           >
//             Back
//           </WalletConnectionButton>
//           <WalletConnectionButton
//             onClick={handlePhoneConnect}
//             icon={FaPhone}
//             variant="primary"
//             disabled={isConnecting || !phone.trim()}
//             loading={isConnecting}
//             className="flex-1"
//           >
//             {isConnecting ? "Sending..." : "Continue"}
//           </WalletConnectionButton>
//         </div>
//       </motion.div>
//     );
//   }

// // Main connection screen - Enhanced with better wallet options
// return (
//   <motion.div
//     initial={{ opacity: 0, y: 20 }}
//     animate={{ opacity: 1, y: 0 }}
//     transition={{ duration: 0.3 }}
//     className="max-w-md mx-auto bg-[#212428] p-6 md:p-8 rounded-xl shadow-2xl border border-[#2A2D35]"
//   >
//     <AnimatePresence>
//       {localError && <ErrorMessage error={localError} />}
//       {successMessage && <SuccessMessage message={successMessage} />}
//     </AnimatePresence>

//     <div className="text-center mb-8">
//       <WalletIcon />
//       <h2 className="text-2xl font-bold mb-2 text-white">Connect Wallet</h2>
//       <p className="text-gray-400 text-sm">
//         Choose your preferred wallet to get started
//       </p>
//     </div>

//     <div className="space-y-4">
//       {/* Recommended Connection */}
//       <WalletConnectionButton
//         onClick={handleConnect}
//         icon={FaWallet}
//         variant="primary"
//         loading={isConnecting}
//         className="text-lg py-4"
//       >
//         {isConnecting ? "Connecting..." : "Connect Recommended Wallet"}
//       </WalletConnectionButton>

//       {/* Enhanced Wallet Options */}
//       <EnhancedWalletOptions
//         onConnect={handleConnect}
//         isConnecting={isConnecting}
//         deviceInfo={deviceInfo}
//         walletInfo={wallet}
//         showAlternatives={showAlternatives}
//       />

//       {/* Alternative Connection Methods */}
//       {showAlternatives && (
//         <AlternativeConnectionMethods
//           activeTab={activeTab}
//           setActiveTab={setActiveTab}
//           isConnecting={isConnecting}
//         />
//       )}
//     </div>

//     {/* Connection Status */}
//     <ConnectionStatus isConnecting={isConnecting} hasError={hasError} />
//   </motion.div>
// );

//   // Enhanced wallet options with better performance
// const EnhancedWalletOptions = memo(({
//   onConnect,
//   isConnecting,
//   deviceInfo,
//   walletInfo,
//   showAlternatives
// }: {
//   onConnect: () => Promise<void>;
//   isConnecting: boolean;
//   deviceInfo: any;
//   walletInfo: any;
//   showAlternatives: boolean;
// }) => {
//   const [expandedOptions, setExpandedOptions] = useState(false);

//   const { availableWallets, recommendedWallet, openWalletWithFallback } = useWalletInfo();

//   const handleWalletConnect = useCallback(async (walletType: WalletType) => {
//     try {
//       if (deviceInfo.isMobile && !availableWallets.find(w => w.type === walletType)?.installed) {
//         openWalletWithFallback(walletType);
//         return;
//       }

//       await walletInfo.connectWallet(walletType);
//     } catch (error: any) {
//       console.error(`Failed to connect ${walletType}:`, error);
//     }
//   }, [deviceInfo, availableWallets, openWalletWithFallback, walletInfo]);

//   const displayWallets = useMemo(() => {
//     return expandedOptions ? availableWallets : availableWallets.slice(0, 3);
//   }, [availableWallets, expandedOptions]);

//   if (!showAlternatives) return null;

//   return (
//     <motion.div
//       initial={{ opacity: 0 }}
//       animate={{ opacity: 1 }}
//       transition={{ delay: 0.1 }}
//       className="space-y-3"
//     >
//       <div className="relative">
//         <div className="absolute inset-0 flex items-center">
//           <div className="w-full border-t border-[#3A3D45]"></div>
//         </div>
//         <div className="relative flex justify-center text-sm">
//           <span className="px-2 bg-[#212428] text-gray-500">Or connect with</span>
//         </div>
//       </div>

//       <AnimatePresence mode="wait">
//         <motion.div
//           className="space-y-2"
//           layout
//         >
//           {displayWallets.map((wallet, index) => (
//             <motion.div
//               key={wallet.type}
//               initial={{ opacity: 0, x: -20 }}
//               animate={{ opacity: 1, x: 0 }}
//               transition={{ delay: index * 0.05 }}
//               layout
//             >
//               <WalletOption
//                 wallet={wallet}
//                 onConnect={() => handleWalletConnect(wallet.type)}
//                 isConnecting={isConnecting}
//                 deviceInfo={deviceInfo}
//               />
//             </motion.div>
//           ))}
//         </motion.div>
//       </AnimatePresence>

//       {availableWallets.length > 3 && (
//         <motion.button
//           onClick={() => setExpandedOptions(!expandedOptions)}
//           className="w-full py-2 text-gray-400 hover:text-white text-sm transition-colors flex items-center justify-center"
//           whileHover={{ scale: 1.02 }}
//           whileTap={{ scale: 0.98 }}
//         >
//           {expandedOptions ? "Show Less" : `Show ${availableWallets.length - 3} More`}
//           <motion.div
//             animate={{ rotate: expandedOptions ? 180 : 0 }}
//             transition={{ duration: 0.2 }}
//             className="ml-1"
//           >
//             <IoChevronDown className="w-4 h-4" />
//           </motion.div>
//         </motion.button>
//       )}
//     </motion.div>
//   );
// });

// // Optimized individual wallet option
// const WalletOption = memo(({
//   wallet,
//   onConnect,
//   isConnecting,
//   deviceInfo
// }: {
//   wallet: WalletInfo;
//   onConnect: () => void;
//   isConnecting: boolean;
//   deviceInfo: any;
// }) => {
//   const getWalletIcon = useCallback((type: WalletType) => {
//     const iconMap = {
//       metamask: SiMetamask,
//       walletconnect: FaQrcode,
//       coinbase: FaWallet,
//       trust: FaWallet,
//       rainbow: FaWallet,
//       smart: FaUserSecret,
//     };
//     return iconMap[type] || FaWallet;
//   }, []);

//   const WalletIcon = getWalletIcon(wallet.type);

//   return (
//     <motion.button
//       onClick={onConnect}
//       disabled={isConnecting}
//       className={`w-full p-3 rounded-lg border transition-all duration-200 flex items-center justify-between group ${
//         wallet.recommended
//           ? "bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-500/30 hover:border-red-500/50"
//           : "bg-[#2A2D35] border-[#3A3D45] hover:border-[#4A4D55] hover:bg-[#35383F]"
//       } ${isConnecting ? "opacity-50 cursor-not-allowed" : ""}`}
//       whileHover={!isConnecting ? { scale: 1.02 } : {}}
//       whileTap={!isConnecting ? { scale: 0.98 } : {}}
//     >
//       <div className="flex items-center">
//         <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
//           wallet.installed ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"
//         }`}>
//           <WalletIcon className="w-4 h-4" />
//         </div>

//         <div className="text-left">
//           <div className="flex items-center">
//             <span className="text-white font-medium text-sm">{wallet.name}</span>
//             {wallet.recommended && (
//               <span className="ml-2 px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">
//                 Recommended
//               </span>
//             )}
//           </div>

//           <div className="flex items-center text-xs text-gray-500 mt-0.5">
//             {wallet.installed ? (
//               <span className="text-green-400">Installed</span>
//             ) : wallet.requiresDownload ? (
//               <span>Download required</span>
//             ) : (
//               <span>Available</span>
//             )}

//             {wallet.type === "walletconnect" && (
//               <span className="ml-2 flex items-center">
//                 <FaQrcode className="w-3 h-3 mr-1" />
//                 QR Code
//               </span>
//             )}
//           </div>
//         </div>
//       </div>

//       <div className="flex items-center">
//         {isConnecting ? (
//           <LoadingSpinner size="sm" />
//         ) : (
//           <motion.div
//             className="text-gray-400 group-hover:text-white transition-colors"
//             whileHover={{ x: 2 }}
//           >
//             →
//           </motion.div>
//         )}
//       </div>
//     </motion.button>
//   );
// });

// // Alternative connection methods (Email/Phone)
// const AlternativeConnectionMethods = memo(({
//   activeTab,
//   setActiveTab,
//   isConnecting
// }: {
//   activeTab: string;
//   setActiveTab: (tab: "main" | "email" | "phone") => void;
//   isConnecting: boolean;
// }) => (
//   <motion.div
//     initial={{ opacity: 0, y: 10 }}
//     animate={{ opacity: 1, y: 0 }}
//     transition={{ delay: 0.2 }}
//     className="space-y-3"
//   >
//     <div className="relative">
//       <div className="absolute inset-0 flex items-center">
//         <div className="w-full border-t border-[#3A3D45]"></div>
//       </div>
//       <div className="relative flex justify-center text-sm">
//         <span className="px-2 bg-[#212428] text-gray-500">Quick connect</span>
//       </div>
//     </div>

//     <div className="grid grid-cols-2 gap-3">
//       <WalletConnectionButton
//         onClick={() => setActiveTab("email")}
//         icon={FaEnvelope}
//         variant="secondary"
//         disabled={isConnecting}
//         className="text-sm py-2.5"
//       >
//         Email
//       </WalletConnectionButton>

//       <WalletConnectionButton
//         onClick={() => setActiveTab("phone")}
//         icon={FaPhone}
//         variant="secondary"
//         disabled={isConnecting}
//         className="text-sm py-2.5"
//       >
//         Phone
//       </WalletConnectionButton>
//     </div>

//     {/* Social login options for smart wallet */}
//     <SocialLoginOptions isConnecting={isConnecting} />
//   </motion.div>
// ));

// // Social login options with conditional rendering
// const SocialLoginOptions = memo(({ isConnecting }: { isConnecting: boolean }) => {
//   const { connectWithGoogle, connectWithApple } = useSmartWalletConnection();
//   const deviceInfo = useMemo(() => createDeviceInfo(), []);

//   const handleSocialLogin = useCallback(async (provider: 'google' | 'apple') => {
//     try {
//       if (provider === 'google') {
//         await connectWithGoogle();
//       } else if (provider === 'apple') {
//         await connectWithApple();
//       }
//     } catch (error) {
//       console.error(`${provider} login failed:`, error);
//     }
//   }, [connectWithGoogle, connectWithApple]);

//   return (
//     <div className="grid grid-cols-2 gap-2">
//       <WalletConnectionButton
//         onClick={() => handleSocialLogin('google')}
//         icon={FaGoogle}
//         variant="secondary"
//         disabled={isConnecting}
//         className="text-xs py-2"
//       >
//         Google
//       </WalletConnectionButton>

//       {deviceInfo.isIOS && (
//         <WalletConnectionButton
//           onClick={() => handleSocialLogin('apple')}
//           icon={FaApple}
//           variant="secondary"
//           disabled={isConnecting}
//           className="text-xs py-2"
//         >
//           Apple
//         </WalletConnectionButton>
//       )}
//     </div>
//   );
// });

// // Connection status indicator
// const ConnectionStatus = memo(({
//   isConnecting,
//   hasError
// }: {
//   isConnecting: boolean;
//   hasError: boolean;
// }) => {
//   if (!isConnecting && !hasError) return null;

//   return (
//     <motion.div
//       initial={{ opacity: 0, y: 10 }}
//       animate={{ opacity: 1, y: 0 }}
//       className="mt-6 text-center"
//     >
//       {isConnecting && (
//         <div className="flex items-center justify-center text-gray-400 text-sm">
//           <LoadingSpinner size="sm" />
//           <span className="ml-2">Establishing connection...</span>
//         </div>
//       )}
//     </motion.div>
//   );
// });

// // Update the display currency logic for USDT as main balance
// const UpdatedCurrencyDropdown = memo(
//   ({
//     displayCurrency,
//     setDisplayCurrency,
//     showCurrencyDropdown,
//     setShowCurrencyDropdown,
//     currencyDropdownRef,
//   }: {
//     displayCurrency: "USDT" | "CELO" | "FIAT";
//     setDisplayCurrency: (currency: "USDT" | "CELO" | "FIAT") => void;
//     showCurrencyDropdown: boolean;
//     setShowCurrencyDropdown: (show: boolean) => void;
//     currencyDropdownRef: React.RefObject<HTMLDivElement>;
//   }) => {
//     const currencies = useMemo(() => [
//       { value: "USDT", label: "USDT", primary: true, description: "Main Balance" },
//       { value: "CELO", label: "CELO", primary: false, description: "Gas Balance" },
//       { value: "FIAT", label: "USD", primary: false, description: "Fiat Value" },
//     ] as const, []);

//     return (
//       <div className="relative" ref={currencyDropdownRef}>
//         <button
//           onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
//           className="text-xs px-3 py-1.5 bg-[#35383F] hover:bg-[#3F4249] rounded-md text-gray-300 flex items-center transition-all duration-200 min-w-[80px] justify-between"
//           aria-expanded={showCurrencyDropdown}
//           aria-haspopup="listbox"
//         >
//           <span className="font-medium">
//             {currencies.find(c => c.value === displayCurrency)?.label}
//           </span>
//           <motion.div
//             animate={{ rotate: showCurrencyDropdown ? 180 : 0 }}
//             transition={{ duration: 0.2 }}
//           >
//             <IoChevronDown className="w-3 h-3 ml-1" />
//           </motion.div>
//         </button>

//         <AnimatePresence>
//           {showCurrencyDropdown && (
//             <motion.div
//               initial={{ opacity: 0, scale: 0.95, y: -10 }}
//               animate={{ opacity: 1, scale: 1, y: 0 }}
//               exit={{ opacity: 0, scale: 0.95, y: -10 }}
//               transition={{ duration: 0.15 }}
//               className="absolute right-0 mt-2 w-36 bg-[#35383F] rounded-lg shadow-xl z-20 border border-[#3F4249] overflow-hidden"
//               role="listbox"
//             >
//               {currencies.map((currency) => (
//                 <button
//                   key={currency.value}
//                   onClick={() => {
//                     setDisplayCurrency(currency.value);
//                     setShowCurrencyDropdown(false);
//                   }}
//                   className={`block w-full text-left px-3 py-3 text-xs transition-colors ${
//                     displayCurrency === currency.value
//                       ? "bg-red-500/20 text-red-400"
//                       : "text-gray-300 hover:bg-[#3F4249]"
//                   }`}
//                   role="option"
//                   aria-selected={displayCurrency === currency.value}
//                 >
//                   <div className="flex justify-between items-center">
//                     <span className="font-medium">{currency.label}</span>
//                     {currency.primary && (
//                       <span className="text-xs text-green-400">●</span>
//                     )}
//                   </div>
//                   <div className="text-xs text-gray-500 mt-0.5">
//                     {currency.description}
//                   </div>
//                 </button>
//               ))}
//             </motion.div>
//           )}
//         </AnimatePresence>
//       </div>
//     );
//   }
// );

// // Performance optimizations
// const ConnectWalletMemoized = memo(ConnectWallet);
// ConnectWalletMemoized.displayName = 'ConnectWallet';

// export default ConnectWalletMemoized;
