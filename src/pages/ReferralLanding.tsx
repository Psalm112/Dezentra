import { useEffect } from "react";
import { useSearchParams, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Logo } from ".";
import Login from "./Login";
import { storeReferralCode } from "../utils/referralUtils";
// import { useReferralData } from "../utils/hooks/useReferralData";
import { useAuth } from "../context/AuthContext";

const ReferralLanding = () => {
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  //   const { applyCode } = useReferralData();

  useEffect(() => {
    const referralCode = searchParams.get("code");

    if (referralCode) {
      storeReferralCode(referralCode);
    }
  }, [searchParams]);

  if (isAuthenticated) {
    return <Navigate to="/" />;
  }

  return <Login isFromReferral={true} />;
};

export default ReferralLanding;
