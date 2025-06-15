import { useState } from "react";
import { Link } from "react-router-dom";
import { googleIcon, facebookIcon, xIcon, Logo } from ".";
import Button from "../components/common/Button";
import { useAuth } from "../context/AuthContext";
// import ConnectWallet from "../components/trade/ConnectWallet";
// import { useWallet } from "../utils/hooks/useWallet";

// import { IoChevronBack } from "react-icons/io5";
// import { FaWallet, FaCheck } from "react-icons/fa";

interface LoginProps {
  isFromReferral?: boolean;
}

const Login: React.FC<LoginProps> = ({ isFromReferral = false }) => {
  const pageTitle = isFromReferral ? "Create an account" : "Log in or sign up";
  // const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  // const [showConnectWallet, setShowConnectWallet] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  // const [walletConnected, setWalletConnected] = useState(false);
  // const { isConnected, account, balance, walletType } = useWallet();
  const [error, setError] = useState("");
  const { login } = useAuth();

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (error) setError("");
  };

  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    // email auth logic
    setTimeout(() => {
      setIsLoading(false);
      setError("Email login not implemented yet");
    }, 1500);
  };

  const handleSocialLogin = (provider: string) => {
    if (provider === "google") {
      setIsGoogleLoading(true);
      login(provider);
    }
  };

  // useEffect(() => {
  //   const handleWalletLogin = async () => {
  //     if (isConnected && account && !walletConnected) {
  //       try {
  //         setIsLoading(true);
  //         await loginWithWallet(account);
  //         setWalletConnected(true);
  //       } catch (error) {
  //         console.error("Error logging in with wallet:", error);
  //         setError("Failed to authenticate wallet");
  //       } finally {
  //         setIsLoading(false);
  //       }
  //     }
  //   };

  //   handleWalletLogin();
  // }, [isConnected, account, loginWithWallet]);

  // const formatWalletAddress = (address: string) => {
  //   if (!address) return "";
  //   return `${address.substring(0, 6)}...${address.substring(
  //     address.length - 4
  //   )}`;
  // };

  // const formatWalletType = (type: string | null) => {
  //   if (!type) return "Wallet";
  //   return type === "eoa" ? "MetaMask" : "Smart Wallet";
  // };

  // if (isConnected && walletConnected) {
  //   return (
  //     <div className="bg-Dark flex justify-center items-center py-10 min-h-screen">
  //       <div className="flex flex-col items-center w-full max-w-md px-6 md:px-10">
  //         <div className="flex flex-col items-center mb-8">
  //           <div className="bg-green-600 rounded-full p-6 mb-6">
  //             <FaCheck className="text-white text-4xl" />
  //           </div>
  //           <h2 className="text-2xl text-white font-bold">Wallet Connected!</h2>
  //         </div>

  //         <div className="bg-[#292B30] rounded-lg p-6 w-full mb-6">
  //           <div className="flex items-center gap-3 mb-4">
  //             <FaWallet className="text-Red text-xl" />
  //             <h3 className="text-white text-lg font-medium">
  //               {formatWalletType(walletType)}
  //             </h3>
  //           </div>

  //           <div className="flex flex-col gap-2">
  //             <p className="text-gray-400">Address</p>
  //             <p className="text-white">{formatWalletAddress(account || "")}</p>
  //           </div>

  //           {balance && (
  //             <div className="flex flex-col gap-2 mt-4">
  //               <p className="text-gray-400">Balance</p>
  //               <p className="text-white">{balance}</p>
  //             </div>
  //           )}
  //         </div>

  //         <Button
  //           title="Continue to Homepage"
  //           onClick={() => navigate("/")}
  //           className="bg-Red text-white h-12 flex justify-center w-full border-none outline-none text-center"
  //         />
  //       </div>
  //     </div>
  //   );
  // }

  //  {showConnectWallet ? (
  //       <div className="relative">
  //         <span className="absolute top-0 left-0 p-4 font-light text-xl pointer">
  //           <IoChevronBack
  //             className="h-8 w-8"
  //             onClick={() => setShowConnectWallet(false)}
  //           />
  //         </span>
  //         <ConnectWallet showAlternatives={true} />
  //       </div>
  //     ) : (
  return (
    <div className="bg-Dark flex justify-center items-center py-10 min-h-screen">
      <div className="flex flex-col items-center w-full max-w-md px-6 md:px-10">
        <div className="flex flex-col gap-8">
          <img
            src={Logo}
            alt="Dezenmart Logo"
            className="w-[75px] h-[75px] mx-auto"
          />
          {isFromReferral && (
            <h1 className="text-2xl font-bold text-white mb-2">
              You've been invited!
            </h1>
          )}
          <h2 className="text-2xl text-white font-bold mb-6">{pageTitle}</h2>
          {isFromReferral && (
            <>
              <p className="text-gray-400">
                Sign up to receive points on your first purchase
              </p>
            </>
          )}
        </div>

        <form onSubmit={handleEmailLogin} className="w-full">
          <input
            type="email"
            className={`text-white bg-[#292B30] h-12 w-full border-none outline-none px-4 mb-2 ${
              error ? "border-l-4 border-l-Red" : ""
            }`}
            placeholder="Enter your email"
            value={email}
            onChange={handleEmailChange}
          />

          {error && <p className="text-Red text-sm mb-3 mt-1">{error}</p>}

          <Button
            title={isLoading ? "Please wait..." : "Continue"}
            type="submit"
            className="bg-Red text-white h-12 flex justify-center w-full border-none outline-none text-center mb-5"
            disabled={isLoading}
          />
        </form>

        <div className="w-full">
          {/* Social Login Buttons */}
          <div className="space-y-3 w-full">
            <Button
              title={
                isGoogleLoading
                  ? "Redirecting to Google..."
                  : "Sign in with Google"
              }
              img={googleIcon}
              path=""
              className="bg-[#292B30] flex justify-center gap-2 text-white h-12 rounded-md w-full border-none"
              onClick={() => handleSocialLogin("google")}
              disabled={isGoogleLoading}
            />

            <Button
              title="Sign in with Facebook"
              img={facebookIcon}
              className="bg-[#292B30] flex justify-center gap-2 text-white h-12 rounded-md w-full border-none"
              onClick={() => handleSocialLogin("facebook")}
            />

            <Button
              title="Sign in with X"
              img={xIcon}
              className="bg-[#292B30] flex justify-center gap-2 text-white h-12 rounded-md w-full border-none mb-6"
              onClick={() => handleSocialLogin("x")}
            />
          </div>
          {/* <div className="relative flex items-center justify-center my-12">
            <hr className="border-t border-gray-700 w-full" />
            <span className="text-white text-sm bg-Dark px-3 absolute">OR</span>
          </div> */}
          {/* Connect Wallet Button */}
          {/* <Button
              title="Connect with a wallet"
              onClick={() => setShowConnectWallet(true)}
              className="bg-[#292B30] text-white h-12 flex justify-center w-full border-none outline-none text-center"
            /> */}
        </div>

        <p className="text-sm text-center font-medium text-white mt-6">
          By logging in, you agree to our{" "}
          <Link to="/terms" className="text-[#4FA3FF]">
            Terms of Service
          </Link>{" "}
          &{" "}
          <Link to="/privacy" className="text-[#4FA3FF]">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
      {/* )} */}
    </div>
  );
};

export default Login;
