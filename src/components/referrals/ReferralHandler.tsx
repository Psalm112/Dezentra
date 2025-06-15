import { useEffect, useState } from "react";
import { useReferralData } from "../../utils/hooks/useReferral";
import { useAuth } from "../../context/AuthContext";
import {
  clearPendingReferralCode,
  getPendingReferralCode,
} from "../../utils/referralUtils";

const ReferralHandler: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { applyCode } = useReferralData();
  const [isProcessed, setIsProcessed] = useState(false);

  useEffect(() => {
    const handleStoredReferralCode = async () => {
      if (!isAuthenticated || isProcessed) return;

      const storedCode = getPendingReferralCode();
      if (!storedCode) return;

      try {
        await applyCode(storedCode);
      } catch (error) {
        console.error("Failed to apply referral code:", error);
      } finally {
        clearPendingReferralCode();
        setIsProcessed(true);
      }
    };

    handleStoredReferralCode();
  }, [isAuthenticated, applyCode, isProcessed]);

  return null;
};

export default ReferralHandler;
