export const storeReferralCode = (code: string): void => {
  sessionStorage.setItem("pendingReferralCode", code);
};

export const getPendingReferralCode = (): string | null => {
  return sessionStorage.getItem("pendingReferralCode");
};

export const clearPendingReferralCode = (): void => {
  sessionStorage.removeItem("pendingReferralCode");
};

// export const formatReferralLink = (code: string): string => {
//   return `${window.location.origin}/referral?code=${code}`;
// };
