import { useState, useEffect, lazy, Suspense, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Container from "../components/common/Container";
import ProfileHeader from "../components/account/ProfileHeader";
import TabNavigation from "../components/account/overview/TabNavigation";
import { LiaAngleDownSolid } from "react-icons/lia";
import Button from "../components/common/Button";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { useUserManagement } from "../utils/hooks/useUser";
import { TabOption, TabType } from "../utils/types";

const TabContent = lazy(
  () => import("../components/account/overview/TabContent")
);
const EditProfile = lazy(
  () => import("../components/account/edit/EditProfile")
);
const Settings = lazy(() => import("../components/account/settings/Settings"));

const TAB_OPTIONS: TabOption[] = [
  { id: "1", label: "Saved Items" },
  { id: "2", label: "Rewards" },
  { id: "3", label: "Order History" },
  { id: "4", label: "Dispute History" },
  { id: "5", label: "Create Product" },
];

const LoadingFallback = () => (
  <div className="flex justify-center items-center min-h-[300px]">
    <LoadingSpinner />
  </div>
);

const ErrorState = ({ error, retry }: { error: string; retry: () => void }) => (
  <div className="text-center p-8 bg-[#292B30] rounded-lg">
    <h2 className="text-xl font-bold mb-4">Unable to load profile</h2>
    <p className="text-gray-400 mb-4">{error}</p>
    <Button
      title="Retry"
      onClick={retry}
      className="mx-auto bg-Red hover:bg-[#e02d37] text-white px-6 py-2 rounded-lg transition-colors"
    />
  </div>
);

export type AccountViewState = "overview" | "settings" | "edit-profile";

const Account = () => {
  const {
    selectedUser,
    formattedSelectedUser,
    isLoading,
    error,
    fetchProfile,
    isError,
  } = useUserManagement();

  const [activeTab, setActiveTab] = useState<TabType>("1");
  const [viewState, setViewState] = useState<AccountViewState>("overview");

  useEffect(() => {
    fetchProfile(false, false);
  }, [fetchProfile]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeTab]);

  const handleShowEditProfile = useCallback(
    () => setViewState("edit-profile"),
    []
  );
  const handleShowSettings = useCallback(() => setViewState("settings"), []);
  // const handleBackToOverview = useCallback(() => setViewState("overview"), []);

  const handleRetryFetch = useCallback(() => {
    fetchProfile(true, true);
  }, [fetchProfile]);

  // Loading state
  if (isLoading && !selectedUser) {
    return (
      <div className="bg-Dark min-h-screen text-white flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Error state
  if (isError && !selectedUser) {
    return (
      <div className="bg-Dark min-h-screen text-white flex items-center justify-center">
        <ErrorState
          error={error || "Failed to load profile"}
          retry={handleRetryFetch}
        />
      </div>
    );
  }

  // if (!selectedUser) {
  //   return (
  //     <div className="bg-Dark min-h-screen text-white flex items-center justify-center">
  //       <Button
  //         title="Load Profile"
  //         onClick={() => fetchProfile(true, true)}
  //         className="mx-auto bg-Red hover:bg-[#e02d37] text-white px-6 py-2 rounded-lg transition-colors"
  //       />
  //     </div>
  //   );
  // }

  if (!selectedUser) {
    return (
      <div className="bg-Dark min-h-screen text-white flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  return (
    <div className="bg-Dark min-h-screen text-white">
      <Container className="py-6 md:py-10">
        {viewState === "settings" ? (
          <Suspense fallback={<LoadingFallback />}>
            <Settings
              setViewState={(state) => setViewState(state)}
              profileData={formattedSelectedUser}
            />
          </Suspense>
        ) : viewState === "edit-profile" ? (
          <Suspense fallback={<LoadingFallback />}>
            <EditProfile
              avatar={
                typeof selectedUser?.profileImage === "string"
                  ? selectedUser?.profileImage
                  : ""
              }
              setViewState={() => setViewState("overview")}
              currentProfile={formattedSelectedUser}
            />
          </Suspense>
        ) : (
          // selectedUser && (
          <>
            <ProfileHeader
              avatar={
                typeof selectedUser?.profileImage === "string"
                  ? selectedUser?.profileImage
                  : ""
              }
              name={selectedUser.name}
              id={selectedUser._id}
              email={selectedUser.email}
              showSettings={handleShowSettings}
            />
            <motion.div
              className="w-full max-w-[650px] mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Button
                title="Edit Profile"
                icon={<LiaAngleDownSolid />}
                path=""
                onClick={handleShowEditProfile}
                className="bg-white text-black text-lg font-bold h-11 rounded-none flex justify-center w-full border-none outline-none text-center my-2 hover:bg-gray-100 transition-colors"
              />
            </motion.div>
            <TabNavigation
              activeTab={activeTab}
              onTabChange={setActiveTab}
              options={TAB_OPTIONS}
            />
            <AnimatePresence mode="wait">
              <Suspense fallback={<LoadingFallback />}>
                <TabContent
                  activeTab={activeTab}
                  milestones={selectedUser.milestones}
                  referralCode={selectedUser.referralCode}
                  referralCount={selectedUser.referralCount}
                  points={{
                    total: selectedUser.totalPoints,
                    available: selectedUser.availablePoints,
                  }}
                />
              </Suspense>
            </AnimatePresence>
          </>
        )}
      </Container>
    </div>
  );
};

export default Account;
