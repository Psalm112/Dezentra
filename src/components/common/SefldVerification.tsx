"use client";
import React, { useEffect, useState } from "react";
import Modal from "./Modal";
import { FullLogo } from "../../pages";
import { v4 as uuidv4 } from "uuid";
import SelfQRcodeWrapper from "@selfxyz/qrcode";
import { getUniversalLink, SelfAppBuilder } from "@selfxyz/core";
import type { SelfApp } from "@selfxyz/common/utils/appType";
import { useAuth } from "../../context/AuthContext";
import { useSnackbar } from "../../context/SnackbarContext";
// import { useUserManagement } from "../../utils/hooks/useUser";

interface props {
  isOpen: boolean;
  onClose: () => void;
}

function SefldVerification({ isOpen, onClose }: props) {
  const { user } = useAuth();
  const { showSnackbar } = useSnackbar();
  // const {
  //   selectedUser,
  //   formattedSelectedUser,
  //   isLoading,
  //   error,
  //   fetchProfile,
  //   isError,
  //   updateProfile,
  //   verifySelf,
  // } = useUserManagement();

  const [selfApp, setSelfApp] = useState<SelfApp | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  useEffect(() => {
    const id = uuidv4();
    const API_URL = import.meta.env.VITE_API_URL;
    setSelfApp(
      new SelfAppBuilder({
        appName: "Dezentra",
        scope: "dezentra-scope",
        endpoint: `${API_URL}/users/verify-self`,
        endpointType: "https",
        logoBase64: FullLogo,
        userId: id,
        disclosures: {
          name: true,
          nationality: true,
          passport_number: true,
          expiry_date: true,
          issuing_state: true,
          minimumAge: 18,
        },
      }).build() as SelfApp
    );
  }, [user?._id]);

  const handleVerificationSuccess = async () => {
    // verificationData: {
    //   proof: any;
    //   publicSignals: any;
    // }
    showSnackbar("Verification successful", "success");
    // setIsVerifying(true);
    // try {
    //   const success = await verifySelf(verificationData, true);
    //   if (success) {
    //     await fetchProfile(false, true);
    //     onClose();
    //   }
    // } catch (error) {
    //   console.error("Verification failed:", error);
    // } finally {
    //   setIsVerifying(false);
    // }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Passport Verification">
      {!selfApp ? (
        <p className="text-sm text-gray-400 mb-2">
          Unable to verify via the Self app at the moment, please check back
          after some time.
        </p>
      ) : isMobile ? (
        <div>
          <p className="text-sm text-gray-400 mb-2">
            You're on mobile. Tap the button below to verify via the Self app.
          </p>
          <a
            href={getUniversalLink(selfApp)}
            target="_blank"
            rel="noopener noreferrer"
            className="mx-auto inline-block bg-Red text-white text-sm font-medium px-4 py-2 rounded-lg transition hover:bg-[#e02d37]"
          >
            Verify Identity via Self App
          </a>
        </div>
      ) : (
        <div>
          <p className="text-sm text-gray-400 mb-2">
            Scan the QR code below to verify your account.
          </p>
          {isVerifying && (
            <div className="text-center mb-4">
              <p className="text-sm text-yellow-400">
                Processing verification...
              </p>
            </div>
          )}
          <SelfQRcodeWrapper
            selfApp={selfApp as any}
            onSuccess={handleVerificationSuccess}
            onError={() => {
              console.error("Error scanning QR code");
              setIsVerifying(false);
            }}
            size={300}
            darkMode={false}
          />
        </div>
      )}
    </Modal>
  );
}

export default SefldVerification;
