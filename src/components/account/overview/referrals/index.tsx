import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import PointsDisplay from "./PointsDisplay";
import ReferralInvite from "./Invite";
import ReferralHistory from "./History";
import ReferralSkeleton from "./Skeleton";
import { RewardItem } from "../../../../utils/types";
import { useReferralData } from "../../../../utils/hooks/useReferral";
import { useRewards } from "../../../../utils/hooks/useRewards";

const ReferralsTab = () => {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const inviteRef = useRef(null);

  const {
    referralInfo,
    formattedReferralInfo,
    loading: referralLoading,
    error: referralError,
    getReferralInfo,
  } = useReferralData();

  const {
    availablePoints,
    totalPoints,
    rewards,
    isLoading: rewardsLoading,
    error: rewardsError,
    fetchRewards,
    fetchSummary,
  } = useRewards();

  const loading = referralLoading || rewardsLoading;
  const error = referralError || rewardsError;

  // const handleInviteFriends = useCallback(() => {
  //   setIsShareModalOpen(true);
  // }, []);

  const formatRewardsHistory = useCallback(() => {
    if (!rewards || rewards.length === 0) return [];

    return rewards.map((reward): RewardItem => {
      const getActionTypeDisplay = (actionType: string) => {
        const actionMap: { [key: string]: string } = {
          FIRST_PURCHASE: "First Purchase Bonus",
          REFERRAL_BONUS: "Referral Bonus",
          PURCHASE: "Purchase Reward",
          PRODUCT_REVIEW: "Review Reward",
          SIGNUP: "Signup Bonus",
          REFERRAL_SIGNUP: "Friend Signup",
          DAILY_LOGIN: "Daily Login",
        };

        return actionMap[actionType] || actionType;
      };

      return {
        id: reward._id,
        name: "",
        type: getActionTypeDisplay(reward.actionType),
        points: reward.points,
        date: new Date(reward.createdAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        }),
        status: "Completed",
      };
    });
  }, [rewards]);

  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          getReferralInfo(false, true),
          fetchRewards(false, true),
          fetchSummary(false, true),
        ]);
      } catch (err) {
        console.error("Error loading referral data:", err);
      }
    };

    loadData();
  }, [getReferralInfo, fetchRewards, fetchSummary]);

  if (loading) {
    return <ReferralSkeleton />;
  }

  if (error) {
    return (
      <motion.div
        className="py-6 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <p className="text-red-400">{error}</p>
        <button
          className="mt-4 bg-Red text-white py-2 px-4 rounded"
          onClick={() => {
            getReferralInfo(false, true);
            fetchRewards(false, true);
            fetchSummary(false, true);
          }}
        >
          Try Again
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="py-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <PointsDisplay
        activePoints={availablePoints || 0}
        usedPoints={(totalPoints || 0) - (availablePoints || 0)}
      />

      <ReferralInvite
        promoCode={referralInfo?.referralCode || ""}
        shareLink={formattedReferralInfo?.shareLink || ""}
        isShareModalOpen={isShareModalOpen}
        setIsShareModalOpen={setIsShareModalOpen}
        referralCount={referralInfo?.referralCount || 0}
        ref={inviteRef}
      />

      <ReferralHistory
        history={formatRewardsHistory()}
        // onInviteFriends={handleInviteFriends}
      />
    </motion.div>
  );
};

export default ReferralsTab;
